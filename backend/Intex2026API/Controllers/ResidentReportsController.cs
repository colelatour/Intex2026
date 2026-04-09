using System.Globalization;
using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

public record ResidentReportFiltersDto(
    string StartDate,
    string EndDate,
    string? Status,
    string? SafehouseId,
    string? CaseCategory);

public record ResidentReportSummaryDto(
    ResidentReportFiltersDto Filters,
    int TotalResidentsHistorical,
    int TotalResidentsInRange,
    int ActiveResidents,
    decimal CompletionRate,
    decimal AverageLengthOfStayDays,
    int PreviousPeriodAdmissions,
    decimal IntakeChangePercent);

public record ResidentTrendPointDto(
    string Bucket,
    string Label,
    int NewResidents,
    int ActiveResidents);

public record ResidentStatusSliceDto(string Label, int Count, decimal Percentage);

public record ResidentLengthOfStayBucketDto(string Label, int MinDays, int MaxDays, int Count);

public record ResidentOutcomeBarDto(string Label, int Count, decimal Percentage);

public record ResidentExitPathwayDto(string Label, int Count, decimal Percentage);

public record ResidentFilterOptionDto(string Id, string Label);

public record ResidentFilterOptionsDto(
    List<string> Statuses,
    List<string> CaseCategories,
    List<ResidentFilterOptionDto> Safehouses,
    string EarliestAdmissionDate,
    string LatestAdmissionDate);

[ApiController]
[Route("api/reports/residents")]
[Authorize(Roles = "Admin")]
public class ResidentReportsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public ResidentReportsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ResidentReportSummaryDto>> GetSummary(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? status = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? caseCategory = null)
    {
        var query = await BuildResidentQuery(startDate, endDate, status, safehouseId, caseCategory);
        var filteredResidents = query.FilteredResidents;
        var previousPeriodAdmissions = query.AllResidents.Count(r =>
            r.DateOfAdmission != null &&
            r.DateOfAdmission >= query.PreviousStartDate &&
            r.DateOfAdmission <= query.PreviousEndDate &&
            ResidentMatchesDimensions(r, query.Filters.Status, query.Filters.SafehouseId, query.Filters.CaseCategory));

        // KPIs are designed for admin decisions: current caseload, throughput, completion health, and intake momentum.
        var summary = new ResidentReportSummaryDto(
            query.Filters,
            query.AllResidents.Count,
            filteredResidents.Count,
            filteredResidents.Count(r => string.Equals(MapResidentStatus(r), "Active", StringComparison.OrdinalIgnoreCase)),
            ComputeCompletionRate(filteredResidents),
            ComputeAverageLengthOfStay(filteredResidents, query.EndDate),
            previousPeriodAdmissions,
            ComputePercentChange(filteredResidents.Count, previousPeriodAdmissions));

        return Ok(summary);
    }

    [HttpGet("trends")]
    public async Task<ActionResult<IEnumerable<ResidentTrendPointDto>>> GetTrends(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? status = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? caseCategory = null,
        [FromQuery] string granularity = "month")
    {
        var query = await BuildResidentQuery(startDate, endDate, status, safehouseId, caseCategory);
        var timelineResidents = query.AllResidents
            .Where(r => ResidentMatchesDimensions(r, query.Filters.Status, query.Filters.SafehouseId, query.Filters.CaseCategory))
            .ToList();

        var points = BuildBuckets(query.StartDate, query.EndDate, granularity)
            .Select(bucket =>
            {
                var newResidents = timelineResidents.Count(r =>
                    r.DateOfAdmission != null &&
                    r.DateOfAdmission >= bucket.Start &&
                    r.DateOfAdmission <= bucket.End);

                var activeResidents = timelineResidents.Count(r =>
                    r.DateOfAdmission != null &&
                    r.DateOfAdmission <= bucket.End &&
                    (r.DateClosed == null || r.DateClosed > bucket.End));

                return new ResidentTrendPointDto(bucket.Key, bucket.Label, newResidents, activeResidents);
            })
            .ToList();

        return Ok(points);
    }

    [HttpGet("status-breakdown")]
    public async Task<ActionResult<IEnumerable<ResidentStatusSliceDto>>> GetStatusBreakdown(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? status = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? caseCategory = null)
    {
        var query = await BuildResidentQuery(startDate, endDate, status, safehouseId, caseCategory);
        var total = query.FilteredResidents.Count;

        var slices = query.FilteredResidents
            .GroupBy(MapResidentStatus)
            .Select(g => new ResidentStatusSliceDto(
                g.Key,
                g.Count(),
                total > 0 ? Math.Round((g.Count() * 100m) / total, 1) : 0m))
            .OrderByDescending(s => s.Count)
            .ToList();

        return Ok(slices);
    }

    [HttpGet("length-of-stay")]
    public async Task<ActionResult<IEnumerable<ResidentLengthOfStayBucketDto>>> GetLengthOfStay(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? status = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? caseCategory = null)
    {
        var query = await BuildResidentQuery(startDate, endDate, status, safehouseId, caseCategory);
        var buckets = new[]
        {
            new { Label = "0-90 days", Min = 0, Max = 90 },
            new { Label = "91-180 days", Min = 91, Max = 180 },
            new { Label = "181-365 days", Min = 181, Max = 365 },
            new { Label = "366-730 days", Min = 366, Max = 730 },
            new { Label = "731+ days", Min = 731, Max = int.MaxValue },
        };

        var result = buckets
            .Select(bucket => new ResidentLengthOfStayBucketDto(
                bucket.Label,
                bucket.Min,
                bucket.Max == int.MaxValue ? 99999 : bucket.Max,
                query.FilteredResidents.Count(r =>
                {
                    var length = GetLengthOfStayDays(r, query.EndDate);
                    return length >= bucket.Min && length <= bucket.Max;
                })))
            .ToList();

        return Ok(result);
    }

    [HttpGet("outcomes")]
    public async Task<ActionResult<IEnumerable<ResidentOutcomeBarDto>>> GetOutcomes(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? status = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? caseCategory = null)
    {
        var query = await BuildResidentQuery(startDate, endDate, status, safehouseId, caseCategory);
        var total = query.FilteredResidents.Count;

        var outcomes = query.FilteredResidents
            .GroupBy(r => NormalizeLabel(r.ReintegrationStatus, "Not Recorded"))
            .Select(g => new ResidentOutcomeBarDto(
                g.Key,
                g.Count(),
                total > 0 ? Math.Round((g.Count() * 100m) / total, 1) : 0m))
            .OrderByDescending(o => o.Count)
            .ToList();

        return Ok(outcomes);
    }

    [HttpGet("exit-pathways")]
    public async Task<ActionResult<IEnumerable<ResidentExitPathwayDto>>> GetExitPathways(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? status = null,
        [FromQuery] string? safehouseId = null,
        [FromQuery] string? caseCategory = null)
    {
        var query = await BuildResidentQuery(startDate, endDate, status, safehouseId, caseCategory);
        var exitedResidents = query.FilteredResidents
            .Where(r =>
                r.DateClosed != null ||
                string.Equals(MapResidentStatus(r), "Completed", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(MapResidentStatus(r), "Closed", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(MapResidentStatus(r), "Transferred", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var total = exitedResidents.Count;

        var pathways = exitedResidents
            .GroupBy(r => NormalizeLabel(r.ReintegrationType, "No recorded pathway"))
            .Select(g => new ResidentExitPathwayDto(
                g.Key,
                g.Count(),
                total > 0 ? Math.Round((g.Count() * 100m) / total, 1) : 0m))
            .OrderByDescending(x => x.Count)
            .ToList();

        return Ok(pathways);
    }

    [HttpGet("filters")]
    public async Task<ActionResult<ResidentFilterOptionsDto>> GetFilters()
    {
        var residents = await _context.Residents.AsNoTracking().ToListAsync();
        var safehouses = await _context.Safehouses.AsNoTracking().ToListAsync();
        var admissionDates = residents
            .Where(r => r.DateOfAdmission != null)
            .Select(r => r.DateOfAdmission!.Value)
            .OrderBy(d => d)
            .ToList();

        var earliestAdmission = admissionDates.FirstOrDefault();
        var latestAdmission = admissionDates.LastOrDefault();

        return Ok(new ResidentFilterOptionsDto(
            residents.Select(MapResidentStatus).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList(),
            residents.Select(r => NormalizeLabel(r.CaseCategory, "Unspecified")).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList(),
            safehouses
                .Where(s => !string.IsNullOrWhiteSpace(s.SafehouseId))
                .OrderBy(s => s.Name)
                .Select(s => new ResidentFilterOptionDto(s.SafehouseId!, NormalizeLabel(s.Name, $"Safehouse {s.SafehouseId}")))
                .ToList(),
            earliestAdmission == default ? string.Empty : earliestAdmission.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            latestAdmission == default ? string.Empty : latestAdmission.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));
    }

    private async Task<(List<Resident> AllResidents, List<Resident> FilteredResidents, ResidentReportFiltersDto Filters, DateOnly StartDate, DateOnly EndDate, DateOnly PreviousStartDate, DateOnly PreviousEndDate)> BuildResidentQuery(
        string? startDate,
        string? endDate,
        string? status,
        string? safehouseId,
        string? caseCategory)
    {
        var latestAdmission = await _context.Residents.AsNoTracking()
            .Where(r => r.DateOfAdmission != null)
            .MaxAsync(r => (DateOnly?)r.DateOfAdmission) ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var rangeEnd = ParseDate(endDate) ?? latestAdmission;
        var rangeStart = ParseDate(startDate) ?? rangeEnd.AddMonths(-11);
        if (rangeStart > rangeEnd)
        {
            (rangeStart, rangeEnd) = (rangeEnd, rangeStart);
        }

        var normalizedStatus = string.IsNullOrWhiteSpace(status) ? null : status.Trim();
        var normalizedSafehouseId = string.IsNullOrWhiteSpace(safehouseId) ? null : safehouseId.Trim();
        var normalizedCategory = string.IsNullOrWhiteSpace(caseCategory) ? null : caseCategory.Trim();

        var allResidents = await _context.Residents.AsNoTracking()
            .Where(r => r.DateOfAdmission != null)
            .ToListAsync();

        var filtered = allResidents
            .Where(r =>
                r.DateOfAdmission != null &&
                r.DateOfAdmission >= rangeStart &&
                r.DateOfAdmission <= rangeEnd &&
                ResidentMatchesDimensions(r, normalizedStatus, normalizedSafehouseId, normalizedCategory))
            .ToList();

        var daySpan = rangeEnd.DayNumber - rangeStart.DayNumber + 1;
        var previousEnd = rangeStart.AddDays(-1);
        var previousStart = previousEnd.AddDays(-(daySpan - 1));

        return (
            allResidents,
            filtered,
            new ResidentReportFiltersDto(
                rangeStart.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                rangeEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                normalizedStatus,
                normalizedSafehouseId,
                normalizedCategory),
            rangeStart,
            rangeEnd,
            previousStart,
            previousEnd);
    }

    private static bool ResidentMatchesDimensions(Resident resident, string? status, string? safehouseId, string? caseCategory)
    {
        if (!string.IsNullOrWhiteSpace(status) &&
            !string.Equals(MapResidentStatus(resident), status, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(safehouseId) &&
            !string.Equals(resident.SafehouseId, safehouseId, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(caseCategory) &&
            !string.Equals(NormalizeLabel(resident.CaseCategory, "Unspecified"), caseCategory, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }

    private static decimal ComputeCompletionRate(List<Resident> residents)
    {
        if (residents.Count == 0)
        {
            return 0m;
        }

        var completed = residents.Count(r => string.Equals(MapResidentStatus(r), "Completed", StringComparison.OrdinalIgnoreCase));
        return Math.Round((completed * 100m) / residents.Count, 1);
    }

    private static decimal ComputeAverageLengthOfStay(List<Resident> residents, DateOnly rangeEnd)
    {
        var values = residents
            .Where(r => r.DateOfAdmission != null)
            .Select(r => (decimal)GetLengthOfStayDays(r, rangeEnd))
            .ToList();

        return values.Count == 0 ? 0m : Math.Round(values.Average(), 1);
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

    private static decimal ComputePercentChange(decimal current, decimal previous)
    {
        if (previous == 0m)
        {
            return current == 0m ? 0m : 100m;
        }

        return Math.Round(((current - previous) / previous) * 100m, 1);
    }

    private static DateOnly? ParseDate(string? value) =>
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
            ? parsed
            : null;

    private static string NormalizeLabel(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static string MapResidentStatus(Resident resident)
    {
        if (resident.ReintegrationStatus != null &&
            resident.ReintegrationStatus.Contains("Completed", StringComparison.OrdinalIgnoreCase))
        {
            return "Completed";
        }

        if (resident.CaseStatus != null &&
            resident.CaseStatus.Contains("Transfer", StringComparison.OrdinalIgnoreCase))
        {
            return "Transferred";
        }

        if (resident.ReintegrationStatus != null &&
            resident.ReintegrationStatus.Contains("Hold", StringComparison.OrdinalIgnoreCase))
        {
            return "On Hold";
        }

        if (resident.DateClosed != null ||
            (resident.CaseStatus != null && resident.CaseStatus.Contains("Closed", StringComparison.OrdinalIgnoreCase)))
        {
            return "Closed";
        }

        if (resident.CaseStatus != null &&
            resident.CaseStatus.Contains("Active", StringComparison.OrdinalIgnoreCase))
        {
            return "Active";
        }

        return NormalizeLabel(resident.CaseStatus, "Unknown");
    }

    private static List<(string Key, string Label, DateOnly Start, DateOnly End)> BuildBuckets(DateOnly startDate, DateOnly endDate, string granularity)
    {
        var buckets = new List<(string Key, string Label, DateOnly Start, DateOnly End)>();

        if (string.Equals(granularity, "day", StringComparison.OrdinalIgnoreCase))
        {
            for (var day = startDate; day <= endDate; day = day.AddDays(1))
            {
                buckets.Add((day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), day.ToString("MMM d", CultureInfo.InvariantCulture), day, day));
            }

            return buckets;
        }

        if (string.Equals(granularity, "week", StringComparison.OrdinalIgnoreCase))
        {
            var cursor = startDate;
            while (cursor <= endDate)
            {
                var weekEnd = cursor.AddDays(6);
                if (weekEnd > endDate)
                {
                    weekEnd = endDate;
                }

                buckets.Add((cursor.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), $"Week of {cursor:MMM d}", cursor, weekEnd));
                cursor = weekEnd.AddDays(1);
            }

            return buckets;
        }

        var monthCursor = new DateOnly(startDate.Year, startDate.Month, 1);
        while (monthCursor <= endDate)
        {
            var monthEnd = monthCursor.AddMonths(1).AddDays(-1);
            if (monthEnd > endDate)
            {
                monthEnd = endDate;
            }

            var bucketStart = monthCursor < startDate ? startDate : monthCursor;
            buckets.Add(($"{monthCursor.Year:D4}-{monthCursor.Month:D2}", monthCursor.ToString("MMM yyyy", CultureInfo.InvariantCulture), bucketStart, monthEnd));
            monthCursor = monthCursor.AddMonths(1);
        }

        return buckets;
    }
}
