namespace Intex2026API.Models;

public class ResidentReadinessScore
{
    public string ResidentId { get; set; } = null!;
    public double ReadinessProbability { get; set; }
    public string? ReadinessLabel { get; set; }
    public DateTime? ScoredAt { get; set; }
}
