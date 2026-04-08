using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record SupporterListItemDto(
    string SupporterId,
    string? DisplayName,
    string? Email,
    string? SupporterType,
    string? Status,
    string? Region,
    int TotalDonations,
    decimal TotalValue,
    string? LatestDonationDate,
    decimal? ChurnProbability,
    string? ChurnRiskLabel
);

public record SupporterListResponseDto(
    List<SupporterListItemDto> Items,
    int Total,
    int Page,
    int PageSize
);

public record DonationSummaryDto(
    string? DonationId,
    string? DonationType,
    string? DonationDate,
    decimal? Amount,
    string? CurrencyCode,
    bool IsRecurring,
    string? Notes
);

public record SupporterDetailDto(
    string? SupporterId,
    string? DisplayName,
    string? FirstName,
    string? LastName,
    string? Email,
    string? Phone,
    string? SupporterType,
    string? RelationshipType,
    string? Status,
    string? Region,
    string? Country,
    string? AcquisitionChannel,
    string? OrganizationName,
    string? CreatedAt,
    string? FirstDonationDate,
    List<DonationSummaryDto> Donations,
    decimal? ChurnProbability,
    string? ChurnRiskLabel
);

public record UpsertSupporterRequest(
    string? DisplayName,
    string? FirstName,
    string? LastName,
    string? Email,
    string? Phone,
    string? SupporterType,
    string? RelationshipType,
    string? Status,
    string? Region,
    string? Country,
    string? AcquisitionChannel,
    string? OrganizationName
);

public record PatchStatusRequest(string Status);

// ── Controller ────────────────────────────────────────────────────────────────

[ApiController]
[Route("api/supporters")]
[Authorize(Roles = "Admin,Worker")]
public class SupportersController : ControllerBase
{
    private readonly LighthouseContext _context;

    public SupportersController(LighthouseContext context)
    {
        _context = context;
    }

    // GET /api/supporters?page=1&search=&supporterType=&status=&region=
    [HttpGet]
    public async Task<ActionResult<SupporterListResponseDto>> GetSupporters(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? supporterType = null,
        [FromQuery] string? status = null,
        [FromQuery] string? region = null)
    {
        var query = _context.Supporters.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x =>
                (x.DisplayName != null && x.DisplayName.ToLower().Contains(s)) ||
                (x.Email       != null && x.Email.ToLower().Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(supporterType))
            query = query.Where(x => x.SupporterType == supporterType);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(region))
            query = query.Where(x => x.Region == region);

        var total = await query.CountAsync();

        var supporters = await query
            .OrderBy(x => x.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var ids = supporters.Select(s => s.SupporterId!).ToList();

        // Donation aggregates for this page only
        var donations = await _context.Donations
            .Where(d => d.SupporterId != null && ids.Contains(d.SupporterId))
            .Select(d => new { d.SupporterId, d.Amount, d.EstimatedValue, d.DonationDate })
            .ToListAsync();

        var donationAgg = donations
            .GroupBy(d => d.SupporterId!)
            .ToDictionary(g => g.Key, g => new
            {
                Count  = g.Count(),
                Total  = g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0),
                Latest = g.Max(d => d.DonationDate?.ToString("yyyy-MM-dd")),
            });

        // Latest churn score for this page
        var churnScores = await _context.DonorChurnScores
            .Where(c => ids.Contains(c.SupporterId))
            .ToListAsync();

        var latestChurn = churnScores
            .GroupBy(c => c.SupporterId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(c => c.ScoredAt).First());

        var items = supporters.Select(s =>
        {
            donationAgg.TryGetValue(s.SupporterId!, out var agg);
            latestChurn.TryGetValue(s.SupporterId!, out var churn);
            return new SupporterListItemDto(
                s.SupporterId!,
                s.DisplayName,
                s.Email,
                s.SupporterType,
                s.Status,
                s.Region,
                agg?.Count  ?? 0,
                agg?.Total  ?? 0,
                agg?.Latest,
                churn?.ChurnProbability,
                churn?.ChurnRiskLabel
            );
        }).ToList();

        return Ok(new SupporterListResponseDto(items, total, page, pageSize));
    }

    // GET /api/supporters/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<SupporterDetailDto>> GetSupporter(string id)
    {
        var s = await _context.Supporters.FindAsync(id);
        if (s == null) return NotFound();

        var rawDonations = await _context.Donations
            .Where(d => d.SupporterId == id)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new { d.DonationId, d.DonationType, d.DonationDate, d.Amount, d.CurrencyCode, d.IsRecurring, d.Notes })
            .ToListAsync();

        var donations = rawDonations.Select(d => new DonationSummaryDto(
            d.DonationId,
            d.DonationType,
            d.DonationDate.HasValue ? d.DonationDate.Value.ToString("yyyy-MM-dd") : null,
            d.Amount,
            d.CurrencyCode,
            d.IsRecurring?.ToLower() is "true" or "1" or "yes",
            d.Notes
        )).ToList();

        var churn = await _context.DonorChurnScores
            .Where(c => c.SupporterId == id)
            .OrderByDescending(c => c.ScoredAt)
            .FirstOrDefaultAsync();

        return Ok(new SupporterDetailDto(
            s.SupporterId,
            s.DisplayName,
            s.FirstName,
            s.LastName,
            s.Email,
            s.Phone,
            s.SupporterType,
            s.RelationshipType,
            s.Status,
            s.Region,
            s.Country,
            s.AcquisitionChannel,
            s.OrganizationName,
            s.CreatedAt?.ToString("yyyy-MM-dd"),
            s.FirstDonationDate?.ToString("yyyy-MM-dd"),
            donations,
            churn?.ChurnProbability,
            churn?.ChurnRiskLabel
        ));
    }

    // POST /api/supporters
    [HttpPost]
    public async Task<ActionResult<SupporterDetailDto>> CreateSupporter([FromBody] UpsertSupporterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.DisplayName))
            return BadRequest("DisplayName is required.");
        if (string.IsNullOrWhiteSpace(req.SupporterType))
            return BadRequest("SupporterType is required.");
        if (string.IsNullOrWhiteSpace(req.Status))
            return BadRequest("Status is required.");

        var supporter = new Supporter
        {
            SupporterId      = await GetNextIdAsync(),
            DisplayName      = req.DisplayName.Trim(),
            FirstName        = req.FirstName?.Trim(),
            LastName         = req.LastName?.Trim(),
            Email            = req.Email?.Trim().ToLowerInvariant(),
            Phone            = req.Phone?.Trim(),
            SupporterType    = req.SupporterType,
            RelationshipType = req.RelationshipType,
            Status           = req.Status,
            Region           = req.Region,
            Country          = req.Country,
            AcquisitionChannel = req.AcquisitionChannel,
            OrganizationName = req.OrganizationName?.Trim(),
            CreatedAt        = DateTime.UtcNow,
        };

        _context.Supporters.Add(supporter);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSupporter), new { id = supporter.SupporterId },
            new SupporterDetailDto(
                supporter.SupporterId, supporter.DisplayName, supporter.FirstName,
                supporter.LastName, supporter.Email, supporter.Phone, supporter.SupporterType,
                supporter.RelationshipType, supporter.Status, supporter.Region, supporter.Country,
                supporter.AcquisitionChannel, supporter.OrganizationName,
                supporter.CreatedAt?.ToString("yyyy-MM-dd"), null, [], null, null));
    }

    // PUT /api/supporters/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSupporter(string id, [FromBody] UpsertSupporterRequest req)
    {
        var supporter = await _context.Supporters.FindAsync(id);
        if (supporter == null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.DisplayName))
            return BadRequest("DisplayName is required.");
        if (string.IsNullOrWhiteSpace(req.SupporterType))
            return BadRequest("SupporterType is required.");
        if (string.IsNullOrWhiteSpace(req.Status))
            return BadRequest("Status is required.");

        supporter.DisplayName      = req.DisplayName.Trim();
        supporter.FirstName        = req.FirstName?.Trim();
        supporter.LastName         = req.LastName?.Trim();
        supporter.Email            = req.Email?.Trim().ToLowerInvariant();
        supporter.Phone            = req.Phone?.Trim();
        supporter.SupporterType    = req.SupporterType;
        supporter.RelationshipType = req.RelationshipType;
        supporter.Status           = req.Status;
        supporter.Region           = req.Region;
        supporter.Country          = req.Country;
        supporter.AcquisitionChannel = req.AcquisitionChannel;
        supporter.OrganizationName = req.OrganizationName?.Trim();

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PATCH /api/supporters/{id}/status
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> PatchStatus(string id, [FromBody] PatchStatusRequest req)
    {
        var supporter = await _context.Supporters.FindAsync(id);
        if (supporter == null) return NotFound();
        supporter.Status = req.Status;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/supporters/{id}/donations
    [HttpGet("{id}/donations")]
    public async Task<ActionResult<IEnumerable<DonationSummaryDto>>> GetDonations(string id)
    {
        var exists = await _context.Supporters.AnyAsync(s => s.SupporterId == id);
        if (!exists) return NotFound();

        var rawDonations = await _context.Donations
            .Where(d => d.SupporterId == id)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new { d.DonationId, d.DonationType, d.DonationDate, d.Amount, d.CurrencyCode, d.IsRecurring, d.Notes })
            .ToListAsync();

        var donations = rawDonations.Select(d => new DonationSummaryDto(
            d.DonationId,
            d.DonationType,
            d.DonationDate.HasValue ? d.DonationDate.Value.ToString("yyyy-MM-dd") : null,
            d.Amount,
            d.CurrencyCode,
            d.IsRecurring?.ToLower() is "true" or "1" or "yes",
            d.Notes
        )).ToList();

        return Ok(donations);
    }

    // DELETE /api/supporters/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteSupporter(string id)
    {
        var supporter = await _context.Supporters.FindAsync(id);
        if (supporter == null) return NotFound();
        _context.Supporters.Remove(supporter);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> GetNextIdAsync()
    {
        var ids = await _context.Supporters
            .Where(s => s.SupporterId != null)
            .Select(s => s.SupporterId!)
            .ToListAsync();

        var max = ids
            .Select(id => int.TryParse(id, out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max();

        return (max + 1).ToString();
    }
}
