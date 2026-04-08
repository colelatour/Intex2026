namespace Intex2026API.Models;

public partial class DonorChurnScore
{
    public string SupporterId { get; set; } = null!;

    public DateTime ScoredAt { get; set; }

    public double ChurnProbability { get; set; }

    public string? ChurnRiskLabel { get; set; }
}
