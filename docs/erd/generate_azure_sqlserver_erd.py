"""
Generate ERD artifacts (Mermaid .mmd + dbdiagram .dbml) from Azure SQL T-SQL sources.

Inputs (repo root):
  lighthouse.sqlserver.sql
  lighthouse.sqlserver.foreignkeys.sql
  LighthouseIdentity.sqlserver.sql

Outputs:
  intex2026DB-erd.mmd / intex2026DB-erd.dbml     — Lighthouse operational DB
  intex2026DBIdentity-erd.mmd / intex2026DBIdentity-erd.dbml — ASP.NET Core Identity DB

Regenerate: python docs/erd/generate_azure_sqlserver_erd.py
PNG (from docs/erd): npx -y @mermaid-js/mermaid-cli@11.12.0 -i intex2026DB-erd.mmd -o intex2026DB-erd.png -b white -w 5200 -H 4000 -s 2
  npx -y @mermaid-js/mermaid-cli@11.12.0 -i intex2026DBIdentity-erd.mmd -o intex2026DBIdentity-erd.png -b white -w 2400 -H 2000 -s 2
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent

LIGHTHOUSE_DDL = ROOT / "lighthouse.sqlserver.sql"
LIGHTHOUSE_FK = ROOT / "lighthouse.sqlserver.foreignkeys.sql"
IDENTITY_DDL = ROOT / "LighthouseIdentity.sqlserver.sql"

CREATE_RE = re.compile(
    r"CREATE TABLE dbo\.\[([^\]]+)\]\s*\((.*?)\);\s*GO",
    re.DOTALL | re.IGNORECASE,
)
def parse_pk_columns(body: str) -> set[str]:
    m = re.search(r"PRIMARY KEY\s+CLUSTERED\s+\(([^)]+)\)", body, re.IGNORECASE)
    if not m:
        return set()
    return set(re.findall(r"\[([^\]]+)\]", m.group(1)))
COL_LINE_RE = re.compile(
    r"^\s*\[([^\]]+)\]\s+(.+?)\s*(?:,)?\s*$",
    re.IGNORECASE,
)

# lighthouse.sqlserver.foreignkeys.sql
FK_ALTER_RE = re.compile(
    r"ALTER TABLE dbo\.\[([^\]]+)\].*?FOREIGN KEY \(\[([^\]]+)\]\)\s+"
    r"REFERENCES dbo\.\[([^\]]+)\] \(\[([^\]]+)\]\)",
    re.DOTALL | re.IGNORECASE,
)

# Inline FK on CREATE (Identity script)
FK_INLINE_RE = re.compile(
    r"CONSTRAINT\s+\[[^\]]+\]\s+FOREIGN KEY\s+\(\[([^\]]+)\]\)\s+"
    r"REFERENCES dbo\.\[([^\]]+)\]\s+\(\[([^\]]+)\]\)",
    re.IGNORECASE,
)


def norm_type(sql: str) -> str:
    s = " ".join(sql.split()).strip().rstrip(",")
    up = s.upper()
    if up.startswith("NVARCHAR(MAX)"):
        return "nvarcharmax"
    if up.startswith("NVARCHAR(450)"):
        return "nvarchar450"
    if up.startswith("NVARCHAR(256)"):
        return "nvarchar256"
    if up.startswith("NVARCHAR(150)"):
        return "nvarchar150"
    if up.startswith("NVARCHAR(32)"):
        return "nvarchar32"
    if "IDENTITY" in up and "INT" in up:
        return "int_identity"
    if up.startswith("INT ") or up == "INT":
        return "int"
    if up.startswith("BIT"):
        return "bit"
    if up.startswith("DATE "):
        return "date"
    if up == "DATE":
        return "date"
    if "DATETIME2" in up:
        return "datetime2"
    if "DATETIMEOFFSET" in up:
        return "datetimeoffset"
    if "DECIMAL(18" in up or "DECIMAL (18" in up:
        return "decimal_18_6"
    return re.sub(r"[^\w]+", "_", s)[:40]


def parse_create_tables(text: str) -> dict[str, tuple[list[tuple[str, str]], set[str]]]:
    """table -> ([(col, type_display), ...], pk_columns)."""
    tables: dict[str, tuple[list[tuple[str, str]], set[str]]] = {}
    for m in CREATE_RE.finditer(text):
        name, body = m.group(1), m.group(2)
        if name.startswith("__") and "INSERT" in body.upper():
            continue
        pk_cols = parse_pk_columns(body)
        cols: list[tuple[str, str]] = []
        for line in body.splitlines():
            line = line.strip()
            if not line or line.upper().startswith("CONSTRAINT"):
                continue
            cm = COL_LINE_RE.match(line)
            if not cm:
                continue
            cname, ctype = cm.group(1), cm.group(2).strip().rstrip(",")
            cols.append((cname, norm_type(ctype)))
        tables[name] = (cols, pk_cols)
    return tables


def parse_fk_alters(text: str) -> list[tuple[str, str, str, str]]:
    """(child_table, child_col, parent_table, parent_col)."""
    return [
        (m.group(1), m.group(2), m.group(3), m.group(4))
        for m in FK_ALTER_RE.finditer(text)
    ]


def parse_inline_fks(body: str) -> list[tuple[str, str, str]]:
    """(child_col, parent_table, parent_col) for one CREATE block."""
    return [(m.group(1), m.group(2), m.group(3)) for m in FK_INLINE_RE.finditer(body)]


def mermaid_entity_name(name: str) -> str:
    if name.startswith("__"):
        return f'"{name}"'
    return name


# Words that break mermaid erDiagram attribute lexer if used as column labels
_MERMAID_ATTR_RESERVED = frozenset(
    {"name", "type", "end", "class", "style", "and", "or", "as", "in", "to"}
)


def mermaid_attr_name(cname: str) -> str:
    """erDiagram attribute names must be single tokens (no quotes — mermaid-cli treats them as comments)."""
    if re.match(r"^[a-z][a-z0-9_]*$", cname):
        base = cname
    else:
        out = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "_", cname)
        base = out.lower()
    if base in _MERMAID_ATTR_RESERVED:
        return f"{base}_col"
    return base


def mermaid_display_type(tshort: str) -> str:
    """Single-token types for mermaid-cli erDiagram (avoid digits/underscores in type slot)."""
    if tshort.startswith("nvarchar") or tshort == "nvarcharmax":
        return "string"
    if tshort == "decimal_18_6":
        return "decimal"
    if tshort in ("datetime2", "datetimeoffset"):
        return "datetime"
    if tshort == "date":
        return "date"
    if tshort in ("int", "int_identity"):
        return "int"
    if tshort == "bit":
        return "bool"
    return "string"


def emit_mermaid(
    title: str,
    tables: dict[str, tuple[list[tuple[str, str]], set[str]]],
    fks: list[tuple[str, str, str, str]],
    extra_notes: list[str],
) -> str:
    lines = [
        f"%% {title}",
        "%% Regenerate: python docs/erd/generate_azure_sqlserver_erd.py",
        "erDiagram",
    ]
    for note in extra_notes:
        lines.append(f"  %% {note}")

    seen_edges: set[tuple[str, str, str]] = set()
    for child, ccol, parent, _pcol in fks:
        edge = (parent, child, ccol)
        if edge in seen_edges:
            continue
        seen_edges.add(edge)
        pl, cl = mermaid_entity_name(parent), mermaid_entity_name(child)
        lines.append(f"  {pl} ||--o{{ {cl} : \"{ccol}\"")

    for tname in sorted(tables.keys()):
        cols, pk_cols = tables[tname]
        en = mermaid_entity_name(tname)
        lines.append(f"  {en} {{")
        for cname, ctype in cols:
            tags: list[str] = []
            if cname in pk_cols:
                tags.append("PK")
            for ch, cc, par, pc in fks:
                if ch == tname and cc == cname:
                    tags.append("FK")
                    break
            # One constraint token. Mermaid accepts PK, FK, UK — not combined PKFK.
            if not tags:
                suffix = ""
            elif "PK" in tags and "FK" in tags:
                suffix = " PK"
            else:
                suffix = " " + tags[0]
            mt = mermaid_display_type(ctype)
            an = mermaid_attr_name(cname)
            lines.append(f"    {mt} {an}{suffix}")
        lines.append("  }")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def emit_dbml(
    title: str,
    tables: dict[str, tuple[list[tuple[str, str]], set[str]]],
    fks: list[tuple[str, str, str, str]],
    sql_type_for_dbml: dict[str, str],
    extra_comments: list[str],
) -> str:
    out = [f"// {title}", "// Regenerate: python docs/erd/generate_azure_sqlserver_erd.py"]
    out.extend(extra_comments)
    out.append("")

    fk_lookup: dict[tuple[str, str], tuple[str, str]] = {}
    for child, ccol, parent, pcol in fks:
        fk_lookup[(child, ccol)] = (parent, pcol)

    for tname in sorted(tables.keys()):
        cols, pk_cols = tables[tname]
        safe_name = tname if not tname.startswith("__") else f'"{tname}"'
        out.append(f"Table {safe_name} {{")
        for cname, tshort in cols:
            sqlt = sql_type_for_dbml.get(tshort, tshort)
            bits: list[str] = []
            if cname in pk_cols:
                bits.append("pk")
            if (tname, cname) in fk_lookup:
                par, pcol = fk_lookup[(tname, cname)]
                bits.append(f"ref: > {par}.{pcol}")
            note = f" [{', '.join(bits)}]" if bits else ""
            out.append(f"  {cname} {sqlt}{note}")
        out.append("}")
        out.append("")
    return "\n".join(out).rstrip() + "\n"


def main() -> None:
    sql_type = {
        "nvarcharmax": "nvarchar(max)",
        "nvarchar450": "nvarchar(450)",
        "nvarchar256": "nvarchar(256)",
        "nvarchar150": "nvarchar(150)",
        "nvarchar32": "nvarchar(32)",
        "date": "date",
        "datetime2": "datetime2(7)",
        "datetimeoffset": "datetimeoffset(7)",
        "decimal_18_6": "decimal(18,6)",
        "int": "int",
        "int_identity": "int",
        "bit": "bit",
    }

    lh_text = LIGHTHOUSE_DDL.read_text(encoding="utf-8")
    cut = lh_text.upper().find("BEGIN TRANSACTION")
    if cut != -1:
        lh_text = lh_text[:cut]

    tables_lh = parse_create_tables(lh_text)
    fk_text = LIGHTHOUSE_FK.read_text(encoding="utf-8")
    fks_lh = parse_fk_alters(fk_text)

    notes_lh = [
        "Azure SQL database: intex2026DB (Lighthouse)",
        "FKs from lighthouse.sqlserver.foreignkeys.sql",
        "partner_assignments.safehouse_id is decimal(18,6); no FK to safehouses (type mismatch in seed).",
    ]

    (OUT / "intex2026DB-erd.mmd").write_text(
        emit_mermaid("intex2026DB — Azure SQL (Lighthouse)", tables_lh, fks_lh, notes_lh),
        encoding="utf-8",
    )
    (OUT / "intex2026DB-erd.dbml").write_text(
        emit_dbml("intex2026DB — Azure SQL (Lighthouse)", tables_lh, fks_lh, sql_type, notes_lh),
        encoding="utf-8",
    )

    id_text = IDENTITY_DDL.read_text(encoding="utf-8")
    cut_i = id_text.upper().find("BEGIN TRANSACTION")
    if cut_i != -1:
        id_text = id_text[:cut_i]

    tables_id = parse_create_tables(id_text)
    fks_id: list[tuple[str, str, str, str]] = []
    for m in CREATE_RE.finditer(id_text):
        tname, body = m.group(1), m.group(2)
        for ccol, ptab, pcol in parse_inline_fks(body):
            fks_id.append((tname, ccol, ptab, pcol))

    notes_id = [
        "Azure SQL database: intex2026DBIdentity (ASP.NET Core Identity)",
        "FKs from inline CONSTRAINTs in LighthouseIdentity.sqlserver.sql",
        "Column labels in snake_case for Mermaid PNG (DB columns remain PascalCase).",
    ]

    (OUT / "intex2026DBIdentity-erd.mmd").write_text(
        emit_mermaid("intex2026DBIdentity — Azure SQL (Identity)", tables_id, fks_id, notes_id),
        encoding="utf-8",
    )
    (OUT / "intex2026DBIdentity-erd.dbml").write_text(
        emit_dbml("intex2026DBIdentity — Azure SQL (Identity)", tables_id, fks_id, sql_type, notes_id),
        encoding="utf-8",
    )

    print(f"Wrote {OUT / 'intex2026DB-erd.mmd'}")
    print(f"Wrote {OUT / 'intex2026DB-erd.dbml'}")
    print(f"Wrote {OUT / 'intex2026DBIdentity-erd.mmd'}")
    print(f"Wrote {OUT / 'intex2026DBIdentity-erd.dbml'}")


if __name__ == "__main__":
    main()
