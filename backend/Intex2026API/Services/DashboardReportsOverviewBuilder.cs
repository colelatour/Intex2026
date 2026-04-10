using System.Globalization;
using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Services;

/// <summary>
/// Builds the admin dashboard "reports overview" using the same default date windows as
/// DonationReportsController, ResidentReportsController, and SafehouseReportsController
/// when start/end query params are omitted.
/// </summary>
public record DashboardDonationsOverviewSlice(
    string RangeStart,
    string RangeEnd,
    decimal TotalInRange,
    int DonationCount,
    int DonorCount,
    decimal PercentChangeFromPreviousPeriod);

public record DashboardUtilizationMarker(string SafehouseId, string Name, decimal UtilizationPct);

public record DashboardSafehousesOverviewSlice(
    string RangeStart,
    string RangeEnd,
    int TotalSafehouses,
    decimal AverageOccupancyRate,
    DashboardUtilizationMarker? HighestUtilization,
    DashboardUtilizationMarker? LowestUtilization,
    int TotalResidentsHoused,
    decimal TurnoverRate);

public record DashboardResidentsOverviewSlice(
    string RangeStart,
    string RangeEnd,
    int TotalResidentsInRange,
    int ActiveResidents,
    decimal CompletionRate,
    decimal IntakeChangePercent);

public record DashboardReportsOverview(
    DashboardDonationsOverviewSlice Donations,
    DashboardResidentsOverviewSlice Residents,
    DashboardSafehousesOverviewSlice Safehouses);

public static class DashboardReportsOverviewBuilder
{
    public static async Task<DashboardReportsOverview> BuildAsync(
        LighthouseContext ctx,
        IReadOnlyList<Resident> residents,
        CancellationToken cancellationToken = default)
    {
        var donations = await BuildDonationsSliceAsync(ctx, cancellationToken);
        var residentsSlice = BuildResidentsSlice(residents);
        var safehouses = await BuildSafehousesSliceAsync(ctx, residents, cancellationToken);
        return new DashboardReportsOverview(donations, residentsSlice, safehouses);
    }

    private static async Task<DashboardDonationsOverviewSlice> BuildDonationsSliceAsync(
        LighthouseContext ctx,
        CancellationToken cancellationToken)
    {
        var latestDonationDate = await ctx.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null)
            .MaxAsync(d => (DateOnly?)d.DonationDate, cancellationToken) ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var rangeEnd = latestDonationDate;
        var rangeStart = rangeEnd.AddMonths(-11);

        var inRange = await ctx.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= rangeStart && d.DonationDate <= rangeEnd)
            .ToListAsync(cancellationToken);

        var values = inRange.Select(DonationValue).ToList();
        var rangeTotal = values.Sum();

        var daySpan = rangeEnd.DayNumber - rangeStart.DayNumber + 1;
        var previousEnd = rangeStart.AddDays(-1);
        var previousStart = previousEnd.AddDays(-(daySpan - 1));

        var previousTotal = await ctx.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= previousStart && d.DonationDate <= previousEnd)
            .SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0m, cancellationToken);

        var donorCount = inRange
            .Select(d => d.SupporterId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        return new DashboardDonationsOverviewSlice(
            rangeStart.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            rangeEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            rangeTotal,
            inRange.Count,
            donorCount,
            ComputePercentChangeDecimal(rangeTotal, previousTotal));
    }

    private static DashboardResidentsOverviewSlice BuildResidentsSlice(IReadOnlyList<Resident> allResidents)
    {
        var withAdmission = allResidents.Where(r => r.DateOfAdmission != null).ToList();
        var latestAdmission = withAdmission.Count > 0
            ? withAdmission.Max(r => r.DateOfAdmission!.Value)
            : DateOnly.FromDateTime(DateTime.UtcNow);

        var rangeEnd = latestAdmission;
        var rangeStart = rangeEnd.AddMonths(-11);

        var filtered = withAdmission
            .Where(r =>
                r.DateOfAdmission >= rangeStart &&
                r.DateOfAdmission <= rangeEnd)
            .ToList();

        var daySpan = rangeEnd.DayNumber - rangeStart.DayNumber + 1;
        var previousEnd = rangeStart.AddDays(-1);
        var previousStart = previousEnd.AddDays(-(daySpan - 1));

        var previousPeriodAdmissions = withAdmission.Count(r =>
            r.DateOfAdmission >= previousStart &&
            r.DateOfAdmission <= previousEnd);

        var activeInRange = filtered.Count(r =>
            string.Equals(MapResidentReportStatus(r), "Active", StringComparison.OrdinalIgnoreCase));

        return new DashboardResidentsOverviewSlice(
            rangeStart.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            rangeEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            filtered.Count,
            activeInRange,
            ComputeResidentCompletionRate(filtered),
            ComputePercentChangeDecimal(filtered.Count, previousPeriodAdmissions));
    }

    private static async Task<DashboardSafehousesOverviewSlice> BuildSafehousesSliceAsync(
        LighthouseContext ctx,
        IReadOnlyList<Resident> residents,
        CancellationToken cancellationToken)
    {
        var metrics = await ctx.SafehouseMonthlyMetrics.AsNoTracking().ToListAsync(cancellationToken);
        var safehouses = await ctx.Safehouses.AsNoTracking().ToListAsync(cancellationToken);

        var earliestMetric = metrics.Where(m => m.MonthStart != null).Select(m => m.MonthStart!.Value).OrderBy(d => d).FirstOrDefault();
        var latestMetric = metrics.Where(m => m.MonthStart != null).Select(m => m.MonthStart!.Value).OrderBy(d => d).LastOrDefault();

        var rangeStart = earliestMetric == default
            ? DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-11)
            : earliestMetric;
        var rangeEnd = latestMetric == default
            ? DateOnly.FromDateTime(DateTime.UtcNow)
            : latestMetric;

        if (rangeStart > rangeEnd)
        {
            (rangeStart, rangeEnd) = (rangeEnd, rangeStart);
        }

        var safehouseIds = safehouses
            .Where(s => !string.IsNullOrWhiteSpace(s.SafehouseId))
            .Select(s => s.SafehouseId!)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var filteredResidents = residents
            .Where(r => r.SafehouseId != null && safehouseIds.Contains(r.SafehouseId))
            .ToList();

        var filteredMetrics = metrics
            .Where(m =>
                m.SafehouseId != null &&
                safehouseIds.Contains(m.SafehouseId) &&
                m.MonthStart != null &&
                m.MonthStart >= rangeStart &&
                m.MonthStart <= rangeEnd)
            .ToList();

        var capacityMap = safehouses.ToDictionary(
            s => s.SafehouseId ?? string.Empty,
            s => ShParseInt(s.CapacityGirls),
            StringComparer.OrdinalIgnoreCase);

        var rows = safehouses
            .Select(sh =>
            {
                var sid = sh.SafehouseId ?? "unknown";
                var res = filteredResidents.Where(r => string.Equals(r.SafehouseId, sid, StringComparison.OrdinalIgnoreCase)).ToList();
                var met = filteredMetrics.Where(m => string.Equals(m.SafehouseId, sid, StringComparison.OrdinalIgnoreCase)).ToList();
                var capacity = ShParseInt(sh.CapacityGirls);
                var currentOccupancy = ShParseInt(sh.CurrentOccupancy);
                var admissions = res.Count(r => r.DateOfAdmission != null && r.DateOfAdmission >= rangeStart && r.DateOfAdmission <= rangeEnd);
                var exits = res.Count(r => r.DateClosed != null && r.DateClosed >= rangeStart && r.DateClosed <= rangeEnd);
                var completionRate = res.Count > 0
                    ? Math.Round((res.Count(r => r.ReintegrationStatus != null && r.ReintegrationStatus.Contains("Completed", StringComparison.OrdinalIgnoreCase)) * 100m) / res.Count, 1)
                    : 0m;
                var turnoverRate = ShComputeTurnoverRate(admissions, exits, met);
                var utilization = capacity > 0 ? Math.Round((currentOccupancy * 100m) / capacity, 1) : 0m;

                return new SafehouseComparisonScratch(
                    sid,
                    ShNormalizeLabel(sh.Name, $"Safehouse {sid}"),
                    capacity,
                    currentOccupancy,
                    utilization,
                    admissions,
                    exits,
                    completionRate,
                    turnoverRate);
            })
            .OrderByDescending(r => r.UtilizationPct)
            .ToList();

        var highest = rows.Count > 0
            ? new DashboardUtilizationMarker(rows[0].SafehouseId, rows[0].SafehouseName, rows[0].UtilizationPct)
            : null;
        var lowest = rows.Count > 0
            ? new DashboardUtilizationMarker(rows[^1].SafehouseId, rows[^1].SafehouseName, rows[^1].UtilizationPct)
            : null;

        var avgOcc = rows.Count > 0 ? Math.Round(rows.Average(r => r.UtilizationPct), 1) : 0m;
        var turnoverAvg = rows.Count > 0 ? Math.Round(rows.Average(r => r.TurnoverRate), 1) : 0m;
        var housed = filteredResidents.Count(r =>
            r.DateOfAdmission != null &&
            r.DateOfAdmission <= rangeEnd &&
            (r.DateClosed == null || r.DateClosed > rangeEnd));

        return new DashboardSafehousesOverviewSlice(
            rangeStart.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            rangeEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            rows.Count,
            avgOcc,
            highest,
            lowest,
            housed,
            turnoverAvg);
    }

    private sealed record SafehouseComparisonScratch(
        string SafehouseId,
        string SafehouseName,
        int Capacity,
        int CurrentOccupancy,
        decimal UtilizationPct,
        int Admissions,
        int Exits,
        decimal CompletionRate,
        decimal TurnoverRate);

    private static decimal DonationValue(Donation d) => d.Amount ?? d.EstimatedValue ?? 0m;

    private static decimal ComputePercentChangeDecimal(decimal current, decimal previous)
    {
        if (previous == 0m)
            return current == 0m ? 0m : 100m;
        return Math.Round(((current - previous) / previous) * 100m, 1);
    }

    private static decimal ComputeResidentCompletionRate(List<Resident> residents)
    {
        if (residents.Count == 0)
            return 0m;
        var completed = residents.Count(r =>
            string.Equals(MapResidentReportStatus(r), "Completed", StringComparison.OrdinalIgnoreCase));
        return Math.Round((completed * 100m) / residents.Count, 1);
    }

    private static string MapResidentReportStatus(Resident resident)
    {
        if (resident.ReintegrationStatus != null &&
            resident.ReintegrationStatus.Contains("Completed", StringComparison.OrdinalIgnoreCase))
            return "Completed";

        if (resident.CaseStatus != null &&
            resident.CaseStatus.Contains("Transfer", StringComparison.OrdinalIgnoreCase))
            return "Transferred";

        if (resident.ReintegrationStatus != null &&
            resident.ReintegrationStatus.Contains("Hold", StringComparison.OrdinalIgnoreCase))
            return "On Hold";

        if (resident.DateClosed != null ||
            (resident.CaseStatus != null && resident.CaseStatus.Contains("Closed", StringComparison.OrdinalIgnoreCase)))
            return "Closed";

        if (resident.CaseStatus != null &&
            resident.CaseStatus.Contains("Active", StringComparison.OrdinalIgnoreCase))
            return "Active";

        return ShNormalizeLabel(resident.CaseStatus, "Unknown");
    }

    private static decimal ShComputeTurnoverRate(int admissions, int exits, List<SafehouseMonthlyMetric> metrics)
    {
        var avgActive = metrics.Count > 0
            ? metrics.Select(m => ShParseInt(m.ActiveResidents)).DefaultIfEmpty(0).Average()
            : 0d;

        if (avgActive <= 0d)
            return admissions + exits > 0 ? 100m : 0m;

        return Math.Round((decimal)((admissions + exits) * 100d / avgActive), 1);
    }

    private static int ShParseInt(string? value) => int.TryParse(value, out var parsed) ? parsed : 0;

    private static string ShNormalizeLabel(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
}
