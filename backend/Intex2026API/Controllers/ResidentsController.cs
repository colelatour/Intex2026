using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
public class ResidentsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public ResidentsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Resident>>> GetResidents()
    {
        return await _context.Residents.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Resident>> GetResident(string id)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        return resident;
    }

    [HttpPost]
    public async Task<ActionResult<Resident>> PostResident(Resident resident)
    {
        _context.Residents.Add(resident);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetResident), new { id = resident.ResidentId }, resident);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutResident(string id, Resident resident)
    {
        if (id != resident.ResidentId) return BadRequest();
        _context.Entry(resident).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteResident(string id)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        _context.Residents.Remove(resident);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
