using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class HomeVisitation
{
    public string? VisitationId { get; set; }

    public string? ResidentId { get; set; }

    public DateOnly? VisitDate { get; set; }

    public string? SocialWorker { get; set; }

    public string? VisitType { get; set; }

    public string? LocationVisited { get; set; }

    public string? FamilyMembersPresent { get; set; }

    public string? Purpose { get; set; }

    public string? Observations { get; set; }

    public string? FamilyCooperationLevel { get; set; }

    public string? SafetyConcernsNoted { get; set; }

    public string? FollowUpNeeded { get; set; }

    public string? FollowUpNotes { get; set; }

    public string? VisitOutcome { get; set; }
}
