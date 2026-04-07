/* Foreign keys — run AFTER lighthouse.sqlserver.sql on YOUR app database (not [master]).

   Omitted: partner_assignments.safehouse_id -> safehouses.safehouse_id
   (DECIMAL vs NVARCHAR; values like 8.0 vs 8).
*/
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


ALTER TABLE dbo.[donations] WITH CHECK ADD CONSTRAINT [FK_donations_supporter_id__supporters_supporter_id] FOREIGN KEY ([supporter_id]) REFERENCES dbo.[supporters] ([supporter_id]);
GO

ALTER TABLE dbo.[donations] WITH CHECK ADD CONSTRAINT [FK_donations_referral_post_id__social_media_posts_post_id] FOREIGN KEY ([referral_post_id]) REFERENCES dbo.[social_media_posts] ([post_id]);
GO

ALTER TABLE dbo.[donation_allocations] WITH CHECK ADD CONSTRAINT [FK_donation_allocations_donation_id__donations_donation_id] FOREIGN KEY ([donation_id]) REFERENCES dbo.[donations] ([donation_id]);
GO

ALTER TABLE dbo.[donation_allocations] WITH CHECK ADD CONSTRAINT [FK_donation_allocations_safehouse_id__safehouses_safehouse_id] FOREIGN KEY ([safehouse_id]) REFERENCES dbo.[safehouses] ([safehouse_id]);
GO

ALTER TABLE dbo.[in_kind_donation_items] WITH CHECK ADD CONSTRAINT [FK_in_kind_donation_items_donation_id__donations_donation_id] FOREIGN KEY ([donation_id]) REFERENCES dbo.[donations] ([donation_id]);
GO

ALTER TABLE dbo.[residents] WITH CHECK ADD CONSTRAINT [FK_residents_safehouse_id__safehouses_safehouse_id] FOREIGN KEY ([safehouse_id]) REFERENCES dbo.[safehouses] ([safehouse_id]);
GO

ALTER TABLE dbo.[education_records] WITH CHECK ADD CONSTRAINT [FK_education_records_resident_id__residents_resident_id] FOREIGN KEY ([resident_id]) REFERENCES dbo.[residents] ([resident_id]);
GO

ALTER TABLE dbo.[health_wellbeing_records] WITH CHECK ADD CONSTRAINT [FK_health_wellbeing_records_resident_id__residents_resident_id] FOREIGN KEY ([resident_id]) REFERENCES dbo.[residents] ([resident_id]);
GO

ALTER TABLE dbo.[home_visitations] WITH CHECK ADD CONSTRAINT [FK_home_visitations_resident_id__residents_resident_id] FOREIGN KEY ([resident_id]) REFERENCES dbo.[residents] ([resident_id]);
GO

ALTER TABLE dbo.[incident_reports] WITH CHECK ADD CONSTRAINT [FK_incident_reports_resident_id__residents_resident_id] FOREIGN KEY ([resident_id]) REFERENCES dbo.[residents] ([resident_id]);
GO

ALTER TABLE dbo.[incident_reports] WITH CHECK ADD CONSTRAINT [FK_incident_reports_safehouse_id__safehouses_safehouse_id] FOREIGN KEY ([safehouse_id]) REFERENCES dbo.[safehouses] ([safehouse_id]);
GO

ALTER TABLE dbo.[intervention_plans] WITH CHECK ADD CONSTRAINT [FK_intervention_plans_resident_id__residents_resident_id] FOREIGN KEY ([resident_id]) REFERENCES dbo.[residents] ([resident_id]);
GO

ALTER TABLE dbo.[process_recordings] WITH CHECK ADD CONSTRAINT [FK_process_recordings_resident_id__residents_resident_id] FOREIGN KEY ([resident_id]) REFERENCES dbo.[residents] ([resident_id]);
GO

ALTER TABLE dbo.[partner_assignments] WITH CHECK ADD CONSTRAINT [FK_partner_assignments_partner_id__partners_partner_id] FOREIGN KEY ([partner_id]) REFERENCES dbo.[partners] ([partner_id]);
GO

ALTER TABLE dbo.[safehouse_monthly_metrics] WITH CHECK ADD CONSTRAINT [FK_safehouse_monthly_metrics_safehouse_id__safehouses_safehouse_id] FOREIGN KEY ([safehouse_id]) REFERENCES dbo.[safehouses] ([safehouse_id]);
GO
