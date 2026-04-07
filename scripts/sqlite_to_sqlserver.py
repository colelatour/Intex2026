"""
Convert lighthouse.sqlite.sql (SQLite dump) to T-SQL for SQL Server / Azure SQL.
Types align with Intex2026API EF models (DateOnly -> DATE, DateTime -> DATETIME2, decimal -> DECIMAL).
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "lighthouse.sqlite.sql"
OUT = ROOT / "lighthouse.sqlserver.sql"
OUT_FOREIGN_KEYS = ROOT / "lighthouse.sqlserver.foreignkeys.sql"

# Optional: set to your Azure SQL *database* name to emit USE [name]; at the top of generated scripts.
# If None, you must select that database in your tool's connection (not [master]).
TARGET_DATABASE_NAME: str | None = None

# EF-friendly width for keys / FK columns (indexable; see EF default 450 for string keys).
NVARCHAR_KEY = "NVARCHAR(450)"
NVARCHAR_TEXT = "NVARCHAR(MAX)"

# String columns that reference another table's primary key (non-PK columns only; PK handled separately).
FK_STRING_COLS: frozenset[tuple[str, str]] = frozenset(
    {
        ("donations", "supporter_id"),
        ("donations", "referral_post_id"),
        ("donation_allocations", "donation_id"),
        ("donation_allocations", "safehouse_id"),
        ("in_kind_donation_items", "donation_id"),
        ("residents", "safehouse_id"),
        ("education_records", "resident_id"),
        ("health_wellbeing_records", "resident_id"),
        ("home_visitations", "resident_id"),
        ("incident_reports", "resident_id"),
        ("incident_reports", "safehouse_id"),
        ("intervention_plans", "resident_id"),
        ("process_recordings", "resident_id"),
        ("partner_assignments", "partner_id"),
        ("safehouse_monthly_metrics", "safehouse_id"),
    }
)

# (child_table, child_column, parent_table, parent_column)
# partner_assignments.safehouse_id omitted: DECIMAL(18,6) vs safehouses.safehouse_id NVARCHAR + data '8.0' vs '8'.
FOREIGN_KEYS: list[tuple[str, str, str, str]] = [
    ("donations", "supporter_id", "supporters", "supporter_id"),
    ("donations", "referral_post_id", "social_media_posts", "post_id"),
    ("donation_allocations", "donation_id", "donations", "donation_id"),
    ("donation_allocations", "safehouse_id", "safehouses", "safehouse_id"),
    ("in_kind_donation_items", "donation_id", "donations", "donation_id"),
    ("residents", "safehouse_id", "safehouses", "safehouse_id"),
    ("education_records", "resident_id", "residents", "resident_id"),
    ("health_wellbeing_records", "resident_id", "residents", "resident_id"),
    ("home_visitations", "resident_id", "residents", "resident_id"),
    ("incident_reports", "resident_id", "residents", "resident_id"),
    ("incident_reports", "safehouse_id", "safehouses", "safehouse_id"),
    ("intervention_plans", "resident_id", "residents", "resident_id"),
    ("process_recordings", "resident_id", "residents", "resident_id"),
    ("partner_assignments", "partner_id", "partners", "partner_id"),
    ("safehouse_monthly_metrics", "safehouse_id", "safehouses", "safehouse_id"),
]

# Per-column logical types: nvarchar | date | datetime2 | decimal
# Matches backend Intex2026API Models + LighthouseContext (snake_case columns).
COL_TYPES: dict[str, dict[str, str]] = {
    "donation_allocations": {
        "allocation_id": "nvarchar",
        "donation_id": "nvarchar",
        "safehouse_id": "nvarchar",
        "program_area": "nvarchar",
        "amount_allocated": "decimal",
        "allocation_date": "date",
        "allocation_notes": "nvarchar",
    },
    "donations": {
        "donation_id": "nvarchar",
        "supporter_id": "nvarchar",
        "donation_type": "nvarchar",
        "donation_date": "date",
        "is_recurring": "nvarchar",
        "campaign_name": "nvarchar",
        "channel_source": "nvarchar",
        "currency_code": "nvarchar",
        "amount": "decimal",
        "estimated_value": "decimal",
        "impact_unit": "nvarchar",
        "notes": "nvarchar",
        "referral_post_id": "nvarchar",
    },
    "education_records": {
        "education_record_id": "nvarchar",
        "resident_id": "nvarchar",
        "record_date": "date",
        "education_level": "nvarchar",
        "school_name": "nvarchar",
        "enrollment_status": "nvarchar",
        "attendance_rate": "decimal",
        "progress_percent": "decimal",
        "completion_status": "nvarchar",
        "notes": "nvarchar",
    },
    "health_wellbeing_records": {
        "health_record_id": "nvarchar",
        "resident_id": "nvarchar",
        "record_date": "date",
        "general_health_score": "decimal",
        "nutrition_score": "decimal",
        "sleep_quality_score": "decimal",
        "energy_level_score": "decimal",
        "height_cm": "decimal",
        "weight_kg": "decimal",
        "bmi": "decimal",
        "medical_checkup_done": "nvarchar",
        "dental_checkup_done": "nvarchar",
        "psychological_checkup_done": "nvarchar",
        "notes": "nvarchar",
    },
    "home_visitations": {
        "visitation_id": "nvarchar",
        "resident_id": "nvarchar",
        "visit_date": "date",
        "social_worker": "nvarchar",
        "visit_type": "nvarchar",
        "location_visited": "nvarchar",
        "family_members_present": "nvarchar",
        "purpose": "nvarchar",
        "observations": "nvarchar",
        "family_cooperation_level": "nvarchar",
        "safety_concerns_noted": "nvarchar",
        "follow_up_needed": "nvarchar",
        "follow_up_notes": "nvarchar",
        "visit_outcome": "nvarchar",
    },
    "in_kind_donation_items": {
        "item_id": "nvarchar",
        "donation_id": "nvarchar",
        "item_name": "nvarchar",
        "item_category": "nvarchar",
        "quantity": "nvarchar",
        "unit_of_measure": "nvarchar",
        "estimated_unit_value": "decimal",
        "intended_use": "nvarchar",
        "received_condition": "nvarchar",
    },
    "incident_reports": {
        "incident_id": "nvarchar",
        "resident_id": "nvarchar",
        "safehouse_id": "nvarchar",
        "incident_date": "date",
        "incident_type": "nvarchar",
        "severity": "nvarchar",
        "description": "nvarchar",
        "response_taken": "nvarchar",
        "resolved": "nvarchar",
        "resolution_date": "date",
        "reported_by": "nvarchar",
        "follow_up_required": "nvarchar",
    },
    "intervention_plans": {
        "plan_id": "nvarchar",
        "resident_id": "nvarchar",
        "plan_category": "nvarchar",
        "plan_description": "nvarchar",
        "services_provided": "nvarchar",
        "target_value": "decimal",
        "target_date": "date",
        "status": "nvarchar",
        "case_conference_date": "date",
        "created_at": "datetime2",
        "updated_at": "datetime2",
    },
    "partner_assignments": {
        "assignment_id": "nvarchar",
        "partner_id": "nvarchar",
        "safehouse_id": "decimal",
        "program_area": "nvarchar",
        "assignment_start": "date",
        "assignment_end": "date",
        "responsibility_notes": "nvarchar",
        "is_primary": "nvarchar",
        "status": "nvarchar",
    },
    "partners": {
        "partner_id": "nvarchar",
        "partner_name": "nvarchar",
        "partner_type": "nvarchar",
        "role_type": "nvarchar",
        "contact_name": "nvarchar",
        "email": "nvarchar",
        "phone": "nvarchar",
        "region": "nvarchar",
        "status": "nvarchar",
        "start_date": "date",
        "end_date": "date",
        "notes": "nvarchar",
    },
    "process_recordings": {
        "recording_id": "nvarchar",
        "resident_id": "nvarchar",
        "session_date": "date",
        "social_worker": "nvarchar",
        "session_type": "nvarchar",
        "session_duration_minutes": "nvarchar",
        "emotional_state_observed": "nvarchar",
        "emotional_state_end": "nvarchar",
        "session_narrative": "nvarchar",
        "interventions_applied": "nvarchar",
        "follow_up_actions": "nvarchar",
        "progress_noted": "nvarchar",
        "concerns_flagged": "nvarchar",
        "referral_made": "nvarchar",
        "notes_restricted": "nvarchar",
    },
    "public_impact_snapshots": {
        "snapshot_id": "nvarchar",
        "snapshot_date": "date",
        "headline": "nvarchar",
        "summary_text": "nvarchar",
        "metric_payload_json": "nvarchar",
        "is_published": "nvarchar",
        "published_at": "date",
    },
    "residents": {
        "resident_id": "nvarchar",
        "case_control_no": "nvarchar",
        "internal_code": "nvarchar",
        "safehouse_id": "nvarchar",
        "case_status": "nvarchar",
        "sex": "nvarchar",
        "date_of_birth": "date",
        "birth_status": "nvarchar",
        "place_of_birth": "nvarchar",
        "religion": "nvarchar",
        "case_category": "nvarchar",
        "sub_cat_orphaned": "nvarchar",
        "sub_cat_trafficked": "nvarchar",
        "sub_cat_child_labor": "nvarchar",
        "sub_cat_physical_abuse": "nvarchar",
        "sub_cat_sexual_abuse": "nvarchar",
        "sub_cat_osaec": "nvarchar",
        "sub_cat_cicl": "nvarchar",
        "sub_cat_at_risk": "nvarchar",
        "sub_cat_street_child": "nvarchar",
        "sub_cat_child_with_hiv": "nvarchar",
        "is_pwd": "nvarchar",
        "pwd_type": "nvarchar",
        "has_special_needs": "nvarchar",
        "special_needs_diagnosis": "nvarchar",
        "family_is_4ps": "nvarchar",
        "family_solo_parent": "nvarchar",
        "family_indigenous": "nvarchar",
        "family_parent_pwd": "nvarchar",
        "family_informal_settler": "nvarchar",
        "date_of_admission": "date",
        "age_upon_admission": "nvarchar",
        "present_age": "nvarchar",
        "length_of_stay": "nvarchar",
        "referral_source": "nvarchar",
        "referring_agency_person": "nvarchar",
        "date_colb_registered": "date",
        "date_colb_obtained": "date",
        "assigned_social_worker": "nvarchar",
        "initial_case_assessment": "nvarchar",
        "date_case_study_prepared": "date",
        "reintegration_type": "nvarchar",
        "reintegration_status": "nvarchar",
        "initial_risk_level": "nvarchar",
        "current_risk_level": "nvarchar",
        "date_enrolled": "date",
        "date_closed": "date",
        "created_at": "datetime2",
        "notes_restricted": "nvarchar",
    },
    "safehouse_monthly_metrics": {
        "metric_id": "nvarchar",
        "safehouse_id": "nvarchar",
        "month_start": "date",
        "month_end": "date",
        "active_residents": "nvarchar",
        "avg_education_progress": "decimal",
        "avg_health_score": "decimal",
        "process_recording_count": "nvarchar",
        "home_visitation_count": "nvarchar",
        "incident_count": "nvarchar",
        "notes": "nvarchar",
    },
    "safehouses": {
        "safehouse_id": "nvarchar",
        "safehouse_code": "nvarchar",
        "name": "nvarchar",
        "region": "nvarchar",
        "city": "nvarchar",
        "province": "nvarchar",
        "country": "nvarchar",
        "open_date": "date",
        "status": "nvarchar",
        "capacity_girls": "nvarchar",
        "capacity_staff": "nvarchar",
        "current_occupancy": "nvarchar",
        "notes": "nvarchar",
    },
    "social_media_posts": {
        "post_id": "nvarchar",
        "platform": "nvarchar",
        "platform_post_id": "nvarchar",
        "post_url": "nvarchar",
        "created_at": "datetime2",
        "day_of_week": "nvarchar",
        "post_hour": "nvarchar",
        "post_type": "nvarchar",
        "media_type": "nvarchar",
        "caption": "nvarchar",
        "hashtags": "nvarchar",
        "num_hashtags": "nvarchar",
        "mentions_count": "nvarchar",
        "has_call_to_action": "nvarchar",
        "call_to_action_type": "nvarchar",
        "content_topic": "nvarchar",
        "sentiment_tone": "nvarchar",
        "caption_length": "nvarchar",
        "features_resident_story": "nvarchar",
        "campaign_name": "nvarchar",
        "is_boosted": "nvarchar",
        "boost_budget_php": "decimal",
        "impressions": "nvarchar",
        "reach": "nvarchar",
        "likes": "nvarchar",
        "comments": "nvarchar",
        "shares": "nvarchar",
        "saves": "nvarchar",
        "click_throughs": "nvarchar",
        "video_views": "decimal",
        "engagement_rate": "decimal",
        "profile_visits": "nvarchar",
        "donation_referrals": "nvarchar",
        "estimated_donation_value_php": "decimal",
        "follower_count_at_post": "nvarchar",
        "watch_time_seconds": "decimal",
        "avg_view_duration_seconds": "decimal",
        "subscriber_count_at_post": "decimal",
        "forwards": "decimal",
    },
    "supporters": {
        "supporter_id": "nvarchar",
        "supporter_type": "nvarchar",
        "display_name": "nvarchar",
        "organization_name": "nvarchar",
        "first_name": "nvarchar",
        "last_name": "nvarchar",
        "relationship_type": "nvarchar",
        "region": "nvarchar",
        "country": "nvarchar",
        "email": "nvarchar",
        "phone": "nvarchar",
        "status": "nvarchar",
        "created_at": "datetime2",
        "first_donation_date": "date",
        "acquisition_channel": "nvarchar",
    },
}

TSQL_TYPE = {
    "date": "DATE",
    "datetime2": "DATETIME2(7)",
    "decimal": "DECIMAL(18, 6)",
}


def nvarchar_type(table: str, col: str) -> str:
    if PRIMARY_KEYS.get(table) == col:
        return NVARCHAR_KEY
    if (table, col) in FK_STRING_COLS:
        return NVARCHAR_KEY
    return NVARCHAR_TEXT


def sql_physical_type(table: str, col: str, logical: str) -> str:
    if logical == "nvarchar":
        return nvarchar_type(table, col)
    return TSQL_TYPE[logical]

PRIMARY_KEYS = {
    "donation_allocations": "allocation_id",
    "donations": "donation_id",
    "education_records": "education_record_id",
    "health_wellbeing_records": "health_record_id",
    "home_visitations": "visitation_id",
    "in_kind_donation_items": "item_id",
    "incident_reports": "incident_id",
    "intervention_plans": "plan_id",
    "partner_assignments": "assignment_id",
    "partners": "partner_id",
    "process_recordings": "recording_id",
    "public_impact_snapshots": "snapshot_id",
    "residents": "resident_id",
    "safehouse_monthly_metrics": "metric_id",
    "safehouses": "safehouse_id",
    "social_media_posts": "post_id",
    "supporters": "supporter_id",
}


def bracket(name: str) -> str:
    return f"[{name.replace(']', ']]')}]"


def tokenize_values(inner: str) -> list[str | None]:
    values: list[str | None] = []
    i = 0
    n = len(inner)
    while i < n:
        while i < n and inner[i] in " \t\n\r":
            i += 1
        if i >= n:
            break
        if inner[i : i + 4].upper() == "NULL" and (
            i + 4 >= n or not (inner[i + 4].isalnum() or inner[i + 4] == "_")
        ):
            values.append(None)
            i += 4
        elif inner[i] == "'":
            i += 1
            buf: list[str] = []
            while i < n:
                if inner[i] == "'":
                    if i + 1 < n and inner[i + 1] == "'":
                        buf.append("'")
                        i += 2
                        continue
                    i += 1
                    break
                buf.append(inner[i])
                i += 1
            values.append("".join(buf))
        else:
            raise ValueError(f"Bad value token at {i}: {inner[i : i + 40]!r}")
        while i < n and inner[i] in " \t\n\r,":
            i += 1
    return values


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def emit_value(col: str, typ: str, raw: str | None) -> str:
    if raw is None:
        return "NULL"
    if raw == "" and typ in ("date", "datetime2", "decimal"):
        return "NULL"
    if typ == "nvarchar":
        return "N'" + sql_escape(raw) + "'"
    if typ == "date":
        return f"CAST(N'{sql_escape(raw)}' AS DATE)"
    if typ == "datetime2":
        return f"CAST(N'{sql_escape(raw)}' AS DATETIME2(7))"
    if typ == "decimal":
        return f"CAST(N'{sql_escape(raw)}' AS DECIMAL(18, 6))"
    raise AssertionError(typ)


def create_table_sql(table: str) -> str:
    cols = COL_TYPES[table]
    pk_col = PRIMARY_KEYS.get(table)
    parts: list[str] = []
    for c, t in cols.items():
        sqlt = sql_physical_type(table, c, t)
        null_sql = "NOT NULL" if c == pk_col else "NULL"
        parts.append(f"    {bracket(c)} {sqlt} {null_sql}")
    body = ",\n".join(parts)
    if pk_col:
        body += f",\n    CONSTRAINT [PK_{table}] PRIMARY KEY CLUSTERED ({bracket(pk_col)})"
    return "\n".join(
        [
            f"IF OBJECT_ID(N'dbo.{table}', N'U') IS NOT NULL DROP TABLE dbo.{bracket(table)};",
            "GO",
            f"CREATE TABLE dbo.{bracket(table)} (",
            body,
            ");",
            "GO",
        ]
    )


INSERT_RE = re.compile(
    r'^INSERT INTO "([^"]+)" \(([^)]+)\) VALUES \((.*)\);\s*$', re.DOTALL
)


def convert_insert(line: str) -> str | None:
    m = INSERT_RE.match(line.strip())
    if not m:
        return None
    table, col_list, val_blob = m.groups()
    if table not in COL_TYPES:
        return None
    cols = [c.strip().strip('"') for c in col_list.split(",")]
    end = len(val_blob.rstrip())
    while end > 0 and val_blob[end - 1] in "); \t\n\r":
        end -= 1
    inner = val_blob[:end].rstrip()
    if inner.endswith(")"):
        inner = inner[:-1].rstrip()
    values = tokenize_values(inner)
    if len(values) != len(cols):
        raise ValueError(
            f"{table}: column count {len(cols)} != value count {len(values)}"
        )
    types = COL_TYPES[table]
    out_vals = []
    for c, v in zip(cols, values):
        typ = types.get(c)
        if typ is None:
            raise KeyError(f"Unknown column {table}.{c}")
        out_vals.append(emit_value(c, typ, v))
    col_sql = ", ".join(bracket(c) for c in cols)
    val_sql = ", ".join(out_vals)
    return f"INSERT INTO dbo.{bracket(table)} ({col_sql}) VALUES ({val_sql});"


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    lines = text.splitlines()

    use_prefix = ""
    if TARGET_DATABASE_NAME:
        use_prefix = f"USE [{TARGET_DATABASE_NAME.replace(']', ']]')}];\nGO\n\n"

    header = f"""/*
   Generated from lighthouse.sqlite.sql for SQL Server / Azure SQL

   *** If you see: INSERT permission denied ... database 'master' ***
   You ran the script while connected to [master]. That is wrong.
   Fix: In SSMS / Azure Data Studio / VS Code, change the connection target database
   to YOUR application database (the one you created in Azure), then run again.
   Or set TARGET_DATABASE_NAME in scripts/sqlite_to_sqlserver.py and regenerate.

   Native types: DATE, DATETIME2(7), DECIMAL(18,6); NVARCHAR(450) for PK/FK strings;
   NVARCHAR(MAX) for other text. Use with EF Core without string converters on these columns.
   After load, run lighthouse.sqlserver.foreignkeys.sql on the SAME database.
*/
{use_prefix}SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

"""

    out_parts = [header]

    # DDL: parse CREATE TABLE blocks from source and emit T-SQL creates in file order
    i = 0
    ddl_done: set[str] = set()
    while i < len(lines):
        line = lines[i]
        if line.startswith('CREATE TABLE "'):
            m = re.match(r'^CREATE TABLE "([^"]+)" \($', line)
            if not m:
                i += 1
                continue
            table = m.group(1)
            if table in COL_TYPES and table not in ddl_done:
                out_parts.append(create_table_sql(table))
                out_parts.append("")
                ddl_done.add(table)
        i += 1

    for t in COL_TYPES:
        if t not in ddl_done:
            raise RuntimeError(f"Missing DDL for {t}")

    # Single batch: BEGIN ... INSERTs ... COMMIT (no GO between — GO would end the batch and lose the transaction).
    out_parts.append("BEGIN TRANSACTION;\n")

    insert_count = 0
    for line in lines:
        if not line.strip().startswith("INSERT INTO"):
            continue
        conv = convert_insert(line)
        if conv:
            out_parts.append(conv)
            insert_count += 1

    out_parts.append("COMMIT TRANSACTION;\nGO\n")

    OUT.write_text("\n".join(out_parts), encoding="utf-8")
    print(f"Wrote {OUT} ({insert_count} INSERT statements)")

    fk_use = ""
    if TARGET_DATABASE_NAME:
        fk_use = f"USE [{TARGET_DATABASE_NAME.replace(']', ']]')}];\nGO\n\n"

    fk_header = f"""/* Foreign keys — run AFTER lighthouse.sqlserver.sql on YOUR app database (not [master]).

   Omitted: partner_assignments.safehouse_id -> safehouses.safehouse_id
   (DECIMAL vs NVARCHAR; values like 8.0 vs 8).
*/
{fk_use}SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

"""
    fk_lines = [fk_header]
    for child, ccol, parent, pcol in FOREIGN_KEYS:
        cname = f"FK_{child}_{ccol}__{parent}_{pcol}".replace(" ", "_")
        fk_lines.append(
            f"ALTER TABLE dbo.{bracket(child)} WITH CHECK "
            f"ADD CONSTRAINT [{cname}] FOREIGN KEY ({bracket(ccol)}) "
            f"REFERENCES dbo.{bracket(parent)} ({bracket(pcol)});"
        )
        fk_lines.append("GO")
        fk_lines.append("")

    OUT_FOREIGN_KEYS.write_text("\n".join(fk_lines).rstrip() + "\n", encoding="utf-8")
    print(f"Wrote {OUT_FOREIGN_KEYS} ({len(FOREIGN_KEYS)} constraints)")


if __name__ == "__main__":
    main()
