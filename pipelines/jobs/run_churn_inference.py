"""
run_churn_inference.py
----------------------
Loads the trained donor churn model, runs feature engineering (copied exactly
from donor-churn-classifier.ipynb), scores active donors, and writes results
to the donor_churn_scores SQL table.
"""

import os
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

warnings.filterwarnings('ignore')

# ── .env lives one level above jobs/ ─────────────────────────────────────────
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

# ── Helpers ───────────────────────────────────────────────────────────────────
def _bool_to_int(s):
    return s.astype(str).str.lower().isin(['1', 'true']).astype(int)


def main():
    start = datetime.now(timezone.utc)
    print(f'[{start.isoformat()}] run_churn_inference.py starting...')

    try:
        # ── DB connection ─────────────────────────────────────────────────────
        server   = os.environ['AZURE_SQL_SERVER']
        database = os.environ['AZURE_SQL_DATABASE']
        username = os.environ['AZURE_SQL_USERNAME']
        password = os.environ['AZURE_SQL_PASSWORD']

        _host, _, _port = server.partition(',')
        engine = create_engine(
            f"mssql+pymssql://{username}:{password}@{_host}:{_port or 1433}/{database}"
        )

        # ── Load tables ───────────────────────────────────────────────────────
        supporters   = pd.read_sql("SELECT * FROM supporters", engine)
        donations    = pd.read_sql("SELECT * FROM donations", engine)
        social_posts = pd.read_sql("SELECT * FROM social_media_posts", engine)
        allocations  = pd.read_sql("SELECT * FROM donation_allocations", engine)

        # Parse date columns
        supporters['first_donation_date'] = pd.to_datetime(supporters['first_donation_date'])
        supporters['created_at']          = pd.to_datetime(supporters['created_at'])
        donations['donation_date']        = pd.to_datetime(donations['donation_date'])
        donations['is_recurring']         = donations['is_recurring'].astype(str).str.lower().isin(['1', 'true']).astype(int)
        social_posts['created_at']        = pd.to_datetime(social_posts['created_at'])

        print(f'supporters:   {supporters.shape}')
        print(f'donations:    {donations.shape}')
        print(f'social_posts: {social_posts.shape}')
        print(f'allocations:  {allocations.shape}')

        # ── CHURN LABEL ENGINEERING — TEMPORAL HOLDOUT ───────────────────────
        CHURN_DAYS = 180

        reference_date = donations['donation_date'].max()
        cutoff_date    = reference_date - pd.Timedelta(days=CHURN_DAYS)

        print(f'Reference date : {reference_date.date()}')
        print(f'Cutoff date    : {cutoff_date.date()}  (features built from donations before this date)')
        print(f'Label window   : {cutoff_date.date()} → {reference_date.date()}')

        # Pre-cutoff donations only — everything the model is "allowed" to see
        pre_cutoff = donations[donations['donation_date'] < cutoff_date].copy()
        print(f'\nPre-cutoff donations: {len(pre_cutoff)} of {len(donations)} total')

        # Per-donor aggregates from pre-cutoff donations
        donor_stats = (
            pre_cutoff
            .groupby('supporter_id')
            .agg(
                total_donations       = ('donation_id', 'count'),
                total_monetary_value  = ('amount', 'sum'),
                avg_donation_amount   = ('amount', 'mean'),
                max_donation_amount   = ('amount', 'max'),
                std_donation_amount   = ('amount', 'std'),
                first_donation_date   = ('donation_date', 'min'),
                last_donation_date    = ('donation_date', 'max'),
                num_monetary          = ('donation_type', lambda x: (x == 'Monetary').sum()),
                num_inkind            = ('donation_type', lambda x: (x == 'InKind').sum()),
                num_time              = ('donation_type', lambda x: (x == 'Time').sum()),
                num_skills            = ('donation_type', lambda x: (x == 'Skills').sum()),
                num_social_media      = ('donation_type', lambda x: (x == 'SocialMedia').sum()),
                num_recurring         = ('is_recurring', 'sum'),
                num_campaigns         = ('campaign_name', lambda x: x.notna().sum()),
                unique_campaigns      = ('campaign_name', 'nunique'),
                num_direct            = ('channel_source', lambda x: (x == 'Direct').sum()),
                num_social_referral   = ('channel_source', lambda x: (x == 'SocialMedia').sum()),
            )
            .reset_index()
        )

        # Recency as of cutoff_date — valid feature (does NOT encode the label)
        donor_stats['days_since_last_donation'] = (cutoff_date - donor_stats['last_donation_date']).dt.days
        donor_stats['donor_lifespan_days']      = (donor_stats['last_donation_date'] - donor_stats['first_donation_date']).dt.days
        donor_stats['avg_gap_days'] = np.where(
            donor_stats['total_donations'] > 1,
            donor_stats['donor_lifespan_days'] / (donor_stats['total_donations'] - 1),
            np.nan
        )

        # Label: did this donor make ANY donation on or after cutoff_date?
        post_cutoff_donors = set(
            donations[donations['donation_date'] >= cutoff_date]['supporter_id'].unique()
        )
        donor_stats['is_churned'] = (~donor_stats['supporter_id'].isin(post_cutoff_donors)).astype(int)

        # Donation trend ratio: avg amount 2nd half vs 1st half of pre-cutoff history
        def _trend_ratio(group):
            monetary = group[group['donation_type'] == 'Monetary'].sort_values('donation_date')
            if len(monetary) < 2:
                return pd.Series({'donation_trend_ratio': float('nan')})
            mid = len(monetary) // 2
            first_half_avg  = monetary['amount'].iloc[:mid].mean()
            second_half_avg = monetary['amount'].iloc[mid:].mean()
            if first_half_avg == 0:
                return pd.Series({'donation_trend_ratio': float('nan')})
            return pd.Series({'donation_trend_ratio': second_half_avg / first_half_avg})

        trend_ratios = (
            pre_cutoff.groupby('supporter_id')
            .apply(_trend_ratio, include_groups=False)
            .reset_index()
        )
        donor_stats = donor_stats.merge(trend_ratios, on='supporter_id', how='left')

        print(f'\nDonors with pre-cutoff history: {len(donor_stats)}')
        print(f'Churned (no post-cutoff donation): {donor_stats["is_churned"].sum()} ({donor_stats["is_churned"].mean():.1%})')
        print(f'Active (donated after cutoff):     {(~donor_stats["is_churned"].astype(bool)).sum()}')

        # ── MERGE SUPPORTER PROFILE FEATURES ─────────────────────────────────
        df = donor_stats.merge(supporters, on='supporter_id', how='left')

        # Account age as of cutoff_date (consistent with observation window)
        df['account_age_days'] = (cutoff_date - df['created_at']).dt.days

        # Donation type diversity
        df['donation_type_diversity'] = (
            (df['num_monetary'] > 0).astype(int) +
            (df['num_inkind']   > 0).astype(int) +
            (df['num_time']     > 0).astype(int) +
            (df['num_skills']   > 0).astype(int) +
            (df['num_social_media'] > 0).astype(int)
        )

        df['recurring_ratio']          = df['num_recurring'] / df['total_donations']
        df['campaign_engagement_ratio'] = df['num_campaigns'] / df['total_donations']

        print(f'After merging supporter profiles: {df.shape}')

        # ── ALLOCATION FEATURES (pre-cutoff donations only) ───────────────────
        pre_cutoff_alloc = allocations.merge(
            pre_cutoff[['donation_id', 'supporter_id']], on='donation_id', how='inner'
        )
        program_features = (
            pre_cutoff_alloc.groupby('supporter_id')['program_area']
            .agg(
                program_area_diversity='nunique',
                preferred_program=lambda x: x.mode().iloc[0] if len(x) > 0 else 'Unknown'
            )
            .reset_index()
        )
        df = df.merge(program_features, on='supporter_id', how='left')
        df['program_area_diversity'] = df['program_area_diversity'].fillna(1)
        df['preferred_program']      = df['preferred_program'].fillna('Unknown')

        # ── CHANNEL DIVERSITY (pre-cutoff donations only) ─────────────────────
        channel_diversity = (
            pre_cutoff.groupby('supporter_id')['channel_source']
            .nunique()
            .rename('channel_diversity')
            .reset_index()
        )
        df = df.merge(channel_diversity, on='supporter_id', how='left')

        print(f'After allocation + channel diversity: {df.shape}')

        # ── SOCIAL MEDIA ENGAGEMENT FEATURE (pre-cutoff only) ────────────────
        social_referral_counts = (
            pre_cutoff[pre_cutoff['channel_source'] == 'SocialMedia']
            .groupby('supporter_id')['donation_id']
            .count()
            .rename('social_referral_donations')
            .reset_index()
        )

        df = df.merge(social_referral_counts, on='supporter_id', how='left')
        df['social_referral_donations'] = df['social_referral_donations'].fillna(0)

        print('Social media referral feature added.')

        # ── FEATURE SELECTION ─────────────────────────────────────────────────
        CATEGORICAL_FEATURES = ['supporter_type', 'relationship_type', 'acquisition_channel', 'status', 'preferred_program']

        NUMERIC_FEATURES = [
            'days_since_last_donation',
            'total_donations',
            'total_monetary_value',
            'avg_donation_amount',
            'max_donation_amount',
            'num_monetary',
            'num_inkind',
            'num_time',
            'num_skills',
            'num_social_media',
            'num_recurring',
            'num_campaigns',
            'unique_campaigns',
            'donor_lifespan_days',
            'avg_gap_days',
            'donation_type_diversity',
            'recurring_ratio',
            'campaign_engagement_ratio',
            'account_age_days',
            'social_referral_donations',
            'program_area_diversity',
            'channel_diversity',
            'std_donation_amount',
            'donation_trend_ratio',
        ]

        TARGET = 'is_churned'
        X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
        y = df[TARGET]

        print(f'Feature matrix (raw): {X.shape}  ({len(NUMERIC_FEATURES)} numeric, {len(CATEGORICAL_FEATURES)} categorical)')

        # ── Load saved model ──────────────────────────────────────────────────
        model_dir = Path(__file__).parent.parent / 'donor_churn_pipeline'
        model     = joblib.load(model_dir / 'donor_churn_model.pkl')
        features  = joblib.load(model_dir / 'donor_churn_features.pkl')
        print(f'Model loaded from: {model_dir / "donor_churn_model.pkl"}')

        # ── GENERATE CHURN RISK SCORES — ACTIVE DONORS ONLY ──────────────────
        #
        # Active = donated within CHURN_DAYS of reference_date (i.e., after cutoff_date).
        # Features are recomputed from full donation history (reference_date = "now").
        # The model predicts which active donors are at risk of lapsing next.

        # Donors currently active (donated after cutoff_date)
        active_donor_ids = set(
            donations[donations['donation_date'] >= cutoff_date]['supporter_id'].unique()
        )

        # Build scoring features from FULL history (observation date = reference_date)
        score_stats = (
            donations
            .groupby('supporter_id')
            .agg(
                total_donations       = ('donation_id', 'count'),
                total_monetary_value  = ('amount', 'sum'),
                avg_donation_amount   = ('amount', 'mean'),
                max_donation_amount   = ('amount', 'max'),
                std_donation_amount   = ('amount', 'std'),
                first_donation_date   = ('donation_date', 'min'),
                last_donation_date    = ('donation_date', 'max'),
                num_monetary          = ('donation_type', lambda x: (x == 'Monetary').sum()),
                num_inkind            = ('donation_type', lambda x: (x == 'InKind').sum()),
                num_time              = ('donation_type', lambda x: (x == 'Time').sum()),
                num_skills            = ('donation_type', lambda x: (x == 'Skills').sum()),
                num_social_media      = ('donation_type', lambda x: (x == 'SocialMedia').sum()),
                num_recurring         = ('is_recurring', 'sum'),
                num_campaigns         = ('campaign_name', lambda x: x.notna().sum()),
                unique_campaigns      = ('campaign_name', 'nunique'),
                num_direct            = ('channel_source', lambda x: (x == 'Direct').sum()),
                num_social_referral   = ('channel_source', lambda x: (x == 'SocialMedia').sum()),
            )
            .reset_index()
        )

        # Recency as of reference_date (scoring time = "today")
        score_stats['days_since_last_donation'] = (reference_date - score_stats['last_donation_date']).dt.days
        score_stats['donor_lifespan_days']      = (score_stats['last_donation_date'] - score_stats['first_donation_date']).dt.days
        score_stats['avg_gap_days'] = np.where(
            score_stats['total_donations'] > 1,
            score_stats['donor_lifespan_days'] / (score_stats['total_donations'] - 1),
            np.nan
        )

        score_trend = (
            donations.groupby('supporter_id')
            .apply(_trend_ratio, include_groups=False)
            .reset_index()
        )
        score_stats = score_stats.merge(score_trend, on='supporter_id', how='left')

        # Merge supporter profile
        df_score = score_stats.merge(supporters, on='supporter_id', how='left')
        df_score['account_age_days'] = (reference_date - df_score['created_at']).dt.days
        df_score['donation_type_diversity'] = (
            (df_score['num_monetary'] > 0).astype(int) +
            (df_score['num_inkind']   > 0).astype(int) +
            (df_score['num_time']     > 0).astype(int) +
            (df_score['num_skills']   > 0).astype(int) +
            (df_score['num_social_media'] > 0).astype(int)
        )
        df_score['recurring_ratio']           = df_score['num_recurring'] / df_score['total_donations']
        df_score['campaign_engagement_ratio'] = df_score['num_campaigns'] / df_score['total_donations']

        # Social referral (full history)
        social_ref_score = (
            donations[donations['channel_source'] == 'SocialMedia']
            .groupby('supporter_id')['donation_id'].count()
            .rename('social_referral_donations').reset_index()
        )
        df_score = df_score.merge(social_ref_score, on='supporter_id', how='left')
        df_score['social_referral_donations'] = df_score['social_referral_donations'].fillna(0)

        # Allocation features (full history)
        alloc_score = allocations.merge(
            donations[['donation_id', 'supporter_id']], on='donation_id', how='left'
        )
        prog_score = (
            alloc_score.groupby('supporter_id')['program_area']
            .agg(program_area_diversity='nunique',
                 preferred_program=lambda x: x.mode().iloc[0] if len(x) > 0 else 'Unknown')
            .reset_index()
        )
        df_score = df_score.merge(prog_score, on='supporter_id', how='left')
        df_score['program_area_diversity'] = df_score['program_area_diversity'].fillna(1)
        df_score['preferred_program']      = df_score['preferred_program'].fillna('Unknown')

        # Channel diversity (full history)
        ch_div_score = (
            donations.groupby('supporter_id')['channel_source']
            .nunique().rename('channel_diversity').reset_index()
        )
        df_score = df_score.merge(ch_div_score, on='supporter_id', how='left')

        # Filter to active donors only
        df_score = df_score[df_score['supporter_id'].isin(active_donor_ids)].copy()
        print(f'Active donors to score: {len(df_score)} of {len(score_stats)} total')

        # Score — pipeline handles encoding internally
        X_score = df_score[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
        df_score['churn_probability'] = model.predict_proba(X_score)[:, 1]
        df_score['churn_risk_label'] = pd.qcut(
            df_score['churn_probability'],
            q=3,
            labels=['Low', 'Medium', 'High'],
            duplicates='drop'
        )

        scored_at = datetime.now(timezone.utc)
        churn_scores = (
            df_score[['supporter_id', 'churn_probability', 'churn_risk_label']]
            .copy()
            .assign(
                churn_probability=lambda d: d['churn_probability'].round(4),
                scored_at=scored_at
            )
            .sort_values('churn_probability', ascending=False)
            .reset_index(drop=True)
        )

        # ── Write to SQL ──────────────────────────────────────────────────────
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE donor_churn_scores"))
            conn.commit()

        churn_scores.drop(columns=['scored_at']).to_sql(
            'donor_churn_scores',
            engine,
            if_exists='append',
            index=False
        )
        print(f'\nWrote {len(churn_scores)} rows to donor_churn_scores')

        # ── Summary ───────────────────────────────────────────────────────────
        print(f'\nDonors scored: {len(churn_scores)}')
        print('\nRisk distribution:')
        print(churn_scores['churn_risk_label'].value_counts().sort_index().to_string())

        end = datetime.now(timezone.utc)
        elapsed = (end - start).total_seconds()
        print(f'\n[{end.isoformat()}] Completed in {elapsed:.1f}s')

    except Exception as e:
        print(f'ERROR: {e}')
        raise


if __name__ == '__main__':
    main()
