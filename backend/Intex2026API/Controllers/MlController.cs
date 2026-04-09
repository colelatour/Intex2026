using Intex2026API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace Intex2026API.Controllers;

public record GeneratePostRequest(
    string Platform,
    string PostGoal,
    string? StoryArc,
    AchievementDto Achievement
);

public record AchievementDto(string Type, string Summary);

public record GeneratePostResponse(
    string PostCopy,
    string? DataInsight,
    string Platform
);

[ApiController]
[Route("api/ml")]
[Authorize(Roles = "Admin,Worker")]
public class MlController : ControllerBase
{
    private readonly LighthouseContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public MlController(LighthouseContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("achievements")]
    public async Task<ActionResult<AchievementsResponse>> GetAchievements()
    {
        var now = DateTime.UtcNow;
        var firstOfMonth = new DateOnly(now.Year, now.Month, 1);
        var firstOfLastMonth = firstOfMonth.AddMonths(-1);

        var educationCount = await _context.EducationRecords
            .Where(e => e.CompletionStatus == "Completed" && e.RecordDate >= firstOfMonth)
            .CountAsync();

        var thisMonthHealth = await _context.HealthWellbeingRecords
            .Where(h => h.RecordDate >= firstOfMonth)
            .AverageAsync(h => (double?)((double?)h.GeneralHealthScore));

        var lastMonthHealth = await _context.HealthWellbeingRecords
            .Where(h => h.RecordDate >= firstOfLastMonth && h.RecordDate < firstOfMonth)
            .AverageAsync(h => (double?)((double?)h.GeneralHealthScore));

        var healthDelta = Math.Round((thisMonthHealth ?? 0) - (lastMonthHealth ?? 0), 1);

        var nearReadyCount = await _context.ResidentReadinessScores
            .Where(r => r.ReadinessLabel == "Near Ready")
            .CountAsync();

        return Ok(new AchievementsResponse(educationCount, healthDelta, nearReadyCount));
    }

    [HttpPost("generate-post")]
    public async Task<ActionResult<GeneratePostResponse>> GeneratePost([FromBody] GeneratePostRequest request)
    {
        var recommendations = await _context.SocialMediaRecommendations
            .Where(r => r.Significant == true && r.ModelType == "OLS")
            .ToListAsync();

        var topRecs = recommendations
            .OrderByDescending(r => Math.Abs(r.Coefficient ?? 0))
            .Take(5)
            .ToList();

        string mlContext = topRecs.Count > 0
            ? "ML insights from past post performance:\n" + string.Join("\n", topRecs.Select(r =>
                $"- {r.Feature}: coefficient {r.Coefficient:+0.000;-0.000} ({(r.Coefficient > 0 ? "increases" : "decreases")} donation referrals)"))
            : string.Empty;

        var topInsight = topRecs.FirstOrDefault();
        string? dataInsight = topInsight != null
            ? $"{topInsight.Feature} signal: {topInsight.Coefficient:+0.000;-0.000} coefficient — strongest predictor of donation referrals"
            : null;

        var storyArcLine = string.IsNullOrEmpty(request.StoryArc) ? "" : $"\nStory arc to follow: {request.StoryArc}";
        var systemPrompt = $@"You are a compassionate social media writer for a nonprofit safehouse that protects at-risk youth.
Write authentic, emotionally resonant posts that drive real engagement without exploiting vulnerable individuals.
Never include identifying details about residents. Keep language hopeful and dignity-affirming.
{mlContext}";

        var userMessage = $@"Write a {request.Platform} post with the goal: {request.PostGoal}.{storyArcLine}
Highlight this achievement: {request.Achievement.Summary}
Write only the post copy — no commentary, no hashtag lists unless appropriate for the platform.
Keep it concise and platform-appropriate.";

        var apiKey = _config["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        if (string.IsNullOrEmpty(apiKey))
            return StatusCode(500, "Gemini API key not configured");

        var client = _httpClientFactory.CreateClient();
        var geminiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

        var geminiRequest = new
        {
            system_instruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[]
            {
                new { role = "user", parts = new[] { new { text = userMessage } } }
            },
            generationConfig = new { temperature = 0.8, maxOutputTokens = 400 }
        };

        var json = JsonSerializer.Serialize(geminiRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(geminiUrl, content);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            return StatusCode(500, $"Gemini API error: {err}");
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);
        var postCopy = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "";

        return Ok(new GeneratePostResponse(postCopy.Trim(), dataInsight, request.Platform));
    }
}

public record AchievementsResponse(int EducationCount, double HealthDelta, int NearReadyCount);
