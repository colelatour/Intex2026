using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class Donation
{
    public string? DonationId { get; set; }

    public string? SupporterId { get; set; }

    public string? DonationType { get; set; }

    public DateOnly? DonationDate { get; set; }

    public string? IsRecurring { get; set; }

    public string? CampaignName { get; set; }

    public string? ChannelSource { get; set; }

    public string? CurrencyCode { get; set; }

    public decimal? Amount { get; set; }

    public decimal? EstimatedValue { get; set; }

    public string? ImpactUnit { get; set; }

    public string? Notes { get; set; }

    public string? ReferralPostId { get; set; }
}
