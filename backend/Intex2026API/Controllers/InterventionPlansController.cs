using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class InterventionPlansController : ControllerBase
{
    private readonly LighthouseContext _context;

    public InterventionPlansController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InterventionPlan>>> GetInterventionPlans()
    {
        return await _context.InterventionPlans.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InterventionPlan>> GetInterventionPlan(string id)
    {
        var interventionPlan = await _context.InterventionPlans.FindAsync(id);
        if (interventionPlan == null) return NotFound();
        return interventionPlan;
    }

    [HttpPost]
    public async Task<ActionResult<InterventionPlan>> PostInterventionPlan(InterventionPlan interventionPlan)
    {
        _context.InterventionPlans.Add(interventionPlan);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetInterventionPlan), new { id = interventionPlan.PlanId }, interventionPlan);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutInterventionPlan(string id, InterventionPlan interventionPlan)
    {
        if (id != interventionPlan.PlanId) return BadRequest();
        _context.Entry(interventionPlan).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteInterventionPlan(string id)
    {
        var interventionPlan = await _context.InterventionPlans.FindAsync(id);
        if (interventionPlan == null) return NotFound();
        _context.InterventionPlans.Remove(interventionPlan);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
