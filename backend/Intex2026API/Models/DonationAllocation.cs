using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class DonationAllocation
{
    public string? AllocationId { get; set; }

    public string? DonationId { get; set; }

    public string? SafehouseId { get; set; }

    public string? ProgramArea { get; set; }

    public decimal? AmountAllocated { get; set; }

    public DateOnly? AllocationDate { get; set; }

    public string? AllocationNotes { get; set; }
}
