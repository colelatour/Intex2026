using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
public class DonationsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public DonationsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Donation>>> GetDonations()
    {
        return await _context.Donations.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Donation>> GetDonation(string id)
    {
        var donation = await _context.Donations.FindAsync(id);
        if (donation == null) return NotFound();
        return donation;
    }

    [HttpPost]
    public async Task<ActionResult<Donation>> PostDonation(Donation donation)
    {
        _context.Donations.Add(donation);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDonation), new { id = donation.DonationId }, donation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutDonation(string id, Donation donation)
    {
        if (id != donation.DonationId) return BadRequest();
        _context.Entry(donation).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDonation(string id)
    {
        var donation = await _context.Donations.FindAsync(id);
        if (donation == null) return NotFound();
        _context.Donations.Remove(donation);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
