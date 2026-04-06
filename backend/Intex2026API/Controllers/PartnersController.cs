using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
public class PartnersController : ControllerBase
{
    private readonly LighthouseContext _context;

    public PartnersController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Partner>>> GetPartners()
    {
        return await _context.Partners.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Partner>> GetPartner(string id)
    {
        var partner = await _context.Partners.FindAsync(id);
        if (partner == null) return NotFound();
        return partner;
    }

    [HttpPost]
    public async Task<ActionResult<Partner>> PostPartner(Partner partner)
    {
        _context.Partners.Add(partner);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPartner), new { id = partner.PartnerId }, partner);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutPartner(string id, Partner partner)
    {
        if (id != partner.PartnerId) return BadRequest();
        _context.Entry(partner).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePartner(string id)
    {
        var partner = await _context.Partners.FindAsync(id);
        if (partner == null) return NotFound();
        _context.Partners.Remove(partner);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
