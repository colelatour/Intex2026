using Intex2026API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

// ── DTOs ────────────────────────────────────────────────────────────
public record DashboardKpis(
    int ActiveResidents,
    decimal DonationsThisMonth,
    decimal DonationsLastMonth,
    int UpcomingConferences,
    int AtRiskResidents,
    int TotalReferrals);

public record CaseloadRow(
    string ResidentId,
    string? SafehouseId,
    string? SafehouseName,
    string? CaseType,
    string? Worker,
    string Status);

public record ActivityItem(
    string Type,        // ProcessRecordingAdded | DonationRecorded | HomeVisitScheduled | ResidentCreated
    string Text,
    DateTime Timestamp);

public record DonationMonth(int Year, int Month, decimal Total);

public record OutcomeSlice(string Label, int Count);

public record UpcomingEvent(
    string Date,
    string Title,
    string? Location);

public record DashboardResponse(
    string ServerTimeUtc,
    DashboardKpis Kpis,
    List<CaseloadRow> Caseload,
    List<ActivityItem> Activity,
    List<DonationMonth> DonationsMonthly,
    List<OutcomeSlice> ResidentOutcomes,
    List<UpcomingEvent> UpcomingEvents);

// ── Controller ──────────────────────────────────────────────────────
[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin,Worker")]
public class AdminDashboardController : ControllerBase
{
    private readonly LighthouseContext _ctx;
    public AdminDashboardController(LighthouseContext ctx) => _ctx = ctx;

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get(
        int days = 7, int caseloadLimit = 10, int activityLimit = 10, int months = 12)
    {
        var utcNow   = DateTime.UtcNow;
        var today     = DateOnly.FromDateTime(utcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var lastMonthStart = monthStart.AddMonths(-1);
        var windowStart    = monthStart.AddMonths(-months + 1);
        var eventHorizon   = today.AddDays(days);

        // ── Load bounded data into memory ───────────────────────
        var residents = await _ctx.Residents.AsNoTracking().ToListAsync();
        var safehouses = await _ctx.Safehouses.AsNoTracking().ToListAsync();
        var safehouseMap = safehouses
            .Where(s => s.SafehouseId != null)
            .ToDictionary(s => s.SafehouseId!, s => s.Name ?? "Unknown");

        // ── KPI: Active Residents ───────────────────────────────
        var activeResidents = residents.Count(r => r.DateClosed == null);

        // ── KPI: Donations This Month / Last Month ──────────────
        var recentDonations = await _ctx.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= lastMonthStart)
            .ToListAsync();

        decimal DonationValue(Models.Donation d) => d.Amount ?? d.EstimatedValue ?? 0m;

        var donationsThisMonth = recentDonations
            .Where(d => d.DonationDate >= monthStart)
            .Sum(DonationValue);

        var donationsLastMonth = recentDonations
            .Where(d => d.DonationDate >= lastMonthStart && d.DonationDate < monthStart)
            .Sum(DonationValue);

        // ── KPI: Upcoming Conferences ───────────────────────────
        var upcomingConferences = await _ctx.InterventionPlans.AsNoTracking()
            .Where(ip => ip.CaseConferenceDate != null
                         && ip.CaseConferenceDate >= today
                         && ip.CaseConferenceDate <= eventHorizon)
            .CountAsync();

        // ── KPI: At-Risk Residents ──────────────────────────────
        var atRisk = residents.Count(r =>
            r.DateClosed == null && IsAtRisk(r));

        // ── KPI: Total Referrals (tips) ────────────────────────
        int totalReferrals;
        try { totalReferrals = await _ctx.Tips.AsNoTracking().CountAsync(); }
        catch { totalReferrals = 0; }

        var kpis = new DashboardKpis(activeResidents, donationsThisMonth, donationsLastMonth,
                                     upcomingConferences, atRisk, totalReferrals);

        // ── Caseload ────────────────────────────────────────────
        var caseload = residents
            .Where(r => r.DateClosed == null)
            .OrderByDescending(r => r.CreatedAt)
            .Take(caseloadLimit)
            .Select(r => new CaseloadRow(
                r.ResidentId ?? "—",
                r.SafehouseId,
                r.SafehouseId != null && safehouseMap.TryGetValue(r.SafehouseId, out var n) ? n : null,
                r.CaseCategory,
                r.AssignedSocialWorker,
                MapStatus(r)))
            .ToList();

        // ── Activity Feed ───────────────────────────────────────
        var activityItems = new List<ActivityItem>();

        // Process recordings (last 30 days)
        var recentRecordings = await _ctx.ProcessRecordings.AsNoTracking()
            .Where(pr => pr.SessionDate != null && pr.SessionDate >= today.AddDays(-30))
            .OrderByDescending(pr => pr.SessionDate)
            .Take(activityLimit)
            .ToListAsync();
        activityItems.AddRange(recentRecordings.Select(pr =>
            new ActivityItem("ProcessRecordingAdded",
                $"Process recording added for {pr.ResidentId ?? "unknown"}",
                pr.SessionDate!.Value.ToDateTime(TimeOnly.MinValue))));

        // Donations (last 30 days)
        var recentDonationActivity = await _ctx.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= today.AddDays(-30))
            .OrderByDescending(d => d.DonationDate)
            .Take(activityLimit)
            .ToListAsync();
        activityItems.AddRange(recentDonationActivity.Select(d =>
            new ActivityItem("DonationRecorded",
                $"New donation logged — {(d.Amount.HasValue ? $"₱{d.Amount.Value:N0}" : $"₱{d.EstimatedValue ?? 0:N0}")}",
                d.DonationDate!.Value.ToDateTime(TimeOnly.MinValue))));

        // Home visits (last 30 days)
        var recentVisits = await _ctx.HomeVisitations.AsNoTracking()
            .Where(hv => hv.VisitDate != null && hv.VisitDate >= today.AddDays(-30))
            .OrderByDescending(hv => hv.VisitDate)
            .Take(activityLimit)
            .ToListAsync();
        activityItems.AddRange(recentVisits.Select(hv =>
            new ActivityItem("HomeVisitScheduled",
                $"Home visit — {hv.LocationVisited ?? "Location TBD"}",
                hv.VisitDate!.Value.ToDateTime(TimeOnly.MinValue))));

        // New residents (last 30 days)
        var recentResidents = residents
            .Where(r => r.CreatedAt != null && r.CreatedAt >= utcNow.AddDays(-30))
            .OrderByDescending(r => r.CreatedAt)
            .Take(activityLimit)
            .Select(r => new ActivityItem("ResidentCreated",
                $"New resident admitted — {r.ResidentId}",
                r.CreatedAt!.Value));

        activityItems.AddRange(recentResidents);

        var activity = activityItems
            .OrderByDescending(a => a.Timestamp)
            .Take(activityLimit)
            .ToList();

        // ── Donation Trends (monthly) ───────────────────────────
        var trendDonations = await _ctx.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= windowStart)
            .ToListAsync();

        var donationsMonthly = trendDonations
            .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
            .Select(g => new DonationMonth(g.Key.Year, g.Key.Month, g.Sum(DonationValue)))
            .OrderBy(dm => dm.Year).ThenBy(dm => dm.Month)
            .ToList();

        // ── Resident Outcomes (donut) ───────────────────────────
        var outcomeGroups = residents
            .Where(r => r.DateClosed == null || MapStatus(r) == "Reintegrated")
            .GroupBy(MapStatus)
            .Select(g => new OutcomeSlice(g.Key, g.Count()))
            .OrderBy(o => o.Label)
            .ToList();

        // ── Upcoming Events ─────────────────────────────────────
        var upcomingVisits = await _ctx.HomeVisitations.AsNoTracking()
            .Where(hv => hv.VisitDate != null && hv.VisitDate >= today && hv.VisitDate <= eventHorizon)
            .OrderBy(hv => hv.VisitDate)
            .Take(8)
            .ToListAsync();

        var upcomingPlans = await _ctx.InterventionPlans.AsNoTracking()
            .Where(ip => ip.CaseConferenceDate != null
                         && ip.CaseConferenceDate >= today
                         && ip.CaseConferenceDate <= eventHorizon)
            .OrderBy(ip => ip.CaseConferenceDate)
            .Take(8)
            .ToListAsync();

        var upcomingEvents = upcomingVisits
            .Select(hv => new UpcomingEvent(
                hv.VisitDate!.Value.ToString("MMM d"),
                "Home Visitation",
                hv.LocationVisited))
            .Concat(upcomingPlans.Select(ip => new UpcomingEvent(
                ip.CaseConferenceDate!.Value.ToString("MMM d"),
                "Case Conference",
                null)))
            .OrderBy(e => e.Date)
            .Take(8)
            .ToList();

        return new DashboardResponse(
            utcNow.ToString("o"),
            kpis, caseload, activity, donationsMonthly, outcomeGroups, upcomingEvents);
    }

    // ── Status mapping (shared) ─────────────────────────────────
    private static bool IsAtRisk(Models.Resident r)
    {
        if (string.Equals(r.CurrentRiskLevel, "High", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r.CurrentRiskLevel, "Severe", StringComparison.OrdinalIgnoreCase))
            return true;

        var atRisk = r.SubCatAtRisk;
        return atRisk != null &&
               (atRisk.Equals("True", StringComparison.OrdinalIgnoreCase) ||
                atRisk.Equals("Yes", StringComparison.OrdinalIgnoreCase) ||
                atRisk == "1");
    }

    private static string MapStatus(Models.Resident r)
    {
        if (r.DateClosed != null ||
            (r.ReintegrationStatus != null &&
             r.ReintegrationStatus.Contains("Reintegrat", StringComparison.OrdinalIgnoreCase)))
            return "Reintegrated";

        if (IsAtRisk(r)) return "At Risk";

        if (r.CaseStatus != null &&
            r.CaseStatus.Contains("Monitor", StringComparison.OrdinalIgnoreCase))
            return "Monitoring";

        return "Progressing";
    }
}
