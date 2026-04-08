# ML Inference Jobs

Three Python scripts that run nightly inference against the Azure SQL database and write scored results back to output tables. Each script reads credentials from a shared `.env` file located at `pipelines/.env` (one level above this directory).

---

## Scripts

### `run_churn_inference.py`

Scores active donors for churn risk using the trained XGBoost (or best CV model) pipeline saved in `donor_churn_pipeline/`. The script loads all relevant tables (`supporters`, `donations`, `social_media_posts`, `donation_allocations`), reproduces the full feature engineering from the training notebook — including the temporal holdout split at `CHURN_DAYS = 180`, per-donor aggregation, trend ratios, supporter profile merge, allocation features, channel diversity, and social referral counts — then scores only donors who have donated after the cutoff date (i.e., currently active donors). Churn probability scores are bucketed into Low / Medium / High risk labels using quantile-based binning (`pd.qcut`, q=3) and written to the `donor_churn_scores` table.

**Output table:** `donor_churn_scores`  
**Columns:** `supporter_id`, `churn_probability`, `churn_risk_label`, `scored_at`

---

### `run_readiness_inference.py`

Scores active shelter residents for reintegration readiness using the trained model saved in `reintegration-pipeline/`. The script loads seven tables (`residents`, `process_recordings`, `health_wellbeing_records`, `education_records`, `intervention_plans`, `home_visitations`, `incident_reports`), reproduces the complete feature engineering — resident base features, process recording session aggregates with emotional trajectory, health trend slopes, education trend slopes, intervention plan achievement rates, home visitation outcomes, and incident severity metrics — and scores only residents whose `case_status == 'Active'`. Readiness probability scores are bucketed into Early Stage / Progressing / Near Ready labels using quantile-based binning and written to the `resident_readiness_scores` table.

**Output table:** `resident_readiness_scores`  
**Columns:** `resident_id`, `readiness_probability`, `readiness_label`, `scored_at`

---

### `run_social_inference.py`

Unlike the other two pipelines, this script does not score individual records. Instead it re-runs the OLS regression (`statsmodels.OLS`) on the full `social_media_posts` dataset (with the same 99th-percentile winsorization and `log1p` target transform from the notebook), extracts the coefficient table, then trains the best predictive classifier (same 5-fold CV selection logic as the notebook) and extracts its feature importances. Both result sets are combined into one DataFrame and written to `social_media_recommendations` — OLS rows carry `model_type='OLS'` and predictive rows carry `model_type='Predictive'`. This gives staff a single table they can query to see which post features are statistically significant and which are most predictive of driving donations.

**Output table:** `social_media_recommendations`  
**Columns:** `feature`, `coefficient`, `p_value`, `significant`, `model_type`, `scored_at`

---

## Environment Setup

Create `pipelines/.env` with:

```
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database
AZURE_SQL_USERNAME=your-username
AZURE_SQL_PASSWORD=your-password
```

Required Python packages: `pandas`, `numpy`, `scikit-learn`, `xgboost`, `statsmodels`, `sqlalchemy`, `pyodbc`, `python-dotenv`, `joblib`

---

## Running Manually

From anywhere (scripts use absolute paths internally):

```bash
python /path/to/pipelines/jobs/run_churn_inference.py
python /path/to/pipelines/jobs/run_readiness_inference.py
python /path/to/pipelines/jobs/run_social_inference.py
```

Or from the `jobs/` directory:

```bash
python run_churn_inference.py
python run_readiness_inference.py
python run_social_inference.py
```

---

## Scheduling with Cron (nightly at 2 AM)

Open your crontab:

```bash
crontab -e
```

Add these entries (adjust the Python path to match your virtualenv):

```cron
# Donor churn inference — nightly 2:00 AM
0 2 * * * /usr/bin/python3 /path/to/pipelines/jobs/run_churn_inference.py >> /var/log/churn_inference.log 2>&1

# Resident readiness inference — nightly 2:10 AM
10 2 * * * /usr/bin/python3 /path/to/pipelines/jobs/run_readiness_inference.py >> /var/log/readiness_inference.log 2>&1

# Social media recommendations — nightly 2:20 AM
20 2 * * * /usr/bin/python3 /path/to/pipelines/jobs/run_social_inference.py >> /var/log/social_inference.log 2>&1
```

To find your Python path: `which python3`  
To find your virtualenv Python: `which python` (after activating)

---

## Verifying Output

After a run, verify each table with:

```sql
-- Donor churn scores
SELECT TOP 20
    supporter_id,
    churn_probability,
    churn_risk_label,
    scored_at
FROM donor_churn_scores
ORDER BY churn_probability DESC;

-- Risk distribution
SELECT churn_risk_label, COUNT(*) AS n
FROM donor_churn_scores
GROUP BY churn_risk_label
ORDER BY churn_risk_label;
```

```sql
-- Resident readiness scores
SELECT TOP 20
    resident_id,
    readiness_probability,
    readiness_label,
    scored_at
FROM resident_readiness_scores
ORDER BY readiness_probability DESC;

-- Label distribution
SELECT readiness_label, COUNT(*) AS n
FROM resident_readiness_scores
GROUP BY readiness_label
ORDER BY readiness_label;
```

```sql
-- Social media recommendations (OLS significant features)
SELECT feature, coefficient, p_value, significant, model_type, scored_at
FROM social_media_recommendations
WHERE model_type = 'OLS' AND significant = 1
ORDER BY ABS(coefficient) DESC;

-- Top predictive features
SELECT feature, coefficient AS importance, model_type
FROM social_media_recommendations
WHERE model_type = 'Predictive'
ORDER BY coefficient DESC;
```
