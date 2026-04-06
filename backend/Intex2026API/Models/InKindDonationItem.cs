using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class InKindDonationItem
{
    public string? ItemId { get; set; }

    public string? DonationId { get; set; }

    public string? ItemName { get; set; }

    public string? ItemCategory { get; set; }

    public string? Quantity { get; set; }

    public string? UnitOfMeasure { get; set; }

    public decimal? EstimatedUnitValue { get; set; }

    public string? IntendedUse { get; set; }

    public string? ReceivedCondition { get; set; }
}
