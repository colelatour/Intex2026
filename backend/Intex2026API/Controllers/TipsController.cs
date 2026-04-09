using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TipsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public TipsController(LighthouseContext context)
    {
        _context = context;
    }

    public record SubmitTipRequest(string Name, string Email, string Region);

    public record SubmitTipResponse(int TipId, DateTime SubmittedAt);

    [HttpPost]
    public async Task<ActionResult<SubmitTipResponse>> SubmitTip([FromBody] SubmitTipRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required.");

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email is required.");

        if (string.IsNullOrWhiteSpace(request.Region))
            return BadRequest("Region is required.");

        var validRegions = new[] { "Luzon", "Visayas", "Mindanao" };
        var region = validRegions.FirstOrDefault(r =>
            string.Equals(r, request.Region.Trim(), StringComparison.OrdinalIgnoreCase));

        if (region == null)
            return BadRequest($"Invalid region '{request.Region}'. Must be one of: {string.Join(", ", validRegions)}.");

        var now = DateTime.UtcNow.AddTicks(-(DateTime.UtcNow.Ticks % TimeSpan.TicksPerSecond));

        var tip = new Tip
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Region = region,
            SubmittedAt = now
        };

        _context.Tips.Add(tip);
        await _context.SaveChangesAsync();

        return Ok(new SubmitTipResponse(tip.TipId, now));
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<ActionResult<IEnumerable<Tip>>> GetTips()
    {
        try
        {
            return await _context.Tips
                .OrderByDescending(t => t.SubmittedAt)
                .ToListAsync();
        }
        catch
        {
            return new List<Tip>();
        }
    }

    [HttpPatch("{id}/contacted")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> MarkContacted(int id)
    {
        var tip = await _context.Tips.FindAsync(id);
        if (tip == null) return NotFound();

        tip.Contacted = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
