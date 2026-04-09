namespace Intex2026API.Models;

public class SocialMediaRecommendation
{
    public string Feature { get; set; } = null!;
    public double? Coefficient { get; set; }
    public double? PValue { get; set; }
    public bool? Significant { get; set; }
    public string? ModelType { get; set; }
    public DateTime? ScoredAt { get; set; }
}
