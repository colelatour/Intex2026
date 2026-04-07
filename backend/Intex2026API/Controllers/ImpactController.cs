using Intex2026API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

// ── DTOs ────────────────────────────────────────────────────────────────────

public record HeroMetricsDto(int TotalGirlsServed, int ActiveResidents, int GirlsReintegrated, int ActiveSafehouses);
public record RiskImprovementDto(int Count, int Percent);
public record CareIntensityDto(int TotalProcessRecordingSessions, double AvgSessionsPerResident, int TotalHomeVisitations);
public record IncidentResolutionDto(int TotalIncidents, int ResolvedIncidents, int ResolutionRatePercent);
public record DonationAreaDto(string Area, decimal AmountPhp);
public record DonationsDto(decimal TotalPhp, int UniqueSupporters, int RecurringDonationCount, List<DonationAreaDto> ByProgramArea);

public record ImpactSummaryDto(
    HeroMetricsDto HeroMetrics,
    RiskImprovementDto RiskImprovement,
    CareIntensityDto CareIntensity,
    IncidentResolutionDto IncidentResolution,
    DonationsDto Donations
);

public record HealthTrendPointDto(string Month, double AvgHealthScore);
public record EducationTrendPointDto(string Month, double AvgEducationProgress);
public record ImpactTrendsDto(List<HealthTrendPointDto> HealthTrend, List<EducationTrendPointDto> EducationTrend);

public record EducationJourneyPointDto(int MonthOffset, double AvgProgress, int GirlsIncluded);

public record EmotionalTransformationDto(
    int TotalSessions,
    int ImprovedSessions,
    int ImprovedPercent,
    Dictionary<string, int> StartStateBreakdown,
    Dictionary<string, int> EndStateBreakdown
);

// ── Controller ──────────────────────────────────────────────────────────────

[ApiController]
[Route("api/impact")]
[AllowAnonymous]
public class ImpactController : ControllerBase
{
    private readonly LighthouseContext _context;

    public ImpactController(LighthouseContext context)
    {
        _context = context;
    }

    // GET /api/impact/summary
    [HttpGet("summary")]
    public async Task<ActionResult<ImpactSummaryDto>> GetSummary()
    {
        // ── Hero metrics ────────────────────────────────────────────────────
        var allResidents = await _context.Residents.ToListAsync();

        var totalGirlsServed = allResidents.Count;
        var activeResidents  = allResidents.Count(r => string.Equals(r.CaseStatus, "Active", StringComparison.OrdinalIgnoreCase));
        var girlsReintegrated = allResidents.Count(r => string.Equals(r.ReintegrationStatus, "Completed", StringComparison.OrdinalIgnoreCase));
        var activeSafehouses = await _context.Safehouses
            .CountAsync(s => s.Status != null && s.Status.ToLower() == "active");

        // ── Risk improvement ────────────────────────────────────────────────
        static int RiskRank(string? level) => level?.Trim().ToLower() switch
        {
            "critical" => 4,
            "high"     => 3,
            "medium"   => 2,
            "low"      => 1,
            _          => 0
        };

        var riskImprovedCount = allResidents.Count(r =>
            RiskRank(r.CurrentRiskLevel) > 0 &&
            RiskRank(r.InitialRiskLevel) > 0 &&
            RiskRank(r.CurrentRiskLevel) < RiskRank(r.InitialRiskLevel));

        var riskEligibleCount = allResidents.Count(r =>
            RiskRank(r.CurrentRiskLevel) > 0 && RiskRank(r.InitialRiskLevel) > 0);

        var riskPercent = riskEligibleCount > 0
            ? (int)Math.Round(riskImprovedCount * 100.0 / riskEligibleCount)
            : 0;

        // ── Care intensity ───────────────────────────────────────────────────
        var totalSessions    = await _context.ProcessRecordings.CountAsync();
        var totalVisitations = await _context.HomeVisitations.CountAsync();
        var avgSessions      = totalGirlsServed > 0
            ? Math.Round(totalSessions / (double)totalGirlsServed, 1)
            : 0.0;

        // ── Incident resolution ──────────────────────────────────────────────
        var allIncidents    = await _context.IncidentReports.ToListAsync();
        var totalIncidents  = allIncidents.Count;
        var resolvedIncidents = allIncidents.Count(i => IsTruthy(i.Resolved));
        var resolutionRate  = totalIncidents > 0
            ? (int)Math.Round(resolvedIncidents * 100.0 / totalIncidents)
            : 0;

        // ── Donations ────────────────────────────────────────────────────────
        var allDonations = await _context.Donations.ToListAsync();
        var totalPhp     = allDonations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value);
        var uniqueSupporters = allDonations
            .Where(d => d.SupporterId != null)
            .Select(d => d.SupporterId)
            .Distinct()
            .Count();
        var recurringCount = allDonations.Count(d => IsTruthy(d.IsRecurring));

        var allAllocations = await _context.DonationAllocations.ToListAsync();
        var byArea = allAllocations
            .Where(a => a.ProgramArea != null && a.AmountAllocated.HasValue)
            .GroupBy(a => a.ProgramArea!)
            .Select(g => new DonationAreaDto(g.Key, g.Sum(a => a.AmountAllocated!.Value)))
            .OrderByDescending(a => a.AmountPhp)
            .ToList();

        // ── Assemble ─────────────────────────────────────────────────────────
        var summary = new ImpactSummaryDto(
            HeroMetrics:       new HeroMetricsDto(totalGirlsServed, activeResidents, girlsReintegrated, activeSafehouses),
            RiskImprovement:   new RiskImprovementDto(riskImprovedCount, riskPercent),
            CareIntensity:     new CareIntensityDto(totalSessions, avgSessions, totalVisitations),
            IncidentResolution: new IncidentResolutionDto(totalIncidents, resolvedIncidents, resolutionRate),
            Donations:         new DonationsDto(totalPhp, uniqueSupporters, recurringCount, byArea)
        );

        return Ok(summary);
    }

    // GET /api/impact/trends
    [HttpGet("trends")]
    public async Task<ActionResult<ImpactTrendsDto>> GetTrends()
    {
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-24));

        var metrics = await _context.SafehouseMonthlyMetrics
            .Where(m => m.MonthStart != null
                     && m.AvgHealthScore.HasValue
                     && m.AvgEducationProgress.HasValue
                     && m.MonthStart >= cutoff)
            .ToListAsync();

        var grouped = metrics
            .GroupBy(m => m.MonthStart!.Value.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .ToList();

        var healthTrend = grouped.Select(g => new HealthTrendPointDto(
            g.Key,
            Math.Round((double)g.Average(m => m.AvgHealthScore!.Value), 2)
        )).ToList();

        var educationTrend = grouped.Select(g => new EducationTrendPointDto(
            g.Key,
            Math.Round((double)g.Average(m => m.AvgEducationProgress!.Value), 1)
        )).ToList();

        return Ok(new ImpactTrendsDto(healthTrend, educationTrend));
    }

    // GET /api/impact/education-journey
    [HttpGet("education-journey")]
    public async Task<ActionResult<List<EducationJourneyPointDto>>> GetEducationJourney()
    {
        // Load only the columns we need
        var residents = await _context.Residents
            .Where(r => r.ResidentId != null && r.DateOfAdmission != null)
            .Select(r => new { r.ResidentId, r.DateOfAdmission })
            .ToListAsync();

        var educationRecords = await _context.EducationRecords
            .Where(e => e.ResidentId != null && e.RecordDate != null && e.ProgressPercent.HasValue)
            .Select(e => new { e.ResidentId, e.RecordDate, e.ProgressPercent })
            .ToListAsync();

        // Build admission date lookup
        var admissionMap = residents
            .Where(r => r.DateOfAdmission.HasValue)
            .ToDictionary(r => r.ResidentId!, r => r.DateOfAdmission!.Value);

        // Compute month offsets in memory (avoids SQLite date-math limitations)
        var joined = educationRecords
            .Where(e => e.ResidentId != null && admissionMap.ContainsKey(e.ResidentId))
            .Select(e =>
            {
                var admission   = admissionMap[e.ResidentId!];
                var recordDate  = e.RecordDate!.Value;
                var daysDiff    = recordDate.DayNumber - admission.DayNumber;
                var monthOffset = (int)Math.Floor(daysDiff / 30.44);
                return new { e.ResidentId, monthOffset, progress = e.ProgressPercent!.Value };
            })
            .Where(x => x.monthOffset >= 0 && x.monthOffset <= 11)
            .ToList();

        var result = joined
            .GroupBy(x => x.monthOffset)
            .OrderBy(g => g.Key)
            .Select(g => new EducationJourneyPointDto(
                g.Key,
                Math.Round((double)g.Average(x => x.progress), 1),
                g.Select(x => x.ResidentId).Distinct().Count()
            ))
            .ToList();

        return Ok(result);
    }

    // GET /api/impact/emotional-transformation
    [HttpGet("emotional-transformation")]
    public async Task<ActionResult<EmotionalTransformationDto>> GetEmotionalTransformation()
    {
        var sessions = await _context.ProcessRecordings
            .Where(p => p.EmotionalStateObserved != null && p.EmotionalStateEnd != null)
            .Select(p => new { p.EmotionalStateObserved, p.EmotionalStateEnd })
            .ToListAsync();

        var totalSessions = sessions.Count;

        var improvedSessions = sessions.Count(s =>
            EmotionalScore(s.EmotionalStateEnd) > EmotionalScore(s.EmotionalStateObserved));

        var improvedPercent = totalSessions > 0
            ? (int)Math.Round(improvedSessions * 100.0 / totalSessions)
            : 0;

        var startBreakdown = sessions
            .GroupBy(s => Normalize(s.EmotionalStateObserved!))
            .Where(g => g.Key != "Unknown")
            .OrderByDescending(g => g.Count())
            .ToDictionary(g => g.Key, g => g.Count());

        var endBreakdown = sessions
            .GroupBy(s => Normalize(s.EmotionalStateEnd!))
            .Where(g => g.Key != "Unknown")
            .OrderByDescending(g => g.Count())
            .ToDictionary(g => g.Key, g => g.Count());

        return Ok(new EmotionalTransformationDto(
            totalSessions,
            improvedSessions,
            improvedPercent,
            startBreakdown,
            endBreakdown
        ));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static bool IsTruthy(string? value) =>
        value?.Trim().ToLower() is "1" or "true" or "yes";

    private static string Normalize(string state) =>
        state.Trim() switch
        {
            var s when string.Equals(s, "distressed", StringComparison.OrdinalIgnoreCase) => "Distressed",
            var s when string.Equals(s, "withdrawn",  StringComparison.OrdinalIgnoreCase) => "Withdrawn",
            var s when string.Equals(s, "anxious",    StringComparison.OrdinalIgnoreCase) => "Anxious",
            var s when string.Equals(s, "sad",        StringComparison.OrdinalIgnoreCase) => "Sad",
            var s when string.Equals(s, "angry",      StringComparison.OrdinalIgnoreCase) => "Angry",
            var s when string.Equals(s, "neutral",    StringComparison.OrdinalIgnoreCase) => "Neutral",
            var s when string.Equals(s, "calm",       StringComparison.OrdinalIgnoreCase) => "Calm",
            var s when string.Equals(s, "engaged",    StringComparison.OrdinalIgnoreCase) => "Engaged",
            var s when string.Equals(s, "hopeful",    StringComparison.OrdinalIgnoreCase) => "Hopeful",
            var s when string.Equals(s, "happy",      StringComparison.OrdinalIgnoreCase) => "Happy",
            var s when string.Equals(s, "positive",   StringComparison.OrdinalIgnoreCase) => "Positive",
            _ => "Unknown"
        };

    private static int EmotionalScore(string? state) =>
        Normalize(state ?? "").ToLower() switch
        {
            "distressed"            => 1,
            "withdrawn" or "anxious" or "sad" or "angry" => 2,
            "neutral"               => 3,
            "calm"    or "engaged"  => 4,
            "hopeful" or "happy" or "positive" => 5,
            _                       => 0
        };
}
