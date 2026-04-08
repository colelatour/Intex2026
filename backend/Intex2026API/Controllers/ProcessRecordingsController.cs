using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class ProcessRecordingsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public ProcessRecordingsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProcessRecording>>> GetProcessRecordings()
    {
        return await _context.ProcessRecordings.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProcessRecording>> GetProcessRecording(string id)
    {
        var recording = await _context.ProcessRecordings.FindAsync(id);
        if (recording == null) return NotFound();
        return recording;
    }

    [HttpPost]
    public async Task<ActionResult<ProcessRecording>> PostProcessRecording(ProcessRecording recording)
    {
        _context.ProcessRecordings.Add(recording);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProcessRecording), new { id = recording.RecordingId }, recording);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutProcessRecording(string id, ProcessRecording recording)
    {
        if (id != recording.RecordingId) return BadRequest();
        _context.Entry(recording).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteProcessRecording(string id)
    {
        var recording = await _context.ProcessRecordings.FindAsync(id);
        if (recording == null) return NotFound();
        _context.ProcessRecordings.Remove(recording);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
