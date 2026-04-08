using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class HomeVisitationsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public HomeVisitationsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HomeVisitation>>> GetHomeVisitations()
    {
        return await _context.HomeVisitations.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HomeVisitation>> GetHomeVisitation(string id)
    {
        var homeVisitation = await _context.HomeVisitations.FindAsync(id);
        if (homeVisitation == null) return NotFound();
        return homeVisitation;
    }

    [HttpPost]
    public async Task<ActionResult<HomeVisitation>> PostHomeVisitation(HomeVisitation homeVisitation)
    {
        _context.HomeVisitations.Add(homeVisitation);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetHomeVisitation), new { id = homeVisitation.VisitationId }, homeVisitation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutHomeVisitation(string id, HomeVisitation homeVisitation)
    {
        if (id != homeVisitation.VisitationId) return BadRequest();
        _context.Entry(homeVisitation).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteHomeVisitation(string id)
    {
        var homeVisitation = await _context.HomeVisitations.FindAsync(id);
        if (homeVisitation == null) return NotFound();
        _context.HomeVisitations.Remove(homeVisitation);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
