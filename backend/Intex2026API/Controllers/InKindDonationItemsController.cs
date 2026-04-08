using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class InKindDonationItemsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public InKindDonationItemsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InKindDonationItem>>> GetInKindDonationItems()
    {
        return await _context.InKindDonationItems.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InKindDonationItem>> GetInKindDonationItem(string id)
    {
        var item = await _context.InKindDonationItems.FindAsync(id);
        if (item == null) return NotFound();
        return item;
    }

    [HttpPost]
    public async Task<ActionResult<InKindDonationItem>> PostInKindDonationItem(InKindDonationItem item)
    {
        _context.InKindDonationItems.Add(item);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetInKindDonationItem), new { id = item.ItemId }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutInKindDonationItem(string id, InKindDonationItem item)
    {
        if (id != item.ItemId) return BadRequest();
        _context.Entry(item).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteInKindDonationItem(string id)
    {
        var item = await _context.InKindDonationItems.FindAsync(id);
        if (item == null) return NotFound();
        _context.InKindDonationItems.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
