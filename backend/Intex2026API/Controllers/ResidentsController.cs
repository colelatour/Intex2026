using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
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
        // Auto-generate resident_id: max integer + 1
        var allIds = await _context.Residents
            .Where(r => r.ResidentId != null)
            .Select(r => r.ResidentId)
            .ToListAsync();
        int nextId = allIds
            .Select(id => int.TryParse(id, out var n) ? n : 0)
            .DefaultIfEmpty(0).Max() + 1;
        resident.ResidentId = nextId.ToString();

        // Auto-generate internal_code: LS-NNNN max + 1
        var allCodes = await _context.Residents
            .Where(r => r.InternalCode != null && r.InternalCode.StartsWith("LS-"))
            .Select(r => r.InternalCode)
            .ToListAsync();
        int nextCode = allCodes
            .Select(c => int.TryParse(c!.Substring(3), out var n) ? n : 0)
            .DefaultIfEmpty(0).Max() + 1;
        resident.InternalCode = $"LS-{nextCode:D4}";

        // Auto-generate case_control_no: CNNNN max + 1
        var allCcns = await _context.Residents
            .Where(r => r.CaseControlNo != null && r.CaseControlNo.StartsWith("C"))
            .Select(r => r.CaseControlNo)
            .ToListAsync();
        int nextCcn = allCcns
            .Select(c => int.TryParse(c!.Substring(1), out var n) ? n : 0)
            .DefaultIfEmpty(0).Max() + 1;
        resident.CaseControlNo = $"C{nextCcn:D4}";

        resident.CreatedAt = DateTime.UtcNow;

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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteResident(string id)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        _context.Residents.Remove(resident);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
