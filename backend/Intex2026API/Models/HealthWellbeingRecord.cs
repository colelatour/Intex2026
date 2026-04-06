using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class HealthWellbeingRecord
{
    public string? HealthRecordId { get; set; }

    public string? ResidentId { get; set; }

    public DateOnly? RecordDate { get; set; }

    public decimal? GeneralHealthScore { get; set; }

    public decimal? NutritionScore { get; set; }

    public decimal? SleepQualityScore { get; set; }

    public decimal? EnergyLevelScore { get; set; }

    public decimal? HeightCm { get; set; }

    public decimal? WeightKg { get; set; }

    public decimal? Bmi { get; set; }

    public string? MedicalCheckupDone { get; set; }

    public string? DentalCheckupDone { get; set; }

    public string? PsychologicalCheckupDone { get; set; }

    public string? Notes { get; set; }
}
