namespace Intex2026API.Models;

public class SocialMediaHighlight
{
    public string Category { get; set; } = null!;
    public string? Icon { get; set; }
    public string? HighlightText { get; set; }
    public double MetricValue { get; set; }
    public string? RecommendedPlatform { get; set; }
    public string? RecommendedPostType { get; set; }
    public double PctAboveAverage { get; set; }
}
