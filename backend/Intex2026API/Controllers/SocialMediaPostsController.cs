using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class SocialMediaPostsController : ControllerBase
{
    private readonly LighthouseContext _context;

    public SocialMediaPostsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SocialMediaPost>>> GetSocialMediaPosts()
    {
        return await _context.SocialMediaPosts.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SocialMediaPost>> GetSocialMediaPost(string id)
    {
        var post = await _context.SocialMediaPosts.FindAsync(id);
        if (post == null) return NotFound();
        return post;
    }

    [HttpPost]
    public async Task<ActionResult<SocialMediaPost>> PostSocialMediaPost(SocialMediaPost post)
    {
        _context.SocialMediaPosts.Add(post);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSocialMediaPost), new { id = post.PostId }, post);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutSocialMediaPost(string id, SocialMediaPost post)
    {
        if (id != post.PostId) return BadRequest();
        _context.Entry(post).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Worker")]
    public async Task<IActionResult> DeleteSocialMediaPost(string id)
    {
        var post = await _context.SocialMediaPosts.FindAsync(id);
        if (post == null) return NotFound();
        _context.SocialMediaPosts.Remove(post);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
