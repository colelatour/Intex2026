using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class SafehouseMonthlyMetricsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public SafehouseMonthlyMetricsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SafehouseMonthlyMetric>>> GetSafehouseMonthlyMetrics()
    {
        return await _context.SafehouseMonthlyMetrics.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SafehouseMonthlyMetric>> GetSafehouseMonthlyMetric(string id)
    {
        var metric = await _context.SafehouseMonthlyMetrics.FindAsync(id);
        if (metric == null) return NotFound();
        return metric;
    }

    [HttpPost]
    public async Task<ActionResult<SafehouseMonthlyMetric>> PostSafehouseMonthlyMetric(SafehouseMonthlyMetric metric)
    {
        _context.SafehouseMonthlyMetrics.Add(metric);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSafehouseMonthlyMetric), new { id = metric.MetricId }, metric);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutSafehouseMonthlyMetric(string id, SafehouseMonthlyMetric metric)
    {
        if (id != metric.MetricId) return BadRequest();
        _context.Entry(metric).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteSafehouseMonthlyMetric(string id)
    {
        var metric = await _context.SafehouseMonthlyMetrics.FindAsync(id);
        if (metric == null) return NotFound();
        _context.SafehouseMonthlyMetrics.Remove(metric);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
