# encoding: utf-8
import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path
import urllib

# Load .env from the ml-pipelines directory (works regardless of cwd)
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

# Read credentials from environment variables
server   = os.environ['AZURE_SQL_SERVER']
database = os.environ['AZURE_SQL_DATABASE']
username = os.environ['AZURE_SQL_USERNAME']
password = os.environ['AZURE_SQL_PASSWORD']

# Build the connection string
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

# ── List tables ───────────────────────────────────────────────────────────────
df = pd.read_sql("""
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
""", engine)
print(df)

# ── Create social_media_highlights view ───────────────────────────────────────
VIEW_SQL = """\
CREATE VIEW social_media_highlights AS

SELECT
    'Education' AS category,
    N'\U0001f393' AS icon,
    education_level + N' completions this month (' +
        CAST(this_month AS NVARCHAR(20)) + N') \u2014 above the ' +
        CAST(ROUND(avg_6mo, 1) AS NVARCHAR(20)) + N' monthly average.'
        AS highlight_text,
    CAST(this_month AS FLOAT) AS metric_value,
    'WhatsApp' AS recommended_platform,
    'ImpactStory' AS recommended_post_type,
    ROUND((this_month - avg_6mo) / NULLIF(avg_6mo, 0) * 100, 0) AS pct_above_average
FROM (
    SELECT
        education_level,
        SUM(CASE WHEN mo = MONTH(GETDATE()) AND yr = YEAR(GETDATE()) THEN monthly_count ELSE 0 END) AS this_month,
        AVG(CAST(monthly_count AS FLOAT)) AS avg_6mo
    FROM (
        SELECT education_level,
            MONTH(record_date) AS mo,
            YEAR(record_date) AS yr,
            COUNT(CASE WHEN completion_status = 'Completed' THEN 1 END) AS monthly_count
        FROM education_records
        WHERE record_date >= DATEADD(MONTH, -6, GETDATE())
        GROUP BY education_level, MONTH(record_date), YEAR(record_date)
    ) monthly
    GROUP BY education_level
) summary
WHERE this_month > avg_6mo

UNION ALL

SELECT
    'Health' AS category,
    N'\U0001f49a' AS icon,
    metric_name + N' improved ' + CAST(ROUND(delta, 2) AS NVARCHAR(20)) +
        N' points this month \u2014 strongest improvement in 6 months.' AS highlight_text,
    ROUND(delta, 2) AS metric_value,
    'Facebook' AS recommended_platform,
    'ImpactStory' AS recommended_post_type,
    ROUND(delta / NULLIF(avg_6mo, 0) * 100, 0) AS pct_above_average
FROM (
    SELECT 'General Health' AS metric_name,
        AVG(CASE WHEN MONTH(record_date) = MONTH(GETDATE()) THEN CAST(general_health_score AS FLOAT) END) -
        AVG(CASE WHEN MONTH(record_date) = MONTH(DATEADD(MONTH,-1,GETDATE())) THEN CAST(general_health_score AS FLOAT) END) AS delta,
        AVG(CASE WHEN record_date < DATEADD(MONTH,-1,GETDATE()) THEN CAST(general_health_score AS FLOAT) END) AS avg_6mo,
        COUNT(CASE WHEN MONTH(record_date) = MONTH(GETDATE()) AND YEAR(record_date) = YEAR(GETDATE()) THEN 1 END) AS record_count
    FROM health_wellbeing_records
    UNION ALL
    SELECT 'Nutrition',
        AVG(CASE WHEN MONTH(record_date) = MONTH(GETDATE()) THEN CAST(nutrition_score AS FLOAT) END) -
        AVG(CASE WHEN MONTH(record_date) = MONTH(DATEADD(MONTH,-1,GETDATE())) THEN CAST(nutrition_score AS FLOAT) END),
        AVG(CASE WHEN record_date < DATEADD(MONTH,-1,GETDATE()) THEN CAST(nutrition_score AS FLOAT) END),
        COUNT(CASE WHEN MONTH(record_date) = MONTH(GETDATE()) AND YEAR(record_date) = YEAR(GETDATE()) THEN 1 END)
    FROM health_wellbeing_records
    UNION ALL
    SELECT 'Sleep Quality',
        AVG(CASE WHEN MONTH(record_date) = MONTH(GETDATE()) THEN CAST(sleep_quality_score AS FLOAT) END) -
        AVG(CASE WHEN MONTH(record_date) = MONTH(DATEADD(MONTH,-1,GETDATE())) THEN CAST(sleep_quality_score AS FLOAT) END),
        AVG(CASE WHEN record_date < DATEADD(MONTH,-1,GETDATE()) THEN CAST(sleep_quality_score AS FLOAT) END),
        COUNT(CASE WHEN MONTH(record_date) = MONTH(GETDATE()) AND YEAR(record_date) = YEAR(GETDATE()) THEN 1 END)
    FROM health_wellbeing_records
) health_metrics
WHERE delta > 0.05 AND record_count >= 3

UNION ALL

SELECT
    'Progress' AS category,
    N'\u2705' AS icon,
    plan_category + N' goals achieved this month (' +
        CAST(this_month AS NVARCHAR(20)) + N') \u2014 above the ' +
        CAST(ROUND(avg_6mo, 1) AS NVARCHAR(20)) + N' monthly average.' AS highlight_text,
    CAST(this_month AS FLOAT) AS metric_value,
    'Instagram' AS recommended_platform,
    'Campaign' AS recommended_post_type,
    ROUND((this_month - avg_6mo) / NULLIF(avg_6mo, 0) * 100, 0) AS pct_above_average
FROM (
    SELECT
        plan_category,
        SUM(CASE WHEN mo = MONTH(GETDATE()) AND yr = YEAR(GETDATE()) THEN monthly_achieved ELSE 0 END) AS this_month,
        AVG(CAST(monthly_achieved AS FLOAT)) AS avg_6mo
    FROM (
        SELECT plan_category,
            MONTH(updated_at) AS mo,
            YEAR(updated_at) AS yr,
            COUNT(CASE WHEN status = 'Achieved' THEN 1 END) AS monthly_achieved
        FROM intervention_plans
        WHERE updated_at >= DATEADD(MONTH, -6, GETDATE())
        GROUP BY plan_category, MONTH(updated_at), YEAR(updated_at)
    ) monthly
    GROUP BY plan_category
) summary
WHERE this_month > avg_6mo

UNION ALL

SELECT
    'Family Progress' AS category,
    N'\U0001f3e0' AS icon,
    N'Family cooperation rated Highly Cooperative in ' +
        CAST(this_month AS NVARCHAR(20)) + N' visits this month \u2014 ' +
        CAST(ROUND(pct_favorable * 100, 0) AS NVARCHAR(20)) + N'% of all visits.' AS highlight_text,
    CAST(this_month AS FLOAT) AS metric_value,
    'Facebook' AS recommended_platform,
    'ImpactStory' AS recommended_post_type,
    ROUND((pct_favorable - avg_pct) / NULLIF(avg_pct, 0) * 100, 0) AS pct_above_average
FROM (
    SELECT
        SUM(CASE WHEN MONTH(visit_date) = MONTH(GETDATE()) AND family_cooperation_level = 'Highly Cooperative' THEN 1 ELSE 0 END) AS this_month,
        AVG(CASE WHEN MONTH(visit_date) = MONTH(GETDATE()) AND family_cooperation_level = 'Highly Cooperative' THEN 1.0 ELSE 0 END) AS pct_favorable,
        AVG(CASE WHEN visit_date < DATEADD(MONTH,-1,GETDATE()) AND family_cooperation_level = 'Highly Cooperative' THEN 1.0 ELSE 0 END) AS avg_pct
    FROM home_visitations
) visits
WHERE this_month > 0 AND pct_favorable > avg_pct

UNION ALL

SELECT
    'Reintegration' AS category,
    N'\u2b50' AS icon,
    CAST(COUNT(*) AS NVARCHAR(20)) +
        N' residents are approaching reintegration readiness \u2014 your donors want to hear this story.' AS highlight_text,
    CAST(COUNT(*) AS FLOAT) AS metric_value,
    'WhatsApp' AS recommended_platform,
    'ImpactStory' AS recommended_post_type,
    100 AS pct_above_average
FROM resident_readiness_scores
WHERE readiness_label = 'Near Ready'
HAVING COUNT(*) > 0

UNION ALL

SELECT
    'Safety' AS category,
    N'\U0001f6e1' AS icon,
    CAST(COUNT(*) AS NVARCHAR(20)) + N' residents have been incident-free for 90+ days.' AS highlight_text,
    CAST(COUNT(*) AS FLOAT) AS metric_value,
    'Instagram' AS recommended_platform,
    'Campaign' AS recommended_post_type,
    100 AS pct_above_average
FROM residents r
WHERE case_status = 'Active'
AND NOT EXISTS (
    SELECT 1 FROM incident_reports ir
    WHERE ir.resident_id = r.resident_id
    AND ir.incident_date >= DATEADD(DAY, -90, GETDATE())
)
HAVING COUNT(*) > 0"""

with engine.connect() as conn:
    try:
        conn.execute(text("DROP VIEW IF EXISTS social_media_highlights"))
        conn.commit()
    except Exception:
        conn.rollback()

    conn.execute(text(VIEW_SQL))
    conn.commit()
    print("View social_media_highlights created successfully.")

# Verify
result = pd.read_sql("SELECT * FROM social_media_highlights", engine)
print(f"\n{len(result)} highlights surfaced:")
print(result.to_string())
