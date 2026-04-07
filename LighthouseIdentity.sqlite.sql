-- SQLite reference schema. For SQL Server / Azure SQL, generate T-SQL with:
--   python scripts/sqlite_identity_to_sqlserver.py
-- Output: LighthouseIdentity.sqlserver.sql (native types, dbo schema, FKs inline).
BEGIN TRANSACTION;
DROP TABLE IF EXISTS "AspNetRoleClaims";
CREATE TABLE "AspNetRoleClaims" (
	"Id"	INTEGER NOT NULL,
	"RoleId"	TEXT NOT NULL,
	"ClaimType"	TEXT,
	"ClaimValue"	TEXT,
	CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY("Id" AUTOINCREMENT),
	CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY("RoleId") REFERENCES "AspNetRoles"("Id") ON DELETE CASCADE
);
DROP TABLE IF EXISTS "AspNetRoles";
CREATE TABLE "AspNetRoles" (
	"Id"	TEXT NOT NULL,
	"Name"	TEXT,
	"NormalizedName"	TEXT,
	"ConcurrencyStamp"	TEXT,
	CONSTRAINT "PK_AspNetRoles" PRIMARY KEY("Id")
);
DROP TABLE IF EXISTS "AspNetUserClaims";
CREATE TABLE "AspNetUserClaims" (
	"Id"	INTEGER NOT NULL,
	"UserId"	TEXT NOT NULL,
	"ClaimType"	TEXT,
	"ClaimValue"	TEXT,
	CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY("Id" AUTOINCREMENT),
	CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);
DROP TABLE IF EXISTS "AspNetUserLogins";
CREATE TABLE "AspNetUserLogins" (
	"LoginProvider"	TEXT NOT NULL,
	"ProviderKey"	TEXT NOT NULL,
	"ProviderDisplayName"	TEXT,
	"UserId"	TEXT NOT NULL,
	CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY("LoginProvider","ProviderKey"),
	CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);
DROP TABLE IF EXISTS "AspNetUserRoles";
CREATE TABLE "AspNetUserRoles" (
	"UserId"	TEXT NOT NULL,
	"RoleId"	TEXT NOT NULL,
	CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY("UserId","RoleId"),
	CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" FOREIGN KEY("RoleId") REFERENCES "AspNetRoles"("Id") ON DELETE CASCADE,
	CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" FOREIGN KEY("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);
DROP TABLE IF EXISTS "AspNetUserTokens";
CREATE TABLE "AspNetUserTokens" (
	"UserId"	TEXT NOT NULL,
	"LoginProvider"	TEXT NOT NULL,
	"Name"	TEXT NOT NULL,
	"Value"	TEXT,
	CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY("UserId","LoginProvider","Name"),
	CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);
DROP TABLE IF EXISTS "AspNetUsers";
CREATE TABLE "AspNetUsers" (
	"Id"	TEXT NOT NULL,
	"UserName"	TEXT,
	"NormalizedUserName"	TEXT,
	"Email"	TEXT,
	"NormalizedEmail"	TEXT,
	"EmailConfirmed"	INTEGER NOT NULL,
	"PasswordHash"	TEXT,
	"SecurityStamp"	TEXT,
	"ConcurrencyStamp"	TEXT,
	"PhoneNumber"	TEXT,
	"PhoneNumberConfirmed"	INTEGER NOT NULL,
	"TwoFactorEnabled"	INTEGER NOT NULL,
	"LockoutEnd"	TEXT,
	"LockoutEnabled"	INTEGER NOT NULL,
	"AccessFailedCount"	INTEGER NOT NULL,
	CONSTRAINT "PK_AspNetUsers" PRIMARY KEY("Id")
);
DROP TABLE IF EXISTS "__EFMigrationsHistory";
CREATE TABLE "__EFMigrationsHistory" (
	"MigrationId"	TEXT NOT NULL,
	"ProductVersion"	TEXT NOT NULL,
	CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY("MigrationId")
);
DROP TABLE IF EXISTS "__EFMigrationsLock";
CREATE TABLE "__EFMigrationsLock" (
	"Id"	INTEGER NOT NULL,
	"Timestamp"	TEXT NOT NULL,
	CONSTRAINT "PK___EFMigrationsLock" PRIMARY KEY("Id")
);
INSERT INTO "__EFMigrationsHistory" ("MigrationId","ProductVersion") VALUES ('20260407160707_InitialIdentity','10.0.5');
DROP INDEX IF EXISTS "EmailIndex";
CREATE INDEX "EmailIndex" ON "AspNetUsers" (
	"NormalizedEmail"
);
DROP INDEX IF EXISTS "IX_AspNetRoleClaims_RoleId";
CREATE INDEX "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" (
	"RoleId"
);
DROP INDEX IF EXISTS "IX_AspNetUserClaims_UserId";
CREATE INDEX "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" (
	"UserId"
);
DROP INDEX IF EXISTS "IX_AspNetUserLogins_UserId";
CREATE INDEX "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" (
	"UserId"
);
DROP INDEX IF EXISTS "IX_AspNetUserRoles_RoleId";
CREATE INDEX "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" (
	"RoleId"
);
DROP INDEX IF EXISTS "RoleNameIndex";
CREATE UNIQUE INDEX "RoleNameIndex" ON "AspNetRoles" (
	"NormalizedName"
);
DROP INDEX IF EXISTS "UserNameIndex";
CREATE UNIQUE INDEX "UserNameIndex" ON "AspNetUsers" (
	"NormalizedUserName"
);
COMMIT;
