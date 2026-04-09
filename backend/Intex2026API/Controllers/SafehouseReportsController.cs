using System.Globalization;
using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

public record SafehouseReportFiltersDto(
    string StartDate,
    string EndDate,
    string? SafehouseId,
    string? Region);

public record SafehouseUtilizationMarkerDto(string SafehouseId, string Name, decimal UtilizationPct);

public record SafehouseSummaryDto(
    SafehouseReportFiltersDto Filters,
    int TotalSafehouses,
    decimal AverageOccupancyRate,
    SafehouseUtilizationMarkerDto? HighestUtilization,
    SafehouseUtilizationMarkerDto? LowestUtilization,
    int TotalResidentsHoused,
    decimal TurnoverRate);

public record SafehouseOccupancyPointDto(
    string Bucket,
    string Label,
    int ActiveResidents,
    decimal AverageUtilizationPct);

public record SafehouseComparisonRowDto(
    string SafehouseId,
    string SafehouseName,
    string Region,
    int Capacity,
    int CurrentOccupancy,
    decimal UtilizationPct,
    int Admissions,
    int Exits,
    decimal AverageLengthOfStayDays,
    decimal CompletionRate,
    decimal TurnoverRate);

public record SafehouseOutcomeRowDto(
    string SafehouseId,
    string SafehouseName,
    int CompletedResidents,
    int TotalResidents,
    decimal CompletionRate);

public record SafehouseFlowRowDto(
    string SafehouseId,
    string SafehouseName,
    int Entries,
    int Exits);

public record SafehouseFilterOptionDto(string Id, string Label);

public record SafehouseFilterOptionsDto(
    List<SafehouseFilterOptionDto> Safehouses,
    List<string> Regions,
    string EarliestDate,
    string LatestDate);

[ApiController]
[Route("api/reports/safehouses")]
[Authorize(Roles = "Admin")]
public class SafehouseReportsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public SafehouseReportsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<SafehouseSummaryDto>> GetSummary(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? region = null)
    {
        var query = await BuildQuery(startDate, endDate, safehouseId, region);
        var safehouseRows = BuildComparisonRows(query);
        var currentResidents = CountCurrentResidents(query.Residents, query.EndDate, query.Filters.SafehouseId, query.Filters.Region);

        var summary = new SafehouseSummaryDto(
            query.Filters,
            safehouseRows.Count,
            safehouseRows.Count > 0 ? Math.Round(safehouseRows.Average(r => r.UtilizationPct), 1) : 0m,
            safehouseRows.OrderByDescending(r => r.UtilizationPct).Select(r => new SafehouseUtilizationMarkerDto(r.SafehouseId, r.SafehouseName, r.UtilizationPct)).FirstOrDefault(),
            safehouseRows.OrderBy(r => r.UtilizationPct).Select(r => new SafehouseUtilizationMarkerDto(r.SafehouseId, r.SafehouseName, r.UtilizationPct)).FirstOrDefault(),
            currentResidents,
            ComputeTurnoverRate(safehouseRows));

        return Ok(summary);
    }

    [HttpGet("occupancy")]
    public async Task<ActionResult<IEnumerable<SafehouseOccupancyPointDto>>> GetOccupancy(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? region = null)
    {
        var query = await BuildQuery(startDate, endDate, safehouseId, region);
        var metrics = query.MonthlyMetrics
            .Where(m => m.MonthStart != null && m.MonthEnd != null)
            .ToList();

        var points = metrics
            .GroupBy(m => m.MonthStart!.Value.ToString("yyyy-MM", CultureInfo.InvariantCulture))
            .Select(g =>
            {
                var metricRows = g.ToList();
                var utilizationValues = metricRows
                    .Select(m =>
                    {
                        var capacity = query.SafehouseCapacity.TryGetValue(m.SafehouseId ?? string.Empty, out var cap) ? cap : 0;
                        var active = ParseInt(m.ActiveResidents);
                        return capacity > 0 ? (decimal)active * 100m / capacity : 0m;
                    })
                    .ToList();

                var labelDate = metricRows.Min(m => m.MonthStart!.Value);

                return new SafehouseOccupancyPointDto(
                    g.Key,
                    labelDate.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    metricRows.Sum(m => ParseInt(m.ActiveResidents)),
                    utilizationValues.Count > 0 ? Math.Round(utilizationValues.Average(), 1) : 0m);
            })
            .OrderBy(p => p.Bucket)
            .ToList();

        return Ok(points);
    }

    [HttpGet("comparison")]
    public async Task<ActionResult<IEnumerable<SafehouseComparisonRowDto>>> GetComparison(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? region = null)
    {
        var query = await BuildQuery(startDate, endDate, safehouseId, region);
        return Ok(BuildComparisonRows(query));
    }

    [HttpGet("outcomes")]
    public async Task<ActionResult<IEnumerable<SafehouseOutcomeRowDto>>> GetOutcomes(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? region = null)
    {
        var query = await BuildQuery(startDate, endDate, safehouseId, region);
        var rows = query.Safehouses
            .Select(sh =>
            {
                var residents = query.Residents
                    .Where(r => string.Equals(r.SafehouseId, sh.SafehouseId, StringComparison.OrdinalIgnoreCase))
                    .ToList();
                var completed = residents.Count(r =>
                    r.ReintegrationStatus != null &&
                    r.ReintegrationStatus.Contains("Completed", StringComparison.OrdinalIgnoreCase));
                var total = residents.Count;
                return new SafehouseOutcomeRowDto(
                    sh.SafehouseId ?? "unknown",
                    NormalizeLabel(sh.Name, $"Safehouse {sh.SafehouseId}"),
                    completed,
                    total,
                    total > 0 ? Math.Round((completed * 100m) / total, 1) : 0m);
            })
            .OrderByDescending(r => r.CompletionRate)
            .ToList();

        return Ok(rows);
    }

    [HttpGet("flow")]
    public async Task<ActionResult<IEnumerable<SafehouseFlowRowDto>>> GetFlow(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? region = null)
    {
        var query = await BuildQuery(startDate, endDate, safehouseId, region);
        var rows = query.Safehouses
            .Select(sh =>
            {
                var residents = query.Residents.Where(r => string.Equals(r.SafehouseId, sh.SafehouseId, StringComparison.OrdinalIgnoreCase)).ToList();
                return new SafehouseFlowRowDto(
                    sh.SafehouseId ?? "unknown",
                    NormalizeLabel(sh.Name, $"Safehouse {sh.SafehouseId}"),
                    residents.Count(r => r.DateOfAdmission != null && r.DateOfAdmission >= query.StartDate && r.DateOfAdmission <= query.EndDate),
                    residents.Count(r => r.DateClosed != null && r.DateClosed >= query.StartDate && r.DateClosed <= query.EndDate));
            })
            .OrderByDescending(r => r.Entries)
            .ToList();

        return Ok(rows);
    }

    [HttpGet("filters")]
    public async Task<ActionResult<SafehouseFilterOptionsDto>> GetFilters()
    {
        var safehouses = await _context.Safehouses.AsNoTracking().Where(s => s.SafehouseId != null).ToListAsync();
        var monthlyMetrics = await _context.SafehouseMonthlyMetrics.AsNoTracking().Where(m => m.MonthStart != null).ToListAsync();
        var earliest = monthlyMetrics.Select(m => m.MonthStart!.Value).OrderBy(d => d).FirstOrDefault();
        var latest = monthlyMetrics.Select(m => m.MonthStart!.Value).OrderBy(d => d).LastOrDefault();

        return Ok(new SafehouseFilterOptionsDto(
            safehouses
                .OrderBy(s => s.Name)
                .Select(s => new SafehouseFilterOptionDto(s.SafehouseId!, NormalizeLabel(s.Name, $"Safehouse {s.SafehouseId}")))
                .ToList(),
            safehouses.Select(s => NormalizeLabel(s.Region, "Unknown")).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList(),
            earliest == default ? string.Empty : earliest.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            latest == default ? string.Empty : latest.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));
    }

    private async Task<(List<Safehouse> Safehouses, List<Resident> Residents, List<SafehouseMonthlyMetric> MonthlyMetrics, Dictionary<string, int> SafehouseCapacity, SafehouseReportFiltersDto Filters, DateOnly StartDate, DateOnly EndDate)> BuildQuery(
        string? startDate,
        string? endDate,
        string? safehouseId,
        string? region)
    {
        var metrics = await _context.SafehouseMonthlyMetrics.AsNoTracking().ToListAsync();
        var safehouses = await _context.Safehouses.AsNoTracking().ToListAsync();
        var residents = await _context.Residents.AsNoTracking().ToListAsync();

        var earliestMetric = metrics.Where(m => m.MonthStart != null).Select(m => m.MonthStart!.Value).OrderBy(d => d).FirstOrDefault();
        var latestMetric = metrics.Where(m => m.MonthStart != null).Select(m => m.MonthStart!.Value).OrderBy(d => d).LastOrDefault();

        var rangeStart = ParseDate(startDate) ?? (earliestMetric == default ? DateOnly.FromDateTime(DateTime.UtcNow).AddMonths(-11) : earliestMetric);
        var rangeEnd = ParseDate(endDate) ?? (latestMetric == default ? DateOnly.FromDateTime(DateTime.UtcNow) : latestMetric);
        if (rangeStart > rangeEnd)
        {
            (rangeStart, rangeEnd) = (rangeEnd, rangeStart);
        }

        var normalizedSafehouseId = string.IsNullOrWhiteSpace(safehouseId) ? null : safehouseId.Trim();
        var normalizedRegion = string.IsNullOrWhiteSpace(region) ? null : region.Trim();

        var filteredSafehouses = safehouses
            .Where(s =>
                (normalizedSafehouseId == null || string.Equals(s.SafehouseId, normalizedSafehouseId, StringComparison.OrdinalIgnoreCase)) &&
                (normalizedRegion == null || string.Equals(s.Region, normalizedRegion, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        var safehouseIds = filteredSafehouses
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

        var capacityMap = filteredSafehouses.ToDictionary(
            s => s.SafehouseId ?? string.Empty,
            s => ParseInt(s.CapacityGirls),
            StringComparer.OrdinalIgnoreCase);

        return (
            filteredSafehouses,
            filteredResidents,
            filteredMetrics,
            capacityMap,
            new SafehouseReportFiltersDto(
                rangeStart.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                rangeEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                normalizedSafehouseId,
                normalizedRegion),
            rangeStart,
            rangeEnd);
    }

    private static List<SafehouseComparisonRowDto> BuildComparisonRows(
        (List<Safehouse> Safehouses, List<Resident> Residents, List<SafehouseMonthlyMetric> MonthlyMetrics, Dictionary<string, int> SafehouseCapacity, SafehouseReportFiltersDto Filters, DateOnly StartDate, DateOnly EndDate) query)
    {
        return query.Safehouses
            .Select(sh =>
            {
                var safehouseId = sh.SafehouseId ?? "unknown";
                var residents = query.Residents.Where(r => string.Equals(r.SafehouseId, safehouseId, StringComparison.OrdinalIgnoreCase)).ToList();
                var metrics = query.MonthlyMetrics.Where(m => string.Equals(m.SafehouseId, safehouseId, StringComparison.OrdinalIgnoreCase)).ToList();
                var capacity = ParseInt(sh.CapacityGirls);
                var currentOccupancy = ParseInt(sh.CurrentOccupancy);
                var admissions = residents.Count(r => r.DateOfAdmission != null && r.DateOfAdmission >= query.StartDate && r.DateOfAdmission <= query.EndDate);
                var exits = residents.Count(r => r.DateClosed != null && r.DateClosed >= query.StartDate && r.DateClosed <= query.EndDate);
                var avgLength = residents.Count > 0
                    ? Math.Round(residents.Where(r => r.DateOfAdmission != null).Select(r => (decimal)GetLengthOfStayDays(r, query.EndDate)).DefaultIfEmpty(0m).Average(), 1)
                    : 0m;
                var completionRate = residents.Count > 0
                    ? Math.Round((residents.Count(r => r.ReintegrationStatus != null && r.ReintegrationStatus.Contains("Completed", StringComparison.OrdinalIgnoreCase)) * 100m) / residents.Count, 1)
                    : 0m;
                var turnoverRate = ComputeTurnoverRate(admissions, exits, metrics);
                var utilization = capacity > 0 ? Math.Round((currentOccupancy * 100m) / capacity, 1) : 0m;

                return new SafehouseComparisonRowDto(
                    safehouseId,
                    NormalizeLabel(sh.Name, $"Safehouse {safehouseId}"),
                    NormalizeLabel(sh.Region, "Unknown"),
                    capacity,
                    currentOccupancy,
                    utilization,
                    admissions,
                    exits,
                    avgLength,
                    completionRate,
                    turnoverRate);
            })
            .OrderByDescending(r => r.UtilizationPct)
            .ToList();
    }

    private static int CountCurrentResidents(List<Resident> residents, DateOnly endDate, string? safehouseId, string? region) =>
        residents.Count(r => r.DateOfAdmission != null && r.DateOfAdmission <= endDate && (r.DateClosed == null || r.DateClosed > endDate));

    private static decimal ComputeTurnoverRate(List<SafehouseComparisonRowDto> rows)
    {
        if (rows.Count == 0)
        {
            return 0m;
        }

        return Math.Round(rows.Average(r => r.TurnoverRate), 1);
    }

    private static decimal ComputeTurnoverRate(int admissions, int exits, List<SafehouseMonthlyMetric> metrics)
    {
        var avgActive = metrics.Count > 0
            ? metrics.Select(m => ParseInt(m.ActiveResidents)).DefaultIfEmpty(0).Average()
            : 0d;

        if (avgActive <= 0d)
        {
            return admissions + exits > 0 ? 100m : 0m;
        }

        return Math.Round((decimal)((admissions + exits) * 100d / avgActive), 1);
    }

    private static int GetLengthOfStayDays(Resident resident, DateOnly rangeEnd)
    {
        if (resident.DateOfAdmission == null)
        {
            return 0;
        }

        var end = resident.DateClosed ?? rangeEnd;
        return Math.Max(end.DayNumber - resident.DateOfAdmission.Value.DayNumber, 0);
    }

    private static int ParseInt(string? value) => int.TryParse(value, out var parsed) ? parsed : 0;

    private static string NormalizeLabel(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static DateOnly? ParseDate(string? value) =>
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
            ? parsed
            : null;
}
