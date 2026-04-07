using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class IncidentReportsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public IncidentReportsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IncidentReport>>> GetIncidentReports()
    {
        return await _context.IncidentReports.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IncidentReport>> GetIncidentReport(string id)
    {
        var incidentReport = await _context.IncidentReports.FindAsync(id);
        if (incidentReport == null) return NotFound();
        return incidentReport;
    }

    [HttpPost]
    public async Task<ActionResult<IncidentReport>> PostIncidentReport(IncidentReport incidentReport)
    {
        _context.IncidentReports.Add(incidentReport);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetIncidentReport), new { id = incidentReport.IncidentId }, incidentReport);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutIncidentReport(string id, IncidentReport incidentReport)
    {
        if (id != incidentReport.IncidentId) return BadRequest();
        _context.Entry(incidentReport).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteIncidentReport(string id)
    {
        var incidentReport = await _context.IncidentReports.FindAsync(id);
        if (incidentReport == null) return NotFound();
        _context.IncidentReports.Remove(incidentReport);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
