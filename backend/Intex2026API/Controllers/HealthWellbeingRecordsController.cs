using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class HealthWellbeingRecordsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public HealthWellbeingRecordsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HealthWellbeingRecord>>> GetHealthWellbeingRecords()
    {
        return await _context.HealthWellbeingRecords.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HealthWellbeingRecord>> GetHealthWellbeingRecord(string id)
    {
        var record = await _context.HealthWellbeingRecords.FindAsync(id);
        if (record == null) return NotFound();
        return record;
    }

    [HttpPost]
    public async Task<ActionResult<HealthWellbeingRecord>> PostHealthWellbeingRecord(HealthWellbeingRecord record)
    {
        _context.HealthWellbeingRecords.Add(record);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetHealthWellbeingRecord), new { id = record.HealthRecordId }, record);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutHealthWellbeingRecord(string id, HealthWellbeingRecord record)
    {
        if (id != record.HealthRecordId) return BadRequest();
        _context.Entry(record).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteHealthWellbeingRecord(string id)
    {
        var record = await _context.HealthWellbeingRecords.FindAsync(id);
        if (record == null) return NotFound();
        _context.HealthWellbeingRecords.Remove(record);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
