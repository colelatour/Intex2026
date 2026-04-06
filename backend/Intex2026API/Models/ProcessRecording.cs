using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class ProcessRecording
{
    public string? RecordingId { get; set; }

    public string? ResidentId { get; set; }

    public DateOnly? SessionDate { get; set; }

    public string? SocialWorker { get; set; }

    public string? SessionType { get; set; }

    public string? SessionDurationMinutes { get; set; }

    public string? EmotionalStateObserved { get; set; }

    public string? EmotionalStateEnd { get; set; }

    public string? SessionNarrative { get; set; }

    public string? InterventionsApplied { get; set; }

    public string? FollowUpActions { get; set; }

    public string? ProgressNoted { get; set; }

    public string? ConcernsFlagged { get; set; }

    public string? ReferralMade { get; set; }

    public string? NotesRestricted { get; set; }
}
