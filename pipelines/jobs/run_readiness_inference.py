"""
run_readiness_inference.py
--------------------------
Loads the trained reintegration readiness model, runs feature engineering
(copied exactly from reintegration-readiness.ipynb), scores active residents
(case_status == 'Active'), and writes results to resident_readiness_scores.
"""

import os
import urllib
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
    print(f'[{start.isoformat()}] run_readiness_inference.py starting...')

    try:
        # ── DB connection ─────────────────────────────────────────────────────
        server   = os.environ['AZURE_SQL_SERVER']
        database = os.environ['AZURE_SQL_DATABASE']
        username = os.environ['AZURE_SQL_USERNAME']
        password = os.environ['AZURE_SQL_PASSWORD']

        params = urllib.parse.quote_plus(
            f"DRIVER={{ODBC Driver 18 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
        )
        engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

        # ── Load tables ───────────────────────────────────────────────────────
        residents          = pd.read_sql("SELECT * FROM residents", engine)
        process_recs       = pd.read_sql("SELECT * FROM process_recordings", engine)
        health_records     = pd.read_sql("SELECT * FROM health_wellbeing_records", engine)
        education_records  = pd.read_sql("SELECT * FROM education_records", engine)
        intervention_plans = pd.read_sql("SELECT * FROM intervention_plans", engine)
        home_visits        = pd.read_sql("SELECT * FROM home_visitations", engine)
        incident_reports   = pd.read_sql("SELECT * FROM incident_reports", engine)

        # Parse date columns
        residents['date_of_birth']       = pd.to_datetime(residents['date_of_birth'])
        residents['date_of_admission']   = pd.to_datetime(residents['date_of_admission'])
        residents['date_closed']         = pd.to_datetime(residents['date_closed'])
        residents['created_at']          = pd.to_datetime(residents['created_at'])
        process_recs['session_date']     = pd.to_datetime(process_recs['session_date'])
        health_records['record_date']    = pd.to_datetime(health_records['record_date'])
        education_records['record_date'] = pd.to_datetime(education_records['record_date'])
        intervention_plans['target_date'] = pd.to_datetime(intervention_plans['target_date'])
        intervention_plans['created_at']  = pd.to_datetime(intervention_plans['created_at'])
        intervention_plans['updated_at']  = pd.to_datetime(intervention_plans['updated_at'])
        home_visits['visit_date']              = pd.to_datetime(home_visits['visit_date'])
        incident_reports['incident_date']      = pd.to_datetime(incident_reports['incident_date'])
        incident_reports['resolution_date']    = pd.to_datetime(incident_reports['resolution_date'])

        # Boolean columns → int (handles 'True'/'False' strings from SQL Server)
        for col in ['is_pwd', 'has_special_needs', 'family_is_4ps', 'family_solo_parent', 'family_informal_settler']:
            residents[col] = _bool_to_int(residents[col])
        for col in ['progress_noted', 'concerns_flagged', 'referral_made']:
            process_recs[col] = _bool_to_int(process_recs[col])
        for col in ['medical_checkup_done', 'psychological_checkup_done']:
            health_records[col] = _bool_to_int(health_records[col])
        home_visits['safety_concerns_noted'] = _bool_to_int(home_visits['safety_concerns_noted'])

        # Numeric columns — coerce to float (handles varchar-stored numbers from SQL Server)
        for col in ['general_health_score', 'nutrition_score', 'sleep_quality_score']:
            health_records[col] = pd.to_numeric(health_records[col], errors='coerce')
        for col in ['session_duration_minutes']:
            process_recs[col] = pd.to_numeric(process_recs[col], errors='coerce')
        for col in ['attendance_rate', 'progress_percent']:
            education_records[col] = pd.to_numeric(education_records[col], errors='coerce')

        print(f'residents:          {residents.shape}')
        print(f'process_recs:       {process_recs.shape}')
        print(f'health_records:     {health_records.shape}')
        print(f'education_records:  {education_records.shape}')
        print(f'intervention_plans: {intervention_plans.shape}')
        print(f'home_visits:        {home_visits.shape}')
        print(f'incident_reports:   {incident_reports.shape}')

        # ── LABEL ENGINEERING ─────────────────────────────────────────────────
        READY_STATUSES = ['Completed']

        closed = residents[residents['case_status'] == 'Closed'].copy()
        closed['is_ready'] = closed['reintegration_status'].isin(READY_STATUSES).astype(int)
        active = residents[residents['case_status'] == 'Active'].copy()

        print(f'Closed residents (training pool): {len(closed)}')
        print(f'  Ready (Completed): {closed["is_ready"].sum()}')
        print(f'  Not ready:         {(~closed["is_ready"].astype(bool)).sum()}')
        print(f'Active residents (scoring pool):  {len(active)}')
        print(f'\nClass balance: {closed["is_ready"].mean():.1%} ready')

        # ── FEATURE ENGINEERING — RESIDENTS TABLE ────────────────────────────
        RISK_LEVEL_MAP = {'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3}

        res_feat = closed[['resident_id']].copy()

        # Length of stay and age at admission
        res_feat['length_of_stay_days']    = (closed['date_closed'] - closed['date_of_admission']).dt.days.values
        res_feat['age_at_admission_years'] = ((closed['date_of_admission'] - closed['date_of_birth']).dt.days / 365.25).values

        # Risk reduction: positive = improved (initial was higher severity than current)
        res_feat['risk_reduction'] = (
            closed['initial_risk_level'].map(RISK_LEVEL_MAP).values -
            closed['current_risk_level'].map(RISK_LEVEL_MAP).values
        )

        # Boolean flags → int
        for col in ['is_pwd', 'has_special_needs', 'family_is_4ps', 'family_solo_parent', 'family_informal_settler']:
            res_feat[col] = closed[col].astype(int).values

        # Categorical features
        res_feat['case_category']   = closed['case_category'].values
        res_feat['referral_source'] = closed['referral_source'].values
        res_feat['safehouse_id']    = closed['safehouse_id'].astype(str).values

        print(f'Residents base features: {res_feat.shape}')

        # ── FEATURE ENGINEERING — PROCESS RECORDINGS ─────────────────────────
        EMOTION_MAP = {
            'Distressed': 0, 'Angry': 1, 'Withdrawn': 2, 'Anxious': 3,
            'Sad': 4, 'Calm': 5, 'Hopeful': 6, 'Happy': 7
        }

        closed_ids = set(closed['resident_id'])
        sess = process_recs[process_recs['resident_id'].isin(closed_ids)].copy()
        sess['start_enc']     = sess['emotional_state_observed'].map(EMOTION_MAP)
        sess['end_enc']       = sess['emotional_state_end'].map(EMOTION_MAP)
        sess['emotion_delta'] = sess['end_enc'] - sess['start_enc']

        proc_feat = sess.groupby('resident_id').agg(
            total_sessions              = ('recording_id', 'count'),
            progress_rate               = ('progress_noted', 'mean'),
            concerns_rate               = ('concerns_flagged', 'mean'),
            referral_rate               = ('referral_made', 'mean'),
            avg_session_duration        = ('session_duration_minutes', 'mean'),
            emotional_improvement_score = ('emotion_delta', 'mean'),
            pct_individual_sessions     = ('session_type', lambda x: (x == 'Individual').mean()),
        ).reset_index()

        # Recent progress rate: mean of progress_noted for the most recent 30% of sessions
        def recent_progress_fn(grp):
            grp = grp.sort_values('session_date')
            n = max(1, int(len(grp) * 0.3))
            return grp['progress_noted'].tail(n).mean()

        recent_prog = (
            sess.groupby('resident_id')
            .apply(recent_progress_fn, include_groups=False)
            .reset_index(name='recent_progress_rate')
        )
        proc_feat = proc_feat.merge(recent_prog, on='resident_id', how='left')

        print(f'Process recording features: {proc_feat.shape}')

        # ── FEATURE ENGINEERING — HEALTH & WELLBEING ─────────────────────────
        hlth = health_records[health_records['resident_id'].isin(closed_ids)].copy()

        health_feat = hlth.groupby('resident_id').agg(
            avg_general_health_score   = ('general_health_score', 'mean'),
            avg_nutrition_score        = ('nutrition_score', 'mean'),
            avg_sleep_score            = ('sleep_quality_score', 'mean'),
            pct_medical_checkups       = ('medical_checkup_done', 'mean'),
            pct_psychological_checkups = ('psychological_checkup_done', 'mean'),
        ).reset_index()

        # Health trend: slope of general_health_score over time (positive = improving)
        def health_trend_fn(grp):
            grp = grp.sort_values('record_date')
            scores = grp['general_health_score'].values
            if len(scores) < 2:
                return np.nan
            return np.polyfit(range(len(scores)), scores, 1)[0]

        health_trend = (
            hlth.groupby('resident_id')
            .apply(health_trend_fn, include_groups=False)
            .reset_index(name='health_trend')
        )
        health_feat = health_feat.merge(health_trend, on='resident_id', how='left')

        print(f'Health features: {health_feat.shape}')

        # ── FEATURE ENGINEERING — EDUCATION RECORDS ──────────────────────────
        edu = education_records[education_records['resident_id'].isin(closed_ids)].copy()

        edu_feat = edu.groupby('resident_id').agg(
            avg_attendance_rate   = ('attendance_rate', 'mean'),
            avg_progress_percent  = ('progress_percent', 'mean'),
            pct_completed_courses = ('completion_status', lambda x: (x == 'Completed').mean()),
        ).reset_index()

        # Education trend: slope of progress_percent over time
        def edu_trend_fn(grp):
            grp = grp.sort_values('record_date')
            scores = grp['progress_percent'].values
            if len(scores) < 2:
                return np.nan
            return np.polyfit(range(len(scores)), scores, 1)[0]

        edu_trend = (
            edu.groupby('resident_id')
            .apply(edu_trend_fn, include_groups=False)
            .reset_index(name='education_trend')
        )
        edu_feat = edu_feat.merge(edu_trend, on='resident_id', how='left')

        print(f'Education features: {edu_feat.shape}')

        # ── FEATURE ENGINEERING — INTERVENTION PLANS ─────────────────────────
        plans = intervention_plans[intervention_plans['resident_id'].isin(closed_ids)].copy()

        plan_feat = plans.groupby('resident_id').agg(
            total_plans        = ('plan_id', 'count'),
            pct_plans_achieved = ('status', lambda x: (x == 'Achieved').mean()),
        ).reset_index()

        # Safety plans
        safety_rate = (
            plans[plans['plan_category'] == 'Safety']
            .groupby('resident_id')['status']
            .apply(lambda x: (x == 'Achieved').mean())
            .reset_index(name='pct_safety_plans_achieved')
        )
        plan_feat = plan_feat.merge(safety_rate, on='resident_id', how='left')
        plan_feat['pct_safety_plans_achieved'] = plan_feat['pct_safety_plans_achieved'].fillna(0)

        # Reintegration / Psychosocial: not in current schema — zero-filled for compatibility
        plan_feat['has_reintegration_plan']          = 0
        plan_feat['reintegration_plan_achieved']     = 0
        plan_feat['pct_psychosocial_plans_achieved'] = 0.0

        print(f'Intervention plan features: {plan_feat.shape}')

        # ── FEATURE ENGINEERING — HOME VISITATIONS ───────────────────────────
        visits = home_visits[home_visits['resident_id'].isin(closed_ids)].copy()

        visit_feat = visits.groupby('resident_id').agg(
            total_visits                  = ('visitation_id', 'count'),
            pct_favorable_outcomes        = ('visit_outcome', lambda x: (x == 'Favorable').mean()),
            pct_highly_cooperative_family = ('family_cooperation_level', lambda x: (x == 'Highly Cooperative').mean()),
            pct_safety_concerns           = ('safety_concerns_noted', 'mean'),
            has_reintegration_assessment  = ('visit_type', lambda x: int((x == 'Reintegration Assessment').any())),
        ).reset_index()

        # Most recent visit outcome (categorical feature — captures current trajectory)
        most_recent_outcome = (
            visits.sort_values('visit_date')
            .groupby('resident_id')
            .last()[['visit_outcome']]
            .reset_index()
            .rename(columns={'visit_outcome': 'most_recent_visit_outcome'})
        )
        visit_feat = visit_feat.merge(most_recent_outcome, on='resident_id', how='left')

        print(f'Home visitation features: {visit_feat.shape}')

        # ── FEATURE ENGINEERING — INCIDENT REPORTS ───────────────────────────
        inc = incident_reports[incident_reports['resident_id'].isin(closed_ids)].copy()

        inc_feat = inc.groupby('resident_id').agg(
            total_incidents       = ('incident_id', 'count'),
            pct_high_severity     = ('severity', lambda x: (x == 'High').mean()),
            has_selfharm_incident = ('incident_type', lambda x: int((x == 'SelfHarm').any())),
            has_runaway_attempt   = ('incident_type', lambda x: int((x == 'RunawayAttempt').any())),
            last_incident_date    = ('incident_date', 'max'),
        ).reset_index()

        print(f'Incident features: {inc_feat.shape}')

        # ── MERGE ALL FEATURE GROUPS ──────────────────────────────────────────
        df = closed[['resident_id', 'is_ready', 'date_closed']].merge(res_feat, on='resident_id', how='left')
        df = df.merge(proc_feat, on='resident_id', how='left')
        df = df.merge(health_feat, on='resident_id', how='left')
        df = df.merge(edu_feat, on='resident_id', how='left')
        df = df.merge(plan_feat, on='resident_id', how='left')
        df = df.merge(visit_feat, on='resident_id', how='left')

        # Incidents: merge counts, then compute derived fields
        df = df.merge(inc_feat.drop(columns=['last_incident_date']), on='resident_id', how='left')
        df = df.merge(inc_feat[['resident_id', 'last_incident_date']], on='resident_id', how='left')

        # Fill count/boolean NaNs with 0
        fill_zero_cols = [
            'total_incidents', 'pct_high_severity', 'has_selfharm_incident', 'has_runaway_attempt',
            'total_visits', 'pct_favorable_outcomes', 'pct_highly_cooperative_family',
            'pct_safety_concerns', 'has_reintegration_assessment',
        ]
        df[fill_zero_cols] = df[fill_zero_cols].fillna(0)

        # Derived incident features
        df['incidents_per_month'] = np.where(
            df['length_of_stay_days'] > 0,
            df['total_incidents'] / df['length_of_stay_days'] * 30, 0
        )
        df['days_since_last_incident'] = (df['date_closed'] - df['last_incident_date']).dt.days
        df['days_since_last_incident'] = df['days_since_last_incident'].fillna(df['length_of_stay_days'])

        # Session frequency (sessions per month)
        df['session_frequency'] = np.where(
            df['length_of_stay_days'] > 0,
            df['total_sessions'] / df['length_of_stay_days'] * 30, 0
        )
        df['total_sessions']    = df['total_sessions'].fillna(0)
        df['session_frequency'] = df['session_frequency'].fillna(0)

        print(f'Final feature matrix: {df.shape}')

        # ── FEATURE SELECTION ─────────────────────────────────────────────────
        CATEGORICAL_FEATURES = [
            'case_category',
            'referral_source',
            'safehouse_id',
            'most_recent_visit_outcome',
        ]

        NUMERIC_FEATURES = [
            'length_of_stay_days',
            'age_at_admission_years',
            'risk_reduction',
            'is_pwd',
            'has_special_needs',
            'family_is_4ps',
            'family_solo_parent',
            'family_informal_settler',
            'total_sessions',
            'session_frequency',
            'progress_rate',
            'concerns_rate',
            'referral_rate',
            'avg_session_duration',
            'emotional_improvement_score',
            'pct_individual_sessions',
            'recent_progress_rate',
            'avg_general_health_score',
            'avg_nutrition_score',
            'avg_sleep_score',
            'health_trend',
            'pct_medical_checkups',
            'pct_psychological_checkups',
            'avg_attendance_rate',
            'avg_progress_percent',
            'pct_completed_courses',
            'education_trend',
            'total_plans',
            'pct_plans_achieved',
            'has_reintegration_plan',
            'reintegration_plan_achieved',
            'pct_safety_plans_achieved',
            'pct_psychosocial_plans_achieved',
            'total_visits',
            'pct_favorable_outcomes',
            'pct_highly_cooperative_family',
            'pct_safety_concerns',
            'has_reintegration_assessment',
            'total_incidents',
            'incidents_per_month',
            'pct_high_severity',
            'has_selfharm_incident',
            'has_runaway_attempt',
            'days_since_last_incident',
        ]

        TARGET = 'is_ready'
        X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
        y = df[TARGET]

        print(f'Feature matrix (raw): {X.shape}  ({len(NUMERIC_FEATURES)} numeric, {len(CATEGORICAL_FEATURES)} categorical)')

        # ── Load saved model ──────────────────────────────────────────────────
        model_dir = Path(__file__).parent.parent / 'reintegration-pipeline'
        model     = joblib.load(model_dir / 'reintegration_readiness_model.pkl')
        features  = joblib.load(model_dir / 'reintegration_readiness_features.pkl')
        print(f'Model loaded from: {model_dir / "reintegration_readiness_model.pkl"}')

        # ── SCORE ACTIVE RESIDENTS ────────────────────────────────────────────
        # Refit on full closed-case dataset, then build features for active
        # residents using their full history to date. Score and export.

        # Reference date = today (active residents have no date_closed)
        today     = pd.Timestamp.today().normalize()
        active_ids = set(active['resident_id'])

        # Residents base features
        active_r = active.reset_index(drop=True)
        a_res = active_r[['resident_id']].copy()
        a_res['length_of_stay_days']    = (today - active_r['date_of_admission']).dt.days
        a_res['age_at_admission_years'] = (active_r['date_of_admission'] - active_r['date_of_birth']).dt.days / 365.25
        a_res['risk_reduction'] = (
            active_r['initial_risk_level'].map(RISK_LEVEL_MAP) -
            active_r['current_risk_level'].map(RISK_LEVEL_MAP)
        ).fillna(0)
        for col in ['is_pwd', 'has_special_needs', 'family_is_4ps', 'family_solo_parent', 'family_informal_settler']:
            a_res[col] = active_r[col].astype(int)
        a_res['case_category']   = active_r['case_category'].values
        a_res['referral_source'] = active_r['referral_source'].values
        a_res['safehouse_id']    = active_r['safehouse_id'].astype(str).values

        # Process recordings
        a_sess = process_recs[process_recs['resident_id'].isin(active_ids)].copy()
        a_sess['start_enc']     = a_sess['emotional_state_observed'].map(EMOTION_MAP)
        a_sess['end_enc']       = a_sess['emotional_state_end'].map(EMOTION_MAP)
        a_sess['emotion_delta'] = a_sess['end_enc'] - a_sess['start_enc']

        a_proc = a_sess.groupby('resident_id').agg(
            total_sessions              = ('recording_id', 'count'),
            progress_rate               = ('progress_noted', 'mean'),
            concerns_rate               = ('concerns_flagged', 'mean'),
            referral_rate               = ('referral_made', 'mean'),
            avg_session_duration        = ('session_duration_minutes', 'mean'),
            emotional_improvement_score = ('emotion_delta', 'mean'),
            pct_individual_sessions     = ('session_type', lambda x: (x == 'Individual').mean()),
        ).reset_index()
        a_proc_recent = (
            a_sess.groupby('resident_id')
            .apply(recent_progress_fn, include_groups=False)
            .reset_index(name='recent_progress_rate')
        )
        a_proc = a_proc.merge(a_proc_recent, on='resident_id', how='left')

        # Health
        a_hlth = health_records[health_records['resident_id'].isin(active_ids)].copy()
        a_health = a_hlth.groupby('resident_id').agg(
            avg_general_health_score   = ('general_health_score', 'mean'),
            avg_nutrition_score        = ('nutrition_score', 'mean'),
            avg_sleep_score            = ('sleep_quality_score', 'mean'),
            pct_medical_checkups       = ('medical_checkup_done', 'mean'),
            pct_psychological_checkups = ('psychological_checkup_done', 'mean'),
        ).reset_index()
        a_h_trend = a_hlth.groupby('resident_id').apply(health_trend_fn, include_groups=False).reset_index(name='health_trend')
        a_health = a_health.merge(a_h_trend, on='resident_id', how='left')

        # Education
        a_edu_raw = education_records[education_records['resident_id'].isin(active_ids)].copy()
        a_edu = a_edu_raw.groupby('resident_id').agg(
            avg_attendance_rate   = ('attendance_rate', 'mean'),
            avg_progress_percent  = ('progress_percent', 'mean'),
            pct_completed_courses = ('completion_status', lambda x: (x == 'Completed').mean()),
        ).reset_index()
        a_e_trend = a_edu_raw.groupby('resident_id').apply(edu_trend_fn, include_groups=False).reset_index(name='education_trend')
        a_edu = a_edu.merge(a_e_trend, on='resident_id', how='left')

        # Intervention plans
        a_plans = intervention_plans[intervention_plans['resident_id'].isin(active_ids)].copy()
        a_plan_feat = a_plans.groupby('resident_id').agg(
            total_plans        = ('plan_id', 'count'),
            pct_plans_achieved = ('status', lambda x: (x == 'Achieved').mean()),
        ).reset_index()
        a_safety_rate = (
            a_plans[a_plans['plan_category'] == 'Safety']
            .groupby('resident_id')['status']
            .apply(lambda x: (x == 'Achieved').mean())
            .reset_index(name='pct_safety_plans_achieved')
        )
        a_plan_feat = a_plan_feat.merge(a_safety_rate, on='resident_id', how='left')
        a_plan_feat['pct_safety_plans_achieved']       = a_plan_feat['pct_safety_plans_achieved'].fillna(0)
        a_plan_feat['has_reintegration_plan']          = 0
        a_plan_feat['reintegration_plan_achieved']     = 0
        a_plan_feat['pct_psychosocial_plans_achieved'] = 0.0

        # Home visitations
        a_vis = home_visits[home_visits['resident_id'].isin(active_ids)].copy()
        a_visit_feat = a_vis.groupby('resident_id').agg(
            total_visits                  = ('visitation_id', 'count'),
            pct_favorable_outcomes        = ('visit_outcome', lambda x: (x == 'Favorable').mean()),
            pct_highly_cooperative_family = ('family_cooperation_level', lambda x: (x == 'Highly Cooperative').mean()),
            pct_safety_concerns           = ('safety_concerns_noted', 'mean'),
            has_reintegration_assessment  = ('visit_type', lambda x: int((x == 'Reintegration Assessment').any())),
        ).reset_index()
        a_most_recent = (
            a_vis.sort_values('visit_date')
            .groupby('resident_id').last()[['visit_outcome']]
            .reset_index().rename(columns={'visit_outcome': 'most_recent_visit_outcome'})
        )
        a_visit_feat = a_visit_feat.merge(a_most_recent, on='resident_id', how='left')

        # Incidents
        a_inc = incident_reports[incident_reports['resident_id'].isin(active_ids)].copy()
        a_inc_feat = a_inc.groupby('resident_id').agg(
            total_incidents       = ('incident_id', 'count'),
            pct_high_severity     = ('severity', lambda x: (x == 'High').mean()),
            has_selfharm_incident = ('incident_type', lambda x: int((x == 'SelfHarm').any())),
            has_runaway_attempt   = ('incident_type', lambda x: int((x == 'RunawayAttempt').any())),
            last_incident_date    = ('incident_date', 'max'),
        ).reset_index()

        # Merge all
        df_score = active[['resident_id']].merge(a_res, on='resident_id', how='left')
        df_score = df_score.merge(a_proc, on='resident_id', how='left')
        df_score = df_score.merge(a_health, on='resident_id', how='left')
        df_score = df_score.merge(a_edu, on='resident_id', how='left')
        df_score = df_score.merge(a_plan_feat, on='resident_id', how='left')
        df_score = df_score.merge(a_visit_feat, on='resident_id', how='left')
        df_score = df_score.merge(a_inc_feat.drop(columns=['last_incident_date']), on='resident_id', how='left')
        df_score = df_score.merge(a_inc_feat[['resident_id', 'last_incident_date']], on='resident_id', how='left')

        fill_zero = [
            'total_incidents', 'pct_high_severity', 'has_selfharm_incident', 'has_runaway_attempt',
            'total_visits', 'pct_favorable_outcomes', 'pct_highly_cooperative_family',
            'pct_safety_concerns', 'has_reintegration_assessment',
            'total_sessions'
        ]
        df_score[fill_zero] = df_score[fill_zero].fillna(0)
        df_score['incidents_per_month'] = np.where(
            df_score['length_of_stay_days'] > 0,
            df_score['total_incidents'] / df_score['length_of_stay_days'] * 30, 0
        )
        df_score['days_since_last_incident'] = (today - df_score['last_incident_date']).dt.days
        df_score['days_since_last_incident'] = df_score['days_since_last_incident'].fillna(df_score['length_of_stay_days'])
        df_score['session_frequency'] = np.where(
            df_score['length_of_stay_days'] > 0,
            df_score['total_sessions'] / df_score['length_of_stay_days'] * 30, 0
        )

        # Score
        X_score = df_score[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
        df_score['readiness_probability'] = model.predict_proba(X_score)[:, 1]

        df_score['readiness_label'] = pd.qcut(
            df_score['readiness_probability'],
            q=3,
            labels=['Early Stage', 'Progressing', 'Near Ready'],
            duplicates='drop'
        )

        scored_at = datetime.now(timezone.utc)
        readiness_scores = (
            df_score[['resident_id', 'readiness_probability', 'readiness_label']]
            .sort_values('readiness_probability', ascending=False)
            .assign(
                readiness_probability=lambda d: d['readiness_probability'].round(4),
                scored_at=scored_at
            )
            .reset_index(drop=True)
        )

        # ── Write to SQL ──────────────────────────────────────────────────────
        with engine.connect() as conn:
            conn.execute(text("TRUNCATE TABLE resident_readiness_scores"))
            conn.commit()

        readiness_scores.drop(columns=['scored_at']).to_sql(
            'resident_readiness_scores',
            engine,
            if_exists='append',
            index=False
        )
        print(f'\nWrote {len(readiness_scores)} rows to resident_readiness_scores')

        # ── Summary ───────────────────────────────────────────────────────────
        print(f'\nResidents scored: {len(readiness_scores)}')
        print('\nLabel distribution:')
        print(readiness_scores['readiness_label'].value_counts().sort_index().to_string())

        end = datetime.now(timezone.utc)
        elapsed = (end - start).total_seconds()
        print(f'\n[{end.isoformat()}] Completed in {elapsed:.1f}s')

    except Exception as e:
        print(f'ERROR: {e}')
        raise


if __name__ == '__main__':
    main()
