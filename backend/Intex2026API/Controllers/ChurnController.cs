using Intex2026API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2026API.Controllers;

public record ChurnScoreDto(
    string SupporterId,
    string? DisplayName,
    string? Email,
    DateTime ScoredAt,
    decimal ChurnProbability,
    string? ChurnRiskLabel,
    string? ModelVersion
);

[ApiController]
[Route("api/churn")]
[Authorize(Roles = "Admin")]
public class ChurnController : ControllerBase
{
    private readonly LighthouseContext _context;

    public ChurnController(LighthouseContext context)
    {
        _context = context;
    }

    // GET /api/churn/at-risk
    // Returns the latest score per supporter, sorted by churn probability descending.
    [HttpGet("at-risk")]
    public async Task<ActionResult<IEnumerable<ChurnScoreDto>>> GetAtRisk()
    {
        var scores = await _context.DonorChurnScores.ToListAsync();
        var supporters = await _context.Supporters
            .Select(s => new { s.SupporterId, s.DisplayName, s.Email })
            .ToListAsync();

        var supporterMap = supporters.ToDictionary(s => s.SupporterId!);

        var latest = scores
            .GroupBy(s => s.SupporterId)
            .Select(g => g.OrderByDescending(s => s.ScoredAt).First())
            .OrderByDescending(s => s.ChurnProbability)
            .Select(s =>
            {
                supporterMap.TryGetValue(s.SupporterId, out var sup);
                return new ChurnScoreDto(
                    s.SupporterId,
                    sup?.DisplayName,
                    sup?.Email,
                    s.ScoredAt,
                    s.ChurnProbability,
                    s.ChurnRiskLabel,
                    s.ModelVersion
                );
            })
            .ToList();

        return Ok(latest);
    }

    // GET /api/churn/{supporterId}
    // Returns all historical scores for a specific supporter, newest first.
    [HttpGet("{supporterId}")]
    public async Task<ActionResult<IEnumerable<ChurnScoreDto>>> GetForSupporter(string supporterId)
    {
        var scores = await _context.DonorChurnScores
            .Where(s => s.SupporterId == supporterId)
            .OrderByDescending(s => s.ScoredAt)
            .ToListAsync();

        if (scores.Count == 0) return NotFound();

        var sup = await _context.Supporters
            .Where(s => s.SupporterId == supporterId)
            .Select(s => new { s.DisplayName, s.Email })
            .FirstOrDefaultAsync();

        var result = scores.Select(s => new ChurnScoreDto(
            s.SupporterId,
            sup?.DisplayName,
            sup?.Email,
            s.ScoredAt,
            s.ChurnProbability,
            s.ChurnRiskLabel,
            s.ModelVersion
        ));

        return Ok(result);
    }
}
