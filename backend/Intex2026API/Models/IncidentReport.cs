using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class IncidentReport
{
    public string? IncidentId { get; set; }

    public string? ResidentId { get; set; }

    public string? SafehouseId { get; set; }

    public DateOnly? IncidentDate { get; set; }

    public string? IncidentType { get; set; }

    public string? Severity { get; set; }

    public string? Description { get; set; }

    public string? ResponseTaken { get; set; }

    public string? Resolved { get; set; }

    public DateOnly? ResolutionDate { get; set; }

    public string? ReportedBy { get; set; }

    public string? FollowUpRequired { get; set; }
}
