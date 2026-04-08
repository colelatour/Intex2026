"""
run_social_inference.py
-----------------------
Re-runs the OLS model fit and extracts feature importances from the predictive
model (copied exactly from social-media-impact.ipynb), then combines both into
a single DataFrame and writes it to social_media_recommendations.

Unlike the other two pipelines, this script does NOT score individual records.
It re-derives the coefficient/importance table from the full dataset on each run.
"""

import os
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import statsmodels.api as sm
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
    print(f'[{start.isoformat()}] run_social_inference.py starting...')

    try:
        # ── DB connection ─────────────────────────────────────────────────────
        server   = os.environ['AZURE_SQL_SERVER']
        database = os.environ['AZURE_SQL_DATABASE']
        username = os.environ['AZURE_SQL_USERNAME']
        password = os.environ['AZURE_SQL_PASSWORD']

        engine = create_engine(
            f"mssql+pymssql://{username}:{password}@{server}/{database}"
        )

        # ── Load tables ───────────────────────────────────────────────────────
        posts     = pd.read_sql("SELECT * FROM social_media_posts", engine)
        donations = pd.read_sql("SELECT * FROM donations", engine)

        # Parse date columns
        posts['created_at']        = pd.to_datetime(posts['created_at'])
        donations['donation_date'] = pd.to_datetime(donations['donation_date'])

        # Boolean columns → int (handles 'True'/'False' strings from SQL Server)
        posts['has_call_to_action']      = _bool_to_int(posts['has_call_to_action'])
        posts['features_resident_story'] = _bool_to_int(posts['features_resident_story'])
        posts['is_boosted']              = _bool_to_int(posts['is_boosted'])

        # Numeric columns
        for col in ['donation_referrals', 'boost_budget_php', 'post_hour', 'num_hashtags',
                    'caption_length', 'estimated_donation_value_php']:
            if col in posts.columns:
                posts[col] = pd.to_numeric(posts[col], errors='coerce')
        donations['amount'] = pd.to_numeric(donations['amount'], errors='coerce')

        print(f'posts:     {posts.shape}')
        print(f'donations: {donations.shape}')

        # ── OUTLIER WINSORIZING (same as notebook Cell 4) ─────────────────────
        # The dataset contains one extreme outlier: a WhatsApp ImpactStory featuring
        # a resident story that drove 458 referrals and ~2.4M PHP in estimated
        # donations. Winsorize at the 99th percentile for modeling.
        p99 = posts['donation_referrals'].quantile(0.99)
        posts['donation_referrals_raw'] = posts['donation_referrals'].copy()
        posts['donation_referrals']     = posts['donation_referrals'].clip(upper=p99)
        posts['log_donation_referrals'] = np.log1p(posts['donation_referrals'])
        posts['log_donation_value']     = np.log1p(
            posts['estimated_donation_value_php'].clip(
                upper=posts['estimated_donation_value_php'].quantile(0.99)
            )
        )

        print(f'After winsorizing — donation_referrals max: {posts["donation_referrals"].max():.1f}')

        # ── FILL STRUCTURAL NaNs (Cell 10) ────────────────────────────────────
        posts['boost_budget_php']    = posts['boost_budget_php'].fillna(0)
        posts['call_to_action_type'] = posts['call_to_action_type'].fillna('None')

        CATEGORICAL_FEATURES = ['platform', 'post_type', 'media_type', 'content_topic',
                                 'sentiment_tone', 'day_of_week', 'call_to_action_type']
        NUMERIC_FEATURES     = ['post_hour', 'num_hashtags', 'caption_length',
                                 'has_call_to_action', 'features_resident_story',
                                 'is_boosted', 'boost_budget_php']

        print('NUMERIC_FEATURES:', NUMERIC_FEATURES)
        print('CATEGORICAL_FEATURES:', CATEGORICAL_FEATURES)

        # ── OLS MODEL FIT (Cell 12) ───────────────────────────────────────────
        # get_dummies with drop_first=True for OLS — intentional, not a pipeline error.
        # Reference categories (dropped): platform_Facebook, post_type_Campaign,
        # media_type_Carousel, content_topic_AwarenessRaising, sentiment_tone_Celebratory,
        # day_of_week_Friday, call_to_action_type_DonateNow
        X_ols = pd.get_dummies(posts[NUMERIC_FEATURES + CATEGORICAL_FEATURES],
                                columns=CATEGORICAL_FEATURES, drop_first=True)
        X_ols = sm.add_constant(X_ols.astype(float))
        y_ols = posts['log_donation_referrals']

        ols_model = sm.OLS(y_ols, X_ols).fit()
        print(ols_model.summary())
        print(f'\nR-squared: {ols_model.rsquared:.3f}')
        print(f'Adj R-squared: {ols_model.rsquared_adj:.3f}')

        # ── PREDICTIVE MODEL (Cell 18-21 + 29) ───────────────────────────────
        from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
        from sklearn.preprocessing import StandardScaler
        from sklearn.pipeline import Pipeline
        from sklearn.compose import ColumnTransformer
        from sklearn.preprocessing import OneHotEncoder
        from sklearn.impute import SimpleImputer
        from sklearn.linear_model import LogisticRegression
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from xgboost import XGBClassifier

        posts['drove_donation'] = (posts['donation_referrals_raw'] > 0).astype(int)
        print(f'Posts that drove a donation: {posts["drove_donation"].sum()} ({posts["drove_donation"].mean():.1%})')

        X = posts[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
        y = posts['drove_donation']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y)

        print(f'Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows')

        def make_pipeline(classifier):
            preprocessor = ColumnTransformer([
                ('num', Pipeline([
                    ('imputer', SimpleImputer(strategy='median')),
                    ('scaler',  StandardScaler())
                ]), NUMERIC_FEATURES),
                ('cat', Pipeline([
                    ('imputer', SimpleImputer(strategy='most_frequent')),
                    ('onehot',  OneHotEncoder(handle_unknown='ignore', sparse_output=False))
                ]), CATEGORICAL_FEATURES)
            ])
            return Pipeline([('preprocessor', preprocessor), ('clf', classifier)])

        model_configs = {
            'Logistic Regression': make_pipeline(LogisticRegression(max_iter=1000, random_state=42)),
            'Random Forest':       make_pipeline(RandomForestClassifier(n_estimators=200, random_state=42)),
            'Gradient Boosting':   make_pipeline(GradientBoostingClassifier(n_estimators=200, random_state=42)),
            'XGBoost':             make_pipeline(XGBClassifier(n_estimators=200, eval_metric='logloss',
                                                                random_state=42, verbosity=0)),
        }

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        results = {}
        for name, pipe in model_configs.items():
            auc_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring='roc_auc')
            results[name] = {'CV AUC': auc_scores.mean()}
            print(f'{name:25s} | AUC {auc_scores.mean():.3f}')

        results_df = pd.DataFrame(results).T
        best_model_name = results_df['CV AUC'].idxmax()
        print(f'\nBest model by CV AUC: {best_model_name}')

        # Fit best model on full training set, evaluate on held-out test set
        final_model = model_configs[best_model_name]
        final_model.fit(X_train, y_train)

        # Re-fit production model on full dataset (not just train split)
        final_model_production = model_configs[best_model_name]
        final_model_production.fit(X, y)

        # ── EXTRACT FEATURE IMPORTANCES (Cell 24) ────────────────────────────
        clf = final_model.named_steps['clf']
        raw_names     = final_model.named_steps['preprocessor'].get_feature_names_out()
        feature_names = [n.split('__', 1)[1] for n in raw_names]

        if hasattr(clf, 'feature_importances_'):
            importances = clf.feature_importances_
        elif hasattr(clf, 'coef_'):
            importances = np.abs(clf.coef_[0])
        else:
            importances = np.zeros(len(feature_names))

        feat_imp = pd.Series(importances, index=feature_names).sort_values(ascending=False)
        print('Top 10 features:')
        print(feat_imp.head(10).round(4).to_string())

        # ── BUILD COMBINED TABLE ──────────────────────────────────────────────
        scored_at = datetime.now(timezone.utc)

        # OLS results table
        ols_df = pd.DataFrame({
            'feature':     ols_model.params.index,
            'coefficient': ols_model.params.values,
            'p_value':     ols_model.pvalues.values,
            'significant': (ols_model.pvalues < 0.05).values,
            'model_type':  'OLS',
            'scored_at':   scored_at,
        })

        # Predictive feature importances
        pred_df = pd.DataFrame({
            'feature':     feat_imp.index,
            'coefficient': feat_imp.values,   # importance score in 'coefficient' column
            'p_value':     np.nan,
            'significant': False,
            'model_type':  'Predictive',
            'scored_at':   scored_at,
        })

        combined = pd.concat([ols_df, pred_df], ignore_index=True)

        # ── Write to SQL ──────────────────────────────────────────────────────
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE social_media_recommendations"))
            conn.commit()

        combined.drop(columns=['scored_at']).to_sql(
            'social_media_recommendations',
            engine,
            if_exists='append',
            index=False
        )
        print(f'\nWrote {len(combined)} rows to social_media_recommendations')

        # ── Summary ───────────────────────────────────────────────────────────
        sig_features  = ols_df[ols_df['significant']]
        top3_abs_coef = sig_features.reindex(
            sig_features['coefficient'].abs().sort_values(ascending=False).index
        ).head(3)

        print(f'\nSignificant OLS features (p < 0.05): {len(sig_features)}')
        print('\nTop 3 significant features by |coefficient|:')
        for _, row in top3_abs_coef.iterrows():
            print(f'  {row["feature"]:50s}  coef={row["coefficient"]:+.4f}  p={row["p_value"]:.4f}')

        end = datetime.now(timezone.utc)
        elapsed = (end - start).total_seconds()
        print(f'\n[{end.isoformat()}] Completed in {elapsed:.1f}s')

    except Exception as e:
        print(f'ERROR: {e}')
        raise


if __name__ == '__main__':
    main()
