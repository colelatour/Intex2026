using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class Safehouse
{
    public string? SafehouseId { get; set; }

    public string? SafehouseCode { get; set; }

    public string? Name { get; set; }

    public string? Region { get; set; }

    public string? City { get; set; }

    public string? Province { get; set; }

    public string? Country { get; set; }

    public DateOnly? OpenDate { get; set; }

    public string? Status { get; set; }

    public string? CapacityGirls { get; set; }

    public string? CapacityStaff { get; set; }

    public string? CurrentOccupancy { get; set; }

    public string? Notes { get; set; }
}
