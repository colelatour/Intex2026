using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
public class EducationRecordsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public EducationRecordsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EducationRecord>>> GetEducationRecords()
    {
        return await _context.EducationRecords.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EducationRecord>> GetEducationRecord(string id)
    {
        var educationRecord = await _context.EducationRecords.FindAsync(id);
        if (educationRecord == null) return NotFound();
        return educationRecord;
    }

    [HttpPost]
    public async Task<ActionResult<EducationRecord>> PostEducationRecord(EducationRecord educationRecord)
    {
        _context.EducationRecords.Add(educationRecord);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetEducationRecord), new { id = educationRecord.EducationRecordId }, educationRecord);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutEducationRecord(string id, EducationRecord educationRecord)
    {
        if (id != educationRecord.EducationRecordId) return BadRequest();
        _context.Entry(educationRecord).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEducationRecord(string id)
    {
        var educationRecord = await _context.EducationRecords.FindAsync(id);
        if (educationRecord == null) return NotFound();
        _context.EducationRecords.Remove(educationRecord);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
