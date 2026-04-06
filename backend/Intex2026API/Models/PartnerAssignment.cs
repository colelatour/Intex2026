using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class PartnerAssignment
{
    public string? AssignmentId { get; set; }

    public string? PartnerId { get; set; }

    public decimal? SafehouseId { get; set; }

    public string? ProgramArea { get; set; }

    public DateOnly? AssignmentStart { get; set; }

    public DateOnly? AssignmentEnd { get; set; }

    public string? ResponsibilityNotes { get; set; }

    public string? IsPrimary { get; set; }

    public string? Status { get; set; }
}
