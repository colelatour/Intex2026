using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class SocialMediaPost
{
    public string? PostId { get; set; }

    public string? Platform { get; set; }

    public string? PlatformPostId { get; set; }

    public string? PostUrl { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? DayOfWeek { get; set; }

    public string? PostHour { get; set; }

    public string? PostType { get; set; }

    public string? MediaType { get; set; }

    public string? Caption { get; set; }

    public string? Hashtags { get; set; }

    public string? NumHashtags { get; set; }

    public string? MentionsCount { get; set; }

    public string? HasCallToAction { get; set; }

    public string? CallToActionType { get; set; }

    public string? ContentTopic { get; set; }

    public string? SentimentTone { get; set; }

    public string? CaptionLength { get; set; }

    public string? FeaturesResidentStory { get; set; }

    public string? CampaignName { get; set; }

    public string? IsBoosted { get; set; }

    public decimal? BoostBudgetPhp { get; set; }

    public string? Impressions { get; set; }

    public string? Reach { get; set; }

    public string? Likes { get; set; }

    public string? Comments { get; set; }

    public string? Shares { get; set; }

    public string? Saves { get; set; }

    public string? ClickThroughs { get; set; }

    public decimal? VideoViews { get; set; }

    public decimal? EngagementRate { get; set; }

    public string? ProfileVisits { get; set; }

    public string? DonationReferrals { get; set; }

    public decimal? EstimatedDonationValuePhp { get; set; }

    public string? FollowerCountAtPost { get; set; }

    public decimal? WatchTimeSeconds { get; set; }

    public decimal? AvgViewDurationSeconds { get; set; }

    public decimal? SubscriberCountAtPost { get; set; }

    public decimal? Forwards { get; set; }
}
