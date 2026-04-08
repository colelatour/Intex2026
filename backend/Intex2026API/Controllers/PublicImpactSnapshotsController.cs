using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class PublicImpactSnapshotsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public PublicImpactSnapshotsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PublicImpactSnapshot>>> GetPublicImpactSnapshots()
    {
        return await _context.PublicImpactSnapshots.ToListAsync();
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<PublicImpactSnapshot>> GetPublicImpactSnapshot(string id)
    {
        var snapshot = await _context.PublicImpactSnapshots.FindAsync(id);
        if (snapshot == null) return NotFound();
        return snapshot;
    }

    [HttpPost]
    public async Task<ActionResult<PublicImpactSnapshot>> PostPublicImpactSnapshot(PublicImpactSnapshot snapshot)
    {
        _context.PublicImpactSnapshots.Add(snapshot);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPublicImpactSnapshot), new { id = snapshot.SnapshotId }, snapshot);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutPublicImpactSnapshot(string id, PublicImpactSnapshot snapshot)
    {
        if (id != snapshot.SnapshotId) return BadRequest();
        _context.Entry(snapshot).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeletePublicImpactSnapshot(string id)
    {
        var snapshot = await _context.PublicImpactSnapshots.FindAsync(id);
        if (snapshot == null) return NotFound();
        _context.PublicImpactSnapshots.Remove(snapshot);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
