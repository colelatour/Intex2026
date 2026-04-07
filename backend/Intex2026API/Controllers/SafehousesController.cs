using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class SafehousesController : ControllerBase
{
    private readonly LighthouseContext _context;

    public SafehousesController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Safehouse>>> GetSafehouses()
    {
        return await _context.Safehouses.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Safehouse>> GetSafehouse(string id)
    {
        var safehouse = await _context.Safehouses.FindAsync(id);
        if (safehouse == null) return NotFound();
        return safehouse;
    }

    [HttpPost]
    public async Task<ActionResult<Safehouse>> PostSafehouse(Safehouse safehouse)
    {
        _context.Safehouses.Add(safehouse);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSafehouse), new { id = safehouse.SafehouseId }, safehouse);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutSafehouse(string id, Safehouse safehouse)
    {
        if (id != safehouse.SafehouseId) return BadRequest();
        _context.Entry(safehouse).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSafehouse(string id)
    {
        var safehouse = await _context.Safehouses.FindAsync(id);
        if (safehouse == null) return NotFound();
        _context.Safehouses.Remove(safehouse);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
