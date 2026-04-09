using Intex2026API.Data;
using Intex2026API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Intex2026API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Worker")]
public class ResidentsController : ControllerBase
{
    private sealed class ReadinessSnapshot
    {
        public string? ReadinessLabel { get; set; }
        public double? ReadinessProbability { get; set; }
        public DateTime? ReadinessScoredAt { get; set; }
    }

    public class ResidentDirectoryDto : Resident
    {
        public string? ReadinessLabel { get; set; }
        public double? ReadinessProbability { get; set; }
        public DateTime? ReadinessScoredAt { get; set; }
    }

    private readonly LighthouseContext _context;

    public ResidentsController(LighthouseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ResidentDirectoryDto>>> GetResidents()
    {
        var residents = await _context.Residents
            .AsNoTracking()
            .ToListAsync();

        var latestReadinessByResident = new Dictionary<string, ReadinessSnapshot>(StringComparer.Ordinal);
        var conn = _context.Database.GetDbConnection();
        var wasClosed = conn.State != ConnectionState.Open;
        if (wasClosed) await conn.OpenAsync();
        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
WITH latest AS (
    SELECT
        CAST(resident_id AS NVARCHAR(64)) AS resident_id,
        CAST(readiness_probability AS FLOAT) AS readiness_probability,
        CAST(readiness_label AS NVARCHAR(64)) AS readiness_label,
        scored_at,
        ROW_NUMBER() OVER (
            PARTITION BY resident_id
            ORDER BY
                scored_at DESC,
                readiness_probability DESC,
                readiness_label ASC
        ) AS rn
    FROM resident_readiness_scores
)
SELECT resident_id, readiness_probability, readiness_label, scored_at
FROM latest
WHERE rn = 1;";

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var residentId = reader["resident_id"] as string;
                if (string.IsNullOrWhiteSpace(residentId)) continue;
                latestReadinessByResident[residentId] = new ReadinessSnapshot
                {
                    ReadinessProbability = reader["readiness_probability"] is DBNull ? null : Convert.ToDouble(reader["readiness_probability"]),
                    ReadinessLabel = reader["readiness_label"] is DBNull ? null : Convert.ToString(reader["readiness_label"]),
                    ReadinessScoredAt = reader["scored_at"] is DBNull ? null : Convert.ToDateTime(reader["scored_at"])
                };
            }
        }
        finally
        {
            if (wasClosed) await conn.CloseAsync();
        }

        var result = residents.Select(r =>
        {
            latestReadinessByResident.TryGetValue(r.ResidentId ?? string.Empty, out var readiness);
            return new ResidentDirectoryDto
            {
                ResidentId = r.ResidentId,
                CaseControlNo = r.CaseControlNo,
                InternalCode = r.InternalCode,
                SafehouseId = r.SafehouseId,
                CaseStatus = r.CaseStatus,
                Sex = r.Sex,
                DateOfBirth = r.DateOfBirth,
                BirthStatus = r.BirthStatus,
                PlaceOfBirth = r.PlaceOfBirth,
                Religion = r.Religion,
                CaseCategory = r.CaseCategory,
                SubCatOrphaned = r.SubCatOrphaned,
                SubCatTrafficked = r.SubCatTrafficked,
                SubCatChildLabor = r.SubCatChildLabor,
                SubCatPhysicalAbuse = r.SubCatPhysicalAbuse,
                SubCatSexualAbuse = r.SubCatSexualAbuse,
                SubCatOsaec = r.SubCatOsaec,
                SubCatCicl = r.SubCatCicl,
                SubCatAtRisk = r.SubCatAtRisk,
                SubCatStreetChild = r.SubCatStreetChild,
                SubCatChildWithHiv = r.SubCatChildWithHiv,
                IsPwd = r.IsPwd,
                PwdType = r.PwdType,
                HasSpecialNeeds = r.HasSpecialNeeds,
                SpecialNeedsDiagnosis = r.SpecialNeedsDiagnosis,
                FamilyIs4ps = r.FamilyIs4ps,
                FamilySoloParent = r.FamilySoloParent,
                FamilyIndigenous = r.FamilyIndigenous,
                FamilyParentPwd = r.FamilyParentPwd,
                FamilyInformalSettler = r.FamilyInformalSettler,
                DateOfAdmission = r.DateOfAdmission,
                AgeUponAdmission = r.AgeUponAdmission,
                PresentAge = r.PresentAge,
                LengthOfStay = r.LengthOfStay,
                ReferralSource = r.ReferralSource,
                ReferringAgencyPerson = r.ReferringAgencyPerson,
                DateColbRegistered = r.DateColbRegistered,
                DateColbObtained = r.DateColbObtained,
                AssignedSocialWorker = r.AssignedSocialWorker,
                InitialCaseAssessment = r.InitialCaseAssessment,
                DateCaseStudyPrepared = r.DateCaseStudyPrepared,
                ReintegrationType = r.ReintegrationType,
                ReintegrationStatus = r.ReintegrationStatus,
                InitialRiskLevel = r.InitialRiskLevel,
                CurrentRiskLevel = r.CurrentRiskLevel,
                DateEnrolled = r.DateEnrolled,
                DateClosed = r.DateClosed,
                CreatedAt = r.CreatedAt,
                NotesRestricted = r.NotesRestricted,
                ReadinessLabel = readiness?.ReadinessLabel,
                ReadinessProbability = readiness?.ReadinessProbability,
                ReadinessScoredAt = readiness?.ReadinessScoredAt
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Resident>> GetResident(string id)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        return resident;
    }

    [HttpPost]
    public async Task<ActionResult<Resident>> PostResident(Resident resident)
    {
        // Auto-generate resident_id: max integer + 1
        var allIds = await _context.Residents
            .Where(r => r.ResidentId != null)
            .Select(r => r.ResidentId)
            .ToListAsync();
        int nextId = allIds
            .Select(id => int.TryParse(id, out var n) ? n : 0)
            .DefaultIfEmpty(0).Max() + 1;
        resident.ResidentId = nextId.ToString();

        // Auto-generate internal_code: LS-NNNN max + 1
        var allCodes = await _context.Residents
            .Where(r => r.InternalCode != null && r.InternalCode.StartsWith("LS-"))
            .Select(r => r.InternalCode)
            .ToListAsync();
        int nextCode = allCodes
            .Select(c => int.TryParse(c!.Substring(3), out var n) ? n : 0)
            .DefaultIfEmpty(0).Max() + 1;
        resident.InternalCode = $"LS-{nextCode:D4}";

        // Auto-generate case_control_no: CNNNN max + 1
        var allCcns = await _context.Residents
            .Where(r => r.CaseControlNo != null && r.CaseControlNo.StartsWith("C"))
            .Select(r => r.CaseControlNo)
            .ToListAsync();
        int nextCcn = allCcns
            .Select(c => int.TryParse(c!.Substring(1), out var n) ? n : 0)
            .DefaultIfEmpty(0).Max() + 1;
        resident.CaseControlNo = $"C{nextCcn:D4}";

        resident.CreatedAt = DateTime.UtcNow;

        _context.Residents.Add(resident);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetResident), new { id = resident.ResidentId }, resident);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutResident(string id, Resident resident)
    {
        if (id != resident.ResidentId) return BadRequest();
        _context.Entry(resident).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteResident(string id)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        _context.Residents.Remove(resident);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
