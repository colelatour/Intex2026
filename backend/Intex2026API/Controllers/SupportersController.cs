using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
public class SupportersController : ControllerBase
{
    private readonly LighthouseContext _context;

    public SupportersController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Supporter>>> GetSupporters()
    {
        return await _context.Supporters.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Supporter>> GetSupporter(string id)
    {
        var supporter = await _context.Supporters.FindAsync(id);
        if (supporter == null) return NotFound();
        return supporter;
    }

    [HttpPost]
    public async Task<ActionResult<Supporter>> PostSupporter(Supporter supporter)
    {
        _context.Supporters.Add(supporter);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSupporter), new { id = supporter.SupporterId }, supporter);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutSupporter(string id, Supporter supporter)
    {
        if (id != supporter.SupporterId) return BadRequest();
        _context.Entry(supporter).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSupporter(string id)
    {
        var supporter = await _context.Supporters.FindAsync(id);
        if (supporter == null) return NotFound();
        _context.Supporters.Remove(supporter);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
