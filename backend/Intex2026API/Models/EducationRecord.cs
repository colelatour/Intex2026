using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class EducationRecord
{
    public string? EducationRecordId { get; set; }

    public string? ResidentId { get; set; }

    public DateOnly? RecordDate { get; set; }

    public string? EducationLevel { get; set; }

    public string? SchoolName { get; set; }

    public string? EnrollmentStatus { get; set; }

    public decimal? AttendanceRate { get; set; }

    public decimal? ProgressPercent { get; set; }

    public string? CompletionStatus { get; set; }

    public string? Notes { get; set; }
}
