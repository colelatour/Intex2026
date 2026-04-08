using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class PartnerAssignmentsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public PartnerAssignmentsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PartnerAssignment>>> GetPartnerAssignments()
    {
        return await _context.PartnerAssignments.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PartnerAssignment>> GetPartnerAssignment(string id)
    {
        var assignment = await _context.PartnerAssignments.FindAsync(id);
        if (assignment == null) return NotFound();
        return assignment;
    }

    [HttpPost]
    public async Task<ActionResult<PartnerAssignment>> PostPartnerAssignment(PartnerAssignment assignment)
    {
        _context.PartnerAssignments.Add(assignment);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPartnerAssignment), new { id = assignment.AssignmentId }, assignment);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutPartnerAssignment(string id, PartnerAssignment assignment)
    {
        if (id != assignment.AssignmentId) return BadRequest();
        _context.Entry(assignment).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeletePartnerAssignment(string id)
    {
        var assignment = await _context.PartnerAssignments.FindAsync(id);
        if (assignment == null) return NotFound();
        _context.PartnerAssignments.Remove(assignment);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
