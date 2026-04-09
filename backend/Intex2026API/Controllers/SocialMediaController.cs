using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace Intex2026API.Controllers;

public record SocialMediaHighlightDto(
    string Category,
    string? Icon,
    string? HighlightText,
    double MetricValue,
    string? RecommendedPlatform,
    string? RecommendedPostType,
    double PctAboveAverage
);

public record SocialPostRequest(
    string Platform,
    string PostGoal,
    string? StoryArc,
    SocialPostAchievement Achievement
);

public record SocialPostAchievement(string Type, string Summary);

public record SocialPostResponse(
    string PostCopy,
    string? DataInsight,
    string Platform
);

[ApiController]
[Route("api/social-media")]
[Authorize(Roles = "Admin,Worker")]
public class SocialMediaController : ControllerBase
{
    private readonly LighthouseContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public SocialMediaController(LighthouseContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    // GET /api/social-media/highlights
    [HttpGet("highlights")]
    public async Task<ActionResult<IEnumerable<SocialMediaHighlightDto>>> GetHighlights()
    {
        var highlights = await _context.SocialMediaHighlights
            .Where(h => h.MetricValue > 0)
            .OrderByDescending(h => h.PctAboveAverage)
            .Take(5)
            .Select(h => new SocialMediaHighlightDto(
                h.Category,
                h.Icon,
                h.HighlightText,
                h.MetricValue,
                h.RecommendedPlatform,
                h.RecommendedPostType,
                h.PctAboveAverage
            ))
            .ToListAsync();

        return Ok(highlights);
    }

    // GET /api/social-media/ml-guidelines
    [HttpGet("ml-guidelines")]
    public async Task<ActionResult<MlGuidelinesResponse>> GetMlGuidelines()
    {
        var positive = await _context.SocialMediaRecommendations
            .Where(r => r.Significant == true && r.ModelType == "OLS"
                     && r.Coefficient > 0 && r.Feature != "const")
            .OrderByDescending(r => r.Coefficient)
            .Take(3)
            .Select(r => new MlGuidelineDto(FormatFeatureName(r.Feature), r.Coefficient ?? 0))
            .ToListAsync();

        var negative = await _context.SocialMediaRecommendations
            .Where(r => r.Significant == true && r.ModelType == "OLS"
                     && r.Coefficient < 0 && r.Feature != "const")
            .OrderBy(r => r.Coefficient)
            .Take(3)
            .Select(r => new MlGuidelineDto(FormatFeatureName(r.Feature), r.Coefficient ?? 0))
            .ToListAsync();

        return Ok(new MlGuidelinesResponse(positive, negative));
    }

    // POST /api/social-media/generate-post
    [HttpPost("generate-post")]
    public async Task<ActionResult<SocialPostResponse>> GeneratePost([FromBody] SocialPostRequest request)
    {
        // ── Top 5 significant OLS coefficients ───────────────────────────────
        var allRecs = await _context.SocialMediaRecommendations
            .Where(r => r.Significant == true && r.ModelType == "OLS")
            .ToListAsync();

        var topRecs = allRecs
            .OrderByDescending(r => Math.Abs(r.Coefficient ?? 0))
            .Take(5)
            .ToList();

        var mlGuidelines = topRecs.Count > 0
            ? string.Join("\n", topRecs.Select(r =>
                $"• {FormatFeatureName(r.Feature)}: {(r.Coefficient > 0 ? "increases" : "decreases")} donation referrals (coefficient {r.Coefficient:+0.000;-0.000})"))
            : string.Empty;

        var topInsight = topRecs.FirstOrDefault();
        string? dataInsight = topInsight != null
            ? $"{FormatFeatureName(topInsight.Feature)} was the strongest predictor (coefficient {topInsight.Coefficient:+0.000;-0.000})"
            : null;

        // ── This month's achievement counts ──────────────────────────────────
        var now = DateTime.UtcNow;
        var firstOfMonth = new DateOnly(now.Year, now.Month, 1);
        var firstOfLastMonth = firstOfMonth.AddMonths(-1);

        var educationCount = await _context.EducationRecords
            .Where(e => e.CompletionStatus == "Completed" && e.RecordDate >= firstOfMonth)
            .CountAsync();

        var thisMonthHealth = await _context.HealthWellbeingRecords
            .Where(h => h.RecordDate >= firstOfMonth)
            .AverageAsync(h => (double?)h.GeneralHealthScore);

        var lastMonthHealth = await _context.HealthWellbeingRecords
            .Where(h => h.RecordDate >= firstOfLastMonth && h.RecordDate < firstOfMonth)
            .AverageAsync(h => (double?)h.GeneralHealthScore);

        var healthDelta = Math.Round((thisMonthHealth ?? 0) - (lastMonthHealth ?? 0), 1);

        var nearReadyCount = await _context.ResidentReadinessScores
            .Where(r => r.ReadinessLabel == "Near Ready")
            .CountAsync();

        // ── Build prompts ─────────────────────────────────────────────────────
        var systemPrompt = @"You are a compassionate social media writer for Sheltered Light, a nonprofit safehouse in the Philippines that protects and rehabilitates at-risk youth — survivors of trafficking, abuse, child labor, and neglect.

Your voice is warm, hopeful, and dignity-affirming. You never exploit or sensationalize the stories of vulnerable children. You write posts that inspire donors and supporters to believe in the mission and take action, without ever revealing identifying details about residents.

When writing posts:
- Lead with impact, not pity
- Use concrete numbers when available to build credibility
- Match tone and length to the platform (Instagram: visual/emotional; Facebook: narrative/community; WhatsApp: personal/direct)
- End with a clear, gentle call to action when the goal is donation
- Keep language accessible and human — no corporate-speak"
+ (mlGuidelines.Length > 0
    ? $"\n\nData-driven writing guidelines from analysis of past posts:\n{mlGuidelines}"
    : string.Empty);

        var achievementContext = $"This month's program data: {educationCount} education completions, health scores {(healthDelta >= 0 ? "+" : "")}{healthDelta} points vs last month, {nearReadyCount} residents approaching reintegration readiness.";

        var storyArcLine = string.IsNullOrEmpty(request.StoryArc) ? "" : $"\nStory arc: {request.StoryArc}";

        var userMessage = $@"Platform: {request.Platform}
Post goal: {request.PostGoal}{storyArcLine}
Achievement to highlight: {request.Achievement.Summary}
{achievementContext}

Write only the post copy — no commentary, no labels, no meta-text. Make it ready to publish.";

        // ── Call Gemini ───────────────────────────────────────────────────────
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
            generationConfig = new { temperature = 0.8, maxOutputTokens = 2048 }
        };

        var jsonBody = JsonSerializer.Serialize(geminiRequest);
        var httpContent = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(geminiUrl, httpContent);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            if ((int)response.StatusCode == 503)
                return StatusCode(503, "Gemini is temporarily overloaded — wait a few seconds and try again.");
            if ((int)response.StatusCode == 429)
                return StatusCode(429, "Rate limit reached — wait a moment and try again.");
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

        return Ok(new SocialPostResponse(postCopy.Trim(), dataInsight, request.Platform));
    }

    // GET /api/social-media/performance
    [HttpGet("performance")]
    public async Task<ActionResult<PerformanceResponse>> GetPerformance()
    {
        var db = _context.Database;

        // ── Find the most recent month that has data ──────────────────────────
        var statsConn = db.GetDbConnection();
        await statsConn.OpenAsync();

        DateTime firstOfMonth;
        using (var cmd = statsConn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT DATEFROMPARTS(YEAR(MAX(created_at)), MONTH(MAX(created_at)), 1)
                FROM social_media_posts
                WHERE created_at IS NOT NULL";
            var result = await cmd.ExecuteScalarAsync();
            firstOfMonth = result is DateTime dt ? dt : new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        }

        // ── This-month stat cards (one query) ────────────────────────────────
        int totalPostsThisMonth = 0;
        int totalReferralsThisMonth = 0;
        double avgReferralsThisMonth = 0;
        string bestPlatformThisMonth = "N/A";

        using (var cmd = statsConn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT
                    COUNT(*) AS total_posts,
                    ISNULL(SUM(TRY_CAST(donation_referrals AS INT)), 0) AS total_referrals,
                    ISNULL(AVG(CAST(TRY_CAST(donation_referrals AS INT) AS FLOAT)), 0) AS avg_referrals,
                    (
                        SELECT TOP 1 platform
                        FROM social_media_posts
                        WHERE created_at >= @firstOfMonth AND platform IS NOT NULL
                        GROUP BY platform
                        ORDER BY AVG(CAST(TRY_CAST(donation_referrals AS INT) AS FLOAT)) DESC
                    ) AS best_platform
                FROM social_media_posts
                WHERE created_at >= @firstOfMonth";

            var p = cmd.CreateParameter();
            p.ParameterName = "@firstOfMonth";
            p.Value = firstOfMonth;
            cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                totalPostsThisMonth     = reader.GetInt32(0);
                totalReferralsThisMonth = reader.GetInt32(1);
                avgReferralsThisMonth   = Math.Round(reader.GetDouble(2), 1);
                bestPlatformThisMonth   = reader.IsDBNull(3) ? "N/A" : reader.GetString(3);
            }
        }

        // ── Avg referrals by platform (all time) ─────────────────────────────
        var byPlatform = new List<PlatformPerformance>();
        using (var cmd = statsConn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT platform,
                    ROUND(AVG(CAST(TRY_CAST(donation_referrals AS INT) AS FLOAT)), 1) AS avg_referrals
                FROM social_media_posts
                WHERE platform IS NOT NULL
                GROUP BY platform
                ORDER BY avg_referrals DESC";

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                byPlatform.Add(new PlatformPerformance(reader.GetString(0), reader.GetDouble(1)));
        }

        // ── Avg referrals by post type (all time) ────────────────────────────
        var byPostType = new List<PostTypePerformance>();
        using (var cmd = statsConn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT post_type,
                    ROUND(AVG(CAST(TRY_CAST(donation_referrals AS INT) AS FLOAT)), 1) AS avg_referrals
                FROM social_media_posts
                WHERE post_type IS NOT NULL
                GROUP BY post_type
                ORDER BY avg_referrals DESC";

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                byPostType.Add(new PostTypePerformance(reader.GetString(0), reader.GetDouble(1)));
        }

        // ── Top 10 posts by donation referrals ───────────────────────────────
        var topPosts = new List<TopPost>();
        using (var cmd = statsConn.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT TOP 10
                    CONVERT(VARCHAR(10), created_at, 120) AS date,
                    ISNULL(platform, ''),
                    ISNULL(post_type, ''),
                    ISNULL(content_topic, ''),
                    ISNULL(TRY_CAST(donation_referrals AS INT), 0),
                    ISNULL(estimated_donation_value_php, 0)
                FROM social_media_posts
                ORDER BY ISNULL(TRY_CAST(donation_referrals AS INT), 0) DESC";

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                topPosts.Add(new TopPost(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetInt32(4),
                    reader.GetDecimal(5)
                ));
        }

        await statsConn.CloseAsync();

        return Ok(new PerformanceResponse(
            totalPostsThisMonth,
            totalReferralsThisMonth,
            avgReferralsThisMonth,
            bestPlatformThisMonth,
            byPlatform,
            byPostType,
            topPosts
        ));
    }

    private static string FormatFeatureName(string? feature)
    {
        if (string.IsNullOrEmpty(feature)) return "Unknown feature";
        return feature
            .Replace("_", " ")
            .Replace("platform ", "platform: ")
            .Replace("post type ", "post type: ")
            .Replace("media type ", "media type: ");
    }
}

public record MlGuidelineDto(string Feature, double Coefficient);
public record MlGuidelinesResponse(List<MlGuidelineDto> WhatToDo, List<MlGuidelineDto> WhatToAvoid);
public record PlatformPerformance(string Platform, double AvgReferrals);
public record PostTypePerformance(string PostType, double AvgReferrals);
public record TopPost(
    string Date,
    string Platform,
    string PostType,
    string ContentTopic,
    int DonationReferrals,
    decimal EstimatedValuePhp
);
public record PerformanceResponse(
    int TotalPostsThisMonth,
    int TotalReferralsThisMonth,
    double AvgReferralsThisMonth,
    string BestPlatformThisMonth,
    List<PlatformPerformance> ByPlatform,
    List<PostTypePerformance> ByPostType,
    List<TopPost> TopPosts
);
