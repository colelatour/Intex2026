using System.Globalization;
using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

public record DonationReportFiltersDto(
    string StartDate,
    string EndDate,
    decimal? MinAmount,
    decimal? MaxAmount,
    string? Campaign,
    string? Breakdown);

public record DonationReportSummaryDto(
    DonationReportFiltersDto Filters,
    decimal TotalDonationsLifetime,
    decimal TotalDonationsInRange,
    int DonationCount,
    int DonorCount,
    decimal AverageDonation,
    decimal MedianDonation,
    decimal PreviousPeriodTotal,
    decimal PercentChangeFromPreviousPeriod);

public record DonationTrendPointDto(
    string Bucket,
    string Label,
    decimal TotalAmount,
    int DonationCount);

public record DonationDistributionBucketDto(
    string Label,
    decimal MinAmount,
    decimal MaxAmount,
    int DonationCount,
    decimal TotalAmount);

public record DonationBreakdownSliceDto(
    string Label,
    decimal TotalAmount,
    int DonationCount,
    decimal Percentage);

public record TopContributorDto(
    string SupporterId,
    string Name,
    decimal TotalAmount,
    int DonationCount,
    string? PrimaryCampaign);

public record DonationFilterOptionsDto(
    List<string> Campaigns,
    decimal SuggestedMinAmount,
    decimal SuggestedMaxAmount);

[ApiController]
[Route("api/reports/donations")]
[Authorize(Roles = "Admin")]
public class DonationReportsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public DonationReportsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DonationReportSummaryDto>> GetSummary(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] decimal? minAmount = null,
        [FromQuery] decimal? maxAmount = null,
        [FromQuery] string? campaign = null,
        [FromQuery] string? breakdown = null)
    {
        var query = await BuildFilteredDonationQuery(startDate, endDate, minAmount, maxAmount, campaign, breakdown);
        var rangeDonations = await query.Query.ToListAsync();
        var values = rangeDonations.Select(GetDonationValue).OrderBy(v => v).ToList();
        var previousPeriod = await BuildPreviousPeriodQuery(query).ToListAsync();

        var lifetimeTotal = await _context.Donations.AsNoTracking().SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0m);
        var rangeTotal = values.Sum();
        var previousTotal = previousPeriod.Sum(GetDonationValue);
        var donorCount = rangeDonations
            .Select(d => d.SupporterId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        return Ok(new DonationReportSummaryDto(
            query.Filters,
            lifetimeTotal,
            rangeTotal,
            rangeDonations.Count,
            donorCount,
            values.Count > 0 ? values.Average() : 0m,
            ComputeMedian(values),
            previousTotal,
            ComputePercentChange(rangeTotal, previousTotal)));
    }

    [HttpGet("trends")]
    public async Task<ActionResult<IEnumerable<DonationTrendPointDto>>> GetTrends(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] decimal? minAmount = null,
        [FromQuery] decimal? maxAmount = null,
        [FromQuery] string? campaign = null,
        [FromQuery] string granularity = "month",
        [FromQuery] string? breakdown = null)
    {
        var query = await BuildFilteredDonationQuery(startDate, endDate, minAmount, maxAmount, campaign, breakdown);
        var donations = await query.Query.ToListAsync();

        var points = donations
            .GroupBy(d => GetTimeBucket(d.DonationDate ?? query.StartDate, granularity))
            .Select(g => new DonationTrendPointDto(
                g.Key.Bucket,
                g.Key.Label,
                g.Sum(GetDonationValue),
                g.Count()))
            .OrderBy(p => p.Bucket)
            .ToList();

        return Ok(points);
    }

    [HttpGet("distribution")]
    public async Task<ActionResult<IEnumerable<DonationDistributionBucketDto>>> GetDistribution(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] decimal? minAmount = null,
        [FromQuery] decimal? maxAmount = null,
        [FromQuery] string? campaign = null,
        [FromQuery] string? breakdown = null)
    {
        var query = await BuildFilteredDonationQuery(startDate, endDate, minAmount, maxAmount, campaign, breakdown);
        var donations = await query.Query.ToListAsync();
        var values = donations.Select(GetDonationValue).Where(v => v > 0).OrderBy(v => v).ToList();

        if (values.Count == 0)
        {
            return Ok(Array.Empty<DonationDistributionBucketDto>());
        }

        var bucketCount = Math.Min(6, Math.Max(3, (int)Math.Ceiling(Math.Sqrt(values.Count))));
        var min = values.First();
        var max = values.Last();
        var width = Math.Max((max - min) / bucketCount, 1m);
        var buckets = new List<DonationDistributionBucketDto>();

        for (var i = 0; i < bucketCount; i++)
        {
            var bucketMin = min + (width * i);
            var bucketMax = i == bucketCount - 1 ? max : min + (width * (i + 1));
            var bucketDonations = donations.Where(d =>
            {
                var value = GetDonationValue(d);
                if (i == bucketCount - 1)
                {
                    return value >= bucketMin && value <= bucketMax;
                }

                return value >= bucketMin && value < bucketMax;
            }).ToList();

            buckets.Add(new DonationDistributionBucketDto(
                $"{FormatCurrency(bucketMin)}-{FormatCurrency(bucketMax)}",
                bucketMin,
                bucketMax,
                bucketDonations.Count,
                bucketDonations.Sum(GetDonationValue)));
        }

        return Ok(buckets);
    }

    [HttpGet("breakdown")]
    public async Task<ActionResult<IEnumerable<DonationBreakdownSliceDto>>> GetBreakdown(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] decimal? minAmount = null,
        [FromQuery] decimal? maxAmount = null,
        [FromQuery] string? campaign = null,
        [FromQuery] string breakdown = "campaign")
    {
        var query = await BuildFilteredDonationQuery(startDate, endDate, minAmount, maxAmount, campaign, breakdown);
        var donations = await query.Query.ToListAsync();
        var total = donations.Sum(GetDonationValue);

        var slices = donations
            .GroupBy(d => GetBreakdownLabel(d, breakdown))
            .Select(g => new DonationBreakdownSliceDto(
                g.Key,
                g.Sum(GetDonationValue),
                g.Count(),
                total > 0 ? Math.Round((g.Sum(GetDonationValue) / total) * 100m, 1) : 0m))
            .OrderByDescending(s => s.TotalAmount)
            .Take(6)
            .ToList();

        return Ok(slices);
    }

    [HttpGet("top-contributors")]
    public async Task<ActionResult<IEnumerable<TopContributorDto>>> GetTopContributors(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] decimal? minAmount = null,
        [FromQuery] decimal? maxAmount = null,
        [FromQuery] string? campaign = null,
        [FromQuery] string? breakdown = null,
        [FromQuery] int limit = 8)
    {
        var query = await BuildFilteredDonationQuery(startDate, endDate, minAmount, maxAmount, campaign, breakdown);
        var donations = await query.Query.ToListAsync();

        var supporterIds = donations
            .Select(d => d.SupporterId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Cast<string>()
            .ToList();

        var supporters = await _context.Supporters.AsNoTracking()
            .Where(s => s.SupporterId != null && supporterIds.Contains(s.SupporterId))
            .ToListAsync();

        var supporterMap = supporters
            .Where(s => s.SupporterId != null)
            .ToDictionary(s => s.SupporterId!, GetSupporterName, StringComparer.OrdinalIgnoreCase);

        var rows = donations
            .GroupBy(d => d.SupporterId ?? "unknown")
            .Select(g => new TopContributorDto(
                g.Key,
                supporterMap.TryGetValue(g.Key, out var name) ? name : $"Supporter {g.Key}",
                g.Sum(GetDonationValue),
                g.Count(),
                g.GroupBy(d => NormalizeLabel(d.CampaignName, "Unassigned"))
                    .OrderByDescending(x => x.Sum(GetDonationValue))
                    .Select(x => x.Key)
                    .FirstOrDefault()))
            .OrderByDescending(r => r.TotalAmount)
            .ThenByDescending(r => r.DonationCount)
            .Take(Math.Clamp(limit, 1, 20))
            .ToList();

        return Ok(rows);
    }

    [HttpGet("filters")]
    public async Task<ActionResult<DonationFilterOptionsDto>> GetFilterOptions()
    {
        var donations = await _context.Donations.AsNoTracking().ToListAsync();
        var campaigns = donations
            .Select(d => NormalizeLabel(d.CampaignName, "Unassigned"))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();

        var values = donations.Select(GetDonationValue).Where(v => v > 0).OrderBy(v => v).ToList();

        return Ok(new DonationFilterOptionsDto(
            campaigns,
            values.FirstOrDefault(),
            values.LastOrDefault()));
    }

    private async Task<(IQueryable<Donation> Query, DonationReportFiltersDto Filters, DateOnly StartDate, DateOnly EndDate)> BuildFilteredDonationQuery(
        string? startDate,
        string? endDate,
        decimal? minAmount,
        decimal? maxAmount,
        string? campaign,
        string? breakdown)
    {
        var latestDonationDate = await _context.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null)
            .MaxAsync(d => (DateOnly?)d.DonationDate) ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var rangeEnd = ParseDate(endDate) ?? latestDonationDate;
        var rangeStart = ParseDate(startDate) ?? rangeEnd.AddMonths(-11);
        if (rangeStart > rangeEnd)
        {
            (rangeStart, rangeEnd) = (rangeEnd, rangeStart);
        }

        var normalizedCampaign = string.IsNullOrWhiteSpace(campaign) ? null : campaign.Trim();
        IQueryable<Donation> query = _context.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= rangeStart && d.DonationDate <= rangeEnd);

        if (minAmount.HasValue)
        {
            query = query.Where(d => (d.Amount ?? d.EstimatedValue ?? 0m) >= minAmount.Value);
        }

        if (maxAmount.HasValue)
        {
            query = query.Where(d => (d.Amount ?? d.EstimatedValue ?? 0m) <= maxAmount.Value);
        }

        if (!string.IsNullOrWhiteSpace(normalizedCampaign))
        {
            if (string.Equals(normalizedCampaign, "Unassigned", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(d => string.IsNullOrWhiteSpace(d.CampaignName));
            }
            else
            {
                query = query.Where(d => d.CampaignName != null && d.CampaignName == normalizedCampaign);
            }
        }

        return (
            query,
            new DonationReportFiltersDto(
                rangeStart.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                rangeEnd.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                minAmount,
                maxAmount,
                normalizedCampaign,
                string.IsNullOrWhiteSpace(breakdown) ? "campaign" : breakdown.Trim().ToLowerInvariant()),
            rangeStart,
            rangeEnd);
    }

    private IQueryable<Donation> BuildPreviousPeriodQuery(
        (IQueryable<Donation> Query, DonationReportFiltersDto Filters, DateOnly StartDate, DateOnly EndDate) query)
    {
        var daySpan = query.EndDate.DayNumber - query.StartDate.DayNumber + 1;
        var previousEnd = query.StartDate.AddDays(-1);
        var previousStart = previousEnd.AddDays(-(daySpan - 1));

        IQueryable<Donation> previousQuery = _context.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= previousStart && d.DonationDate <= previousEnd);

        if (query.Filters.MinAmount.HasValue)
        {
            previousQuery = previousQuery.Where(d => (d.Amount ?? d.EstimatedValue ?? 0m) >= query.Filters.MinAmount.Value);
        }

        if (query.Filters.MaxAmount.HasValue)
        {
            previousQuery = previousQuery.Where(d => (d.Amount ?? d.EstimatedValue ?? 0m) <= query.Filters.MaxAmount.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Filters.Campaign))
        {
            if (string.Equals(query.Filters.Campaign, "Unassigned", StringComparison.OrdinalIgnoreCase))
            {
                previousQuery = previousQuery.Where(d => string.IsNullOrWhiteSpace(d.CampaignName));
            }
            else
            {
                previousQuery = previousQuery.Where(d => d.CampaignName != null && d.CampaignName == query.Filters.Campaign);
            }
        }

        return previousQuery;
    }

    private static decimal GetDonationValue(Donation donation) => donation.Amount ?? donation.EstimatedValue ?? 0m;

    private static decimal ComputeMedian(List<decimal> values)
    {
        if (values.Count == 0)
        {
            return 0m;
        }

        var middle = values.Count / 2;
        if (values.Count % 2 == 0)
        {
            return (values[middle - 1] + values[middle]) / 2m;
        }

        return values[middle];
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

    private static string GetSupporterName(Supporter supporter)
    {
        if (!string.IsNullOrWhiteSpace(supporter.DisplayName))
        {
            return supporter.DisplayName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(supporter.OrganizationName))
        {
            return supporter.OrganizationName.Trim();
        }

        var composed = $"{supporter.FirstName} {supporter.LastName}".Trim();
        if (!string.IsNullOrWhiteSpace(composed))
        {
            return composed;
        }

        return supporter.Email?.Trim() ?? $"Supporter {supporter.SupporterId}";
    }

    private static string GetBreakdownLabel(Donation donation, string breakdown) => breakdown switch
    {
        "channel" => NormalizeLabel(donation.ChannelSource, "Direct / Unknown"),
        "type" => NormalizeLabel(donation.DonationType, "Unspecified"),
        "recurring" => string.Equals(donation.IsRecurring, "True", StringComparison.OrdinalIgnoreCase) ? "Recurring" : "One-time",
        _ => NormalizeLabel(donation.CampaignName, "Unassigned"),
    };

    private static (string Bucket, string Label) GetTimeBucket(DateOnly date, string granularity)
    {
        if (string.Equals(granularity, "day", StringComparison.OrdinalIgnoreCase))
        {
            return (date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), date.ToString("MMM d", CultureInfo.InvariantCulture));
        }

        if (string.Equals(granularity, "week", StringComparison.OrdinalIgnoreCase))
        {
            var startOfWeek = date.AddDays(-(int)date.DayOfWeek + (date.DayOfWeek == DayOfWeek.Sunday ? -6 : 1));
            return (startOfWeek.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), $"Week of {startOfWeek:MMM d}");
        }

        return ($"{date.Year:D4}-{date.Month:D2}", date.ToString("MMM yyyy", CultureInfo.InvariantCulture));
    }

    private static string FormatCurrency(decimal value) =>
        value.ToString("N0", CultureInfo.InvariantCulture);
}
