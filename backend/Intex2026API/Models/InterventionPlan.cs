using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class InterventionPlan
{
    public string? PlanId { get; set; }

    public string? ResidentId { get; set; }

    public string? PlanCategory { get; set; }

    public string? PlanDescription { get; set; }

    public string? ServicesProvided { get; set; }

    public decimal? TargetValue { get; set; }

    public DateOnly? TargetDate { get; set; }

    public string? Status { get; set; }

    public DateOnly? CaseConferenceDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
