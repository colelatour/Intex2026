using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class PublicImpactSnapshot
{
    public string? SnapshotId { get; set; }

    public DateOnly? SnapshotDate { get; set; }

    public string? Headline { get; set; }

    public string? SummaryText { get; set; }

    public string? MetricPayloadJson { get; set; }

    public string? IsPublished { get; set; }

    public DateOnly? PublishedAt { get; set; }
}
