"""
Convert LighthouseIdentity.sqlite.sql (SQLite Identity schema) to T-SQL for SQL Server / Azure SQL.
Matches ASP.NET Core Identity + EF Core expectations: nvarchar keys, BIT booleans, INT IDENTITY
for claim tables, DATETIMEOFFSET for LockoutEnd.

Omits __EFMigrationsLock (SQLite-only); keeps __EFMigrationsHistory + INSERT from source when present.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "LighthouseIdentity.sqlite.sql"
OUT = ROOT / "LighthouseIdentity.sqlserver.sql"

# Optional: emit USE [name]; (same as scripts/sqlite_to_sqlserver.py)
TARGET_DATABASE_NAME: str | None = None

INSERT_HISTORY_RE = re.compile(
    r'^INSERT INTO "__EFMigrationsHistory"\s*\("MigrationId","ProductVersion"\)\s*VALUES\s*\(\'([^\']*)\',\'([^\']*)\'\)\s*;\s*$',
    re.IGNORECASE,
)


def migration_insert_from_source(text: str) -> tuple[str, str] | None:
    for line in text.splitlines():
        m = INSERT_HISTORY_RE.match(line.strip())
        if m:
            return m.group(1), m.group(2)
    return None


def main() -> None:
    src_text = SRC.read_text(encoding="utf-8") if SRC.exists() else ""
    hist = migration_insert_from_source(src_text)
    if hist is None:
        hist = ("20260407160707_InitialIdentity", "10.0.5")

    migration_id, product_version = hist

    use_prefix = ""
    if TARGET_DATABASE_NAME:
        use_prefix = f"USE [{TARGET_DATABASE_NAME.replace(']', ']]')}];\nGO\n\n"

    header = f"""/*
   Generated from LighthouseIdentity.sqlite.sql for SQL Server / Azure SQL (ASP.NET Core Identity).

   *** If you see permission errors on database 'master' ***
   Connect to your Identity / app database (not [master]), then run this script.

   Types: NVARCHAR(450) for string keys & FKs; NVARCHAR(256) where Identity uses MaxLength(256);
   BIT for flags; INT IDENTITY for AspNet*Claims.Id; DATETIMEOFFSET(7) for LockoutEnd.

   __EFMigrationsLock is omitted (SQLite-only). After load, your EF migration history matches
   InitialIdentity so you normally do not run `dotnet ef database update` again on this database.
*/
{use_prefix}SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Drop children first (FK order)
IF OBJECT_ID(N'dbo.AspNetUserTokens', N'U') IS NOT NULL DROP TABLE dbo.[AspNetUserTokens];
GO
IF OBJECT_ID(N'dbo.AspNetUserRoles', N'U') IS NOT NULL DROP TABLE dbo.[AspNetUserRoles];
GO
IF OBJECT_ID(N'dbo.AspNetUserLogins', N'U') IS NOT NULL DROP TABLE dbo.[AspNetUserLogins];
GO
IF OBJECT_ID(N'dbo.AspNetUserClaims', N'U') IS NOT NULL DROP TABLE dbo.[AspNetUserClaims];
GO
IF OBJECT_ID(N'dbo.AspNetRoleClaims', N'U') IS NOT NULL DROP TABLE dbo.[AspNetRoleClaims];
GO
IF OBJECT_ID(N'dbo.AspNetUsers', N'U') IS NOT NULL DROP TABLE dbo.[AspNetUsers];
GO
IF OBJECT_ID(N'dbo.AspNetRoles', N'U') IS NOT NULL DROP TABLE dbo.[AspNetRoles];
GO
IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NOT NULL DROP TABLE dbo.[__EFMigrationsHistory];
GO

CREATE TABLE dbo.[AspNetRoles] (
    [Id] NVARCHAR(450) NOT NULL,
    [Name] NVARCHAR(256) NULL,
    [NormalizedName] NVARCHAR(256) NULL,
    [ConcurrencyStamp] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_AspNetRoles] PRIMARY KEY CLUSTERED ([Id])
);
GO

CREATE TABLE dbo.[AspNetUsers] (
    [Id] NVARCHAR(450) NOT NULL,
    [UserName] NVARCHAR(256) NULL,
    [NormalizedUserName] NVARCHAR(256) NULL,
    [Email] NVARCHAR(256) NULL,
    [NormalizedEmail] NVARCHAR(256) NULL,
    [EmailConfirmed] BIT NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NULL,
    [SecurityStamp] NVARCHAR(MAX) NULL,
    [ConcurrencyStamp] NVARCHAR(MAX) NULL,
    [PhoneNumber] NVARCHAR(MAX) NULL,
    [PhoneNumberConfirmed] BIT NOT NULL,
    [TwoFactorEnabled] BIT NOT NULL,
    [LockoutEnd] DATETIMEOFFSET(7) NULL,
    [LockoutEnabled] BIT NOT NULL,
    [AccessFailedCount] INT NOT NULL,
    CONSTRAINT [PK_AspNetUsers] PRIMARY KEY CLUSTERED ([Id])
);
GO

CREATE TABLE dbo.[AspNetRoleClaims] (
    [Id] INT IDENTITY(1, 1) NOT NULL,
    [RoleId] NVARCHAR(450) NOT NULL,
    [ClaimType] NVARCHAR(MAX) NULL,
    [ClaimValue] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId])
        REFERENCES dbo.[AspNetRoles] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.[AspNetUserClaims] (
    [Id] INT IDENTITY(1, 1) NOT NULL,
    [UserId] NVARCHAR(450) NOT NULL,
    [ClaimType] NVARCHAR(MAX) NULL,
    [ClaimValue] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId])
        REFERENCES dbo.[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.[AspNetUserLogins] (
    [LoginProvider] NVARCHAR(450) NOT NULL,
    [ProviderKey] NVARCHAR(450) NOT NULL,
    [ProviderDisplayName] NVARCHAR(MAX) NULL,
    [UserId] NVARCHAR(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY CLUSTERED ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId])
        REFERENCES dbo.[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.[AspNetUserRoles] (
    [UserId] NVARCHAR(450) NOT NULL,
    [RoleId] NVARCHAR(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY CLUSTERED ([UserId], [RoleId]),
    CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId])
        REFERENCES dbo.[AspNetRoles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId])
        REFERENCES dbo.[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.[AspNetUserTokens] (
    [UserId] NVARCHAR(450) NOT NULL,
    [LoginProvider] NVARCHAR(450) NOT NULL,
    [Name] NVARCHAR(450) NOT NULL,
    [Value] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY CLUSTERED ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId])
        REFERENCES dbo.[AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.[__EFMigrationsHistory] (
    [MigrationId] NVARCHAR(150) NOT NULL,
    [ProductVersion] NVARCHAR(32) NOT NULL,
    CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY CLUSTERED ([MigrationId])
);
GO

CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON dbo.[AspNetRoleClaims] ([RoleId]);
GO
CREATE UNIQUE INDEX [RoleNameIndex] ON dbo.[AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;
GO
CREATE INDEX [IX_AspNetUserClaims_UserId] ON dbo.[AspNetUserClaims] ([UserId]);
GO
CREATE INDEX [IX_AspNetUserLogins_UserId] ON dbo.[AspNetUserLogins] ([UserId]);
GO
CREATE INDEX [IX_AspNetUserRoles_RoleId] ON dbo.[AspNetUserRoles] ([RoleId]);
GO
CREATE INDEX [EmailIndex] ON dbo.[AspNetUsers] ([NormalizedEmail]);
GO
CREATE UNIQUE INDEX [UserNameIndex] ON dbo.[AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;
GO

BEGIN TRANSACTION;

INSERT INTO dbo.[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'{migration_id.replace("'", "''")}', N'{product_version.replace("'", "''")}');

COMMIT TRANSACTION;
GO
"""

    OUT.write_text(header, encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
