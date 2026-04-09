#!/usr/bin/env python3
"""
upload_churn_scores.py

Reads churn_scores.csv produced by donor-churn-classifier.ipynb and
inserts the results into donor_churn_scores in Azure SQL.

Run from any directory — the script locates the repo root .env automatically:
    python ml-pipelines/donor_churn_pipeline/upload_churn_scores.py

Requirements:
    pip install pyodbc python-dotenv pandas
    ODBC Driver 18 for SQL Server must be installed:
      macOS:  brew install msodbcsql18
      Windows: https://aka.ms/downloadmsodbcsql
"""

import os
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import pyodbc
from dotenv import load_dotenv

# ── Find and load .env (walks up from this script's location) ────────────────
script_dir = Path(__file__).resolve().parent
for parent in [script_dir, *script_dir.parents]:
    candidate = parent / ".env"
    if candidate.exists():
        load_dotenv(candidate)
        break
else:
    print("Warning: .env not found — falling back to environment variables.")

# ── Parse ADO.NET connection string → pyodbc format ──────────────────────────
ado = os.environ.get("ConnectionStrings__LighthouseConnection", "")
if not ado:
    raise EnvironmentError(
        "ConnectionStrings__LighthouseConnection is not set. "
        "Ensure your .env file is in the repo root."
    )

kv = dict(part.split("=", 1) for part in ado.split(";") if "=" in part)
server   = kv.get("Server", kv.get("Data Source", ""))
database = kv.get("Initial Catalog", kv.get("Database", ""))
uid      = kv.get("User ID", "")
pwd      = kv.get("Password", "")
encrypt  = "yes" if kv.get("Encrypt", "False").lower() == "true" else "no"
trust    = "yes" if kv.get("TrustServerCertificate", "False").lower() == "true" else "no"

conn_str = (
    f"DRIVER={{ODBC Driver 18 for SQL Server}};"
    f"SERVER={server};DATABASE={database};"
    f"UID={uid};PWD={pwd};"
    f"Encrypt={encrypt};TrustServerCertificate={trust};"
)

# ── Load churn_scores.csv ─────────────────────────────────────────────────────
scores_path = script_dir / "churn_scores.csv"
if not scores_path.exists():
    raise FileNotFoundError(
        f"churn_scores.csv not found at {scores_path}\n"
        "Run donor-churn-classifier.ipynb first to generate it."
    )

df = pd.read_csv(scores_path)
print(f"Loaded {len(df)} rows from {scores_path.name}")
print(df["churn_risk_label"].value_counts().to_string())

scored_at     = datetime.now(timezone.utc).replace(microsecond=0)
model_version = "v1"

rows = [
    (
        str(row["supporter_id"]),
        scored_at,
        float(row["churn_probability"]),
        str(row["churn_risk_label"]),
        model_version,
    )
    for _, row in df.iterrows()
]

# ── Insert into Azure SQL ─────────────────────────────────────────────────────
insert_sql = """
INSERT INTO dbo.donor_churn_scores
    (supporter_id, scored_at, churn_probability, churn_risk_label, model_version)
VALUES (?, ?, ?, ?, ?)
"""

print(f"\nConnecting to {server} / {database} ...")
with pyodbc.connect(conn_str, timeout=30) as conn:
    cursor = conn.cursor()
    cursor.fast_executemany = True
    cursor.executemany(insert_sql, rows)
    conn.commit()

print(f"Inserted {len(rows)} rows  |  scored_at = {scored_at.isoformat()}")
