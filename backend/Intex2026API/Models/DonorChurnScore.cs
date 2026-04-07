namespace Intex2026API.Models;

public partial class DonorChurnScore
{
    public string SupporterId { get; set; } = null!;

    public DateTime ScoredAt { get; set; }

    public decimal ChurnProbability { get; set; }

    public string? ChurnRiskLabel { get; set; }

    public string? ModelVersion { get; set; }
}
