using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
public class DonationAllocationsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public DonationAllocationsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DonationAllocation>>> GetDonationAllocations()
    {
        return await _context.DonationAllocations.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DonationAllocation>> GetDonationAllocation(string id)
    {
        var allocation = await _context.DonationAllocations.FindAsync(id);
        if (allocation == null) return NotFound();
        return allocation;
    }

    [HttpPost]
    public async Task<ActionResult<DonationAllocation>> PostDonationAllocation(DonationAllocation allocation)
    {
        _context.DonationAllocations.Add(allocation);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDonationAllocation), new { id = allocation.AllocationId }, allocation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutDonationAllocation(string id, DonationAllocation allocation)
    {
        if (id != allocation.AllocationId) return BadRequest();
        _context.Entry(allocation).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDonationAllocation(string id)
    {
        var allocation = await _context.DonationAllocations.FindAsync(id);
        if (allocation == null) return NotFound();
        _context.DonationAllocations.Remove(allocation);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
