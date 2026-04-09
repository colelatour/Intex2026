using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DonationsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public DonationsController(LighthouseContext context)
    {
        _context = context;
    }

    public record RecordDonationRequest(
        decimal Amount,
        string CurrencyCode,
        bool IsRecurring,
        string FirstName,
        string LastName,
        string Email,
        string? Region,
        bool IsHonorGift,
        string? HonoreeName,
        string? HonoreeEmail,
        string? HonorMessage
    );

    public record RecordDonationResponse(
        string DonationId,
        string SupporterId,
        decimal Amount,
        string CurrencyCode,
        DateOnly DonationDate
    );

    public record MyDonationItem(string DonationId, decimal Amount, string CurrencyCode, DateOnly DonationDate);
    public record MyDonationsResponse(string FirstName, string LastName, IEnumerable<MyDonationItem> Donations);

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<MyDonationsResponse>> GetMyDonations()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var supporter = await _context.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        if (supporter == null)
            return Ok(new MyDonationsResponse("", "", Enumerable.Empty<MyDonationItem>()));

        var donations = await _context.Donations
            .Where(d => d.SupporterId == supporter.SupporterId && d.Amount != null && d.DonationDate != null)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new MyDonationItem(d.DonationId!, d.Amount!.Value, d.CurrencyCode ?? "USD", d.DonationDate!.Value))
            .ToListAsync();

        return Ok(new MyDonationsResponse(supporter.FirstName ?? "", supporter.LastName ?? "", donations));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Donation>>> GetDonations()
    {
        return await _context.Donations.ToListAsync();
    }

    [HttpGet("{id:regex(^\\d+$)}")]
    public async Task<ActionResult<Donation>> GetDonation(string id)
    {
        var donation = await _context.Donations.FindAsync(id);
        if (donation == null) return NotFound();
        return donation;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<ActionResult<Donation>> PostDonation(Donation donation)
    {
        _context.Donations.Add(donation);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDonation), new { id = donation.DonationId }, donation);
    }

    [HttpPost("record")]
    public async Task<ActionResult<RecordDonationResponse>> RecordDonation([FromBody] RecordDonationRequest request)
    {
        if (request.Amount <= 0)
        {
            return BadRequest("Donation amount must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Email is required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var supporter = await _context.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        var donationDate = DateOnly.FromDateTime(DateTime.UtcNow);

        if (supporter == null)
        {
            supporter = new Supporter
            {
                SupporterId = await GetNextNumericIdAsync(_context.Supporters.Select(s => s.SupporterId)),
                SupporterType = "MonetaryDonor",
                DisplayName = $"{request.FirstName} {request.LastName}".Trim(),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = normalizedEmail,
                Status = "Active",
                CreatedAt = DateTime.UtcNow.AddTicks(-(DateTime.UtcNow.Ticks % TimeSpan.TicksPerSecond)),
                FirstDonationDate = donationDate,
                AcquisitionChannel = "Website"
            };

            _context.Supporters.Add(supporter);
        }
        else
        {
            supporter.FirstName = request.FirstName.Trim();
            supporter.LastName = request.LastName.Trim();
            supporter.DisplayName = $"{request.FirstName} {request.LastName}".Trim();

            if (supporter.FirstDonationDate == null)
            {
                supporter.FirstDonationDate = donationDate;
            }
        }

        var notes = BuildNotes(request);

        var donation = new Donation
        {
            DonationId = await GetNextNumericIdAsync(_context.Donations.Select(d => d.DonationId)),
            SupporterId = supporter.SupporterId,
            DonationType = "Monetary",
            DonationDate = donationDate,
            IsRecurring = request.IsRecurring ? "True" : "False",
            CampaignName = null,
            ChannelSource = "Direct",
            CurrencyCode = "PHP",
            Amount = request.Amount,
            EstimatedValue = request.Amount,
            ImpactUnit = "pesos",
            Notes = notes
        };

        _context.Donations.Add(donation);

        if (!string.IsNullOrWhiteSpace(request.Region))
        {
            var region = request.Region.Trim();

            var safehousesInRegion = await _context.Safehouses
                .Where(s => s.Region != null && s.Region.ToLower() == region.ToLower())
                .ToListAsync();

            if (safehousesInRegion.Count == 0)
            {
                return BadRequest($"Unknown region '{region}'.");
            }

            var targetSafehouse = safehousesInRegion
                .Where(s => string.Equals(s.Status, "Active", StringComparison.OrdinalIgnoreCase))
                .OrderBy(s => ParseNumericIdOrMax(s.SafehouseId))
                .FirstOrDefault()
                ?? safehousesInRegion
                    .OrderBy(s => ParseNumericIdOrMax(s.SafehouseId))
                    .First();

            var allocation = new DonationAllocation
            {
                AllocationId = await GetNextNumericIdAsync(_context.DonationAllocations.Select(a => a.AllocationId)),
                DonationId = donation.DonationId,
                SafehouseId = targetSafehouse.SafehouseId,
                ProgramArea = "Regional Support",
                AmountAllocated = request.Amount,
                AllocationDate = donationDate,
                AllocationNotes = $"Donor-designated region: {region} (default safehouse: {targetSafehouse.Name})"
            };

            _context.DonationAllocations.Add(allocation);
        }

        await _context.SaveChangesAsync();

        return Ok(new RecordDonationResponse(
            donation.DonationId!,
            supporter.SupporterId!,
            donation.Amount ?? 0,
            donation.CurrencyCode ?? "USD",
            donation.DonationDate ?? donationDate
        ));
    }

    [HttpPut("{id:regex(^\\d+$)}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> PutDonation(string id, Donation donation)
    {
        if (id != donation.DonationId) return BadRequest();
        _context.Entry(donation).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:regex(^\\d+$)}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteDonation(string id)
    {
        var donation = await _context.Donations.FindAsync(id);
        if (donation == null) return NotFound();
        _context.Donations.Remove(donation);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string BuildNotes(RecordDonationRequest request)
    {
        var sb = new StringBuilder(
            request.IsRecurring
                ? "Monthly contribution"
                : "In support of safehouse operations");

        if (!string.IsNullOrWhiteSpace(request.Region))
        {
            sb.Append(" | Region dedication: ").Append(request.Region.Trim());
        }

        if (request.IsHonorGift)
        {
            sb.Append(" | Honor gift");

            if (!string.IsNullOrWhiteSpace(request.HonoreeName))
            {
                sb.Append(" | Honoree: ").Append(request.HonoreeName.Trim());
            }

            if (!string.IsNullOrWhiteSpace(request.HonoreeEmail))
            {
                sb.Append(" | HonoreeEmail: ").Append(request.HonoreeEmail.Trim());
            }

            if (!string.IsNullOrWhiteSpace(request.HonorMessage))
            {
                sb.Append(" | Message: ").Append(request.HonorMessage.Trim());
            }
        }

        return sb.ToString();
    }

    private static async Task<string> GetNextNumericIdAsync(IQueryable<string?> source)
    {
        var ids = await source
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!)
            .ToListAsync();

        var max = ids
            .Select(id => int.TryParse(id, out var parsed) ? parsed : 0)
            .DefaultIfEmpty(0)
            .Max();

        return (max + 1).ToString();
    }

    private static int ParseNumericIdOrMax(string? id) =>
        int.TryParse(id, out var parsed) ? parsed : int.MaxValue;
}
