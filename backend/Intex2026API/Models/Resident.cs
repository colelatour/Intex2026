using System;
using System.Collections.Generic;

namespace Intex2026API.Models;

public partial class Resident
{
    public string? ResidentId { get; set; }

    public string? CaseControlNo { get; set; }

    public string? InternalCode { get; set; }

    public string? SafehouseId { get; set; }

    public string? CaseStatus { get; set; }

    public string? Sex { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? BirthStatus { get; set; }

    public string? PlaceOfBirth { get; set; }

    public string? Religion { get; set; }

    public string? CaseCategory { get; set; }

    public string? SubCatOrphaned { get; set; }

    public string? SubCatTrafficked { get; set; }

    public string? SubCatChildLabor { get; set; }

    public string? SubCatPhysicalAbuse { get; set; }

    public string? SubCatSexualAbuse { get; set; }

    public string? SubCatOsaec { get; set; }

    public string? SubCatCicl { get; set; }

    public string? SubCatAtRisk { get; set; }

    public string? SubCatStreetChild { get; set; }

    public string? SubCatChildWithHiv { get; set; }

    public string? IsPwd { get; set; }

    public string? PwdType { get; set; }

    public string? HasSpecialNeeds { get; set; }

    public string? SpecialNeedsDiagnosis { get; set; }

    public string? FamilyIs4ps { get; set; }

    public string? FamilySoloParent { get; set; }

    public string? FamilyIndigenous { get; set; }

    public string? FamilyParentPwd { get; set; }

    public string? FamilyInformalSettler { get; set; }

    public DateOnly? DateOfAdmission { get; set; }

    public string? AgeUponAdmission { get; set; }

    public string? PresentAge { get; set; }

    public string? LengthOfStay { get; set; }

    public string? ReferralSource { get; set; }

    public string? ReferringAgencyPerson { get; set; }

    public DateOnly? DateColbRegistered { get; set; }

    public DateOnly? DateColbObtained { get; set; }

    public string? AssignedSocialWorker { get; set; }

    public string? InitialCaseAssessment { get; set; }

    public DateOnly? DateCaseStudyPrepared { get; set; }

    public string? ReintegrationType { get; set; }

    public string? ReintegrationStatus { get; set; }

    public string? InitialRiskLevel { get; set; }

    public string? CurrentRiskLevel { get; set; }

    public DateOnly? DateEnrolled { get; set; }

    public DateOnly? DateClosed { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? NotesRestricted { get; set; }
}
