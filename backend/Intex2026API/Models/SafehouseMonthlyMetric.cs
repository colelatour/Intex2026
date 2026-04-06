using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class SafehouseMonthlyMetric
{
    public string? MetricId { get; set; }

    public string? SafehouseId { get; set; }

    public DateOnly? MonthStart { get; set; }

    public DateOnly? MonthEnd { get; set; }

    public string? ActiveResidents { get; set; }

    public decimal? AvgEducationProgress { get; set; }

    public decimal? AvgHealthScore { get; set; }

    public string? ProcessRecordingCount { get; set; }

    public string? HomeVisitationCount { get; set; }

    public string? IncidentCount { get; set; }

    public string? Notes { get; set; }
}
