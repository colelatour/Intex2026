// src/components/admin/ResidentDirectory.tsx
import { useEffect, useState } from 'react';

interface Resident {
  residentId: string | null;
  caseControlNo: string | null;
  internalCode: string | null;
  safehouseId: string | null;
  caseStatus: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  birthStatus: string | null;
  placeOfBirth: string | null;
  religion: string | null;
  caseCategory: string | null;
  subCatOrphaned: string | null;
  subCatTrafficked: string | null;
  subCatChildLabor: string | null;
  subCatPhysicalAbuse: string | null;
  subCatSexualAbuse: string | null;
  subCatOsaec: string | null;
  subCatCicl: string | null;
  subCatAtRisk: string | null;
  subCatStreetChild: string | null;
  subCatChildWithHiv: string | null;
  isPwd: string | null;
  pwdType: string | null;
  hasSpecialNeeds: string | null;
  specialNeedsDiagnosis: string | null;
  familyIs4ps: string | null;
  familySoloParent: string | null;
  familyIndigenous: string | null;
  familyParentPwd: string | null;
  familyInformalSettler: string | null;
  dateOfAdmission: string | null;
  ageUponAdmission: string | null;
  presentAge: string | null;
  lengthOfStay: string | null;
  referralSource: string | null;
  referringAgencyPerson: string | null;
  dateColbRegistered: string | null;
  dateColbObtained: string | null;
  assignedSocialWorker: string | null;
  initialCaseAssessment: string | null;
  dateCaseStudyPrepared: string | null;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
  initialRiskLevel: string | null;
  currentRiskLevel: string | null;
  dateEnrolled: string | null;
  dateClosed: string | null;
  createdAt: string | null;
  notesRestricted: string | null;
}

const STATUS_CLASS: Record<string, string> = {
  Active:     'badge-prog',
  Closed:     'badge-re',
  'At Risk':  'badge-risk',
  Monitoring: 'badge-mon',
};

function DetailGrid({ resident }: { resident: Resident }) {
  const fields: { label: string; value: string | null }[] = [
    { label: 'Resident ID',            value: resident.residentId },
    { label: 'Case Control No.',       value: resident.caseControlNo },
    { label: 'Internal Code',          value: resident.internalCode },
    { label: 'Safehouse ID',           value: resident.safehouseId },
    { label: 'Case Status',            value: resident.caseStatus },
    { label: 'Case Category',          value: resident.caseCategory },
    { label: 'Sex',                    value: resident.sex },
    { label: 'Date of Birth',          value: resident.dateOfBirth },
    { label: 'Birth Status',           value: resident.birthStatus },
    { label: 'Place of Birth',         value: resident.placeOfBirth },
    { label: 'Religion',               value: resident.religion },
    { label: 'Age Upon Admission',     value: resident.ageUponAdmission },
    { label: 'Present Age',            value: resident.presentAge },
    { label: 'Date of Admission',      value: resident.dateOfAdmission },
    { label: 'Length of Stay',         value: resident.lengthOfStay },
    { label: 'Date Enrolled',          value: resident.dateEnrolled },
    { label: 'Date Closed',            value: resident.dateClosed },
    { label: 'Assigned Social Worker', value: resident.assignedSocialWorker },
    { label: 'Referral Source',        value: resident.referralSource },
    { label: 'Referring Agency/Person',value: resident.referringAgencyPerson },
    { label: 'Initial Case Assessment',value: resident.initialCaseAssessment },
    { label: 'Date Case Study Prepared',value: resident.dateCaseStudyPrepared },
    { label: 'Initial Risk Level',     value: resident.initialRiskLevel },
    { label: 'Current Risk Level',     value: resident.currentRiskLevel },
    { label: 'Reintegration Type',     value: resident.reintegrationType },
    { label: 'Reintegration Status',   value: resident.reintegrationStatus },
    { label: 'Date COLB Registered',   value: resident.dateColbRegistered },
    { label: 'Date COLB Obtained',     value: resident.dateColbObtained },
    { label: 'Is PWD',                 value: resident.isPwd },
    { label: 'PWD Type',               value: resident.pwdType },
    { label: 'Has Special Needs',      value: resident.hasSpecialNeeds },
    { label: 'Special Needs Diagnosis',value: resident.specialNeedsDiagnosis },
    { label: 'Family Is 4Ps',          value: resident.familyIs4ps },
    { label: 'Family Solo Parent',     value: resident.familySoloParent },
    { label: 'Family Indigenous',      value: resident.familyIndigenous },
    { label: 'Family Parent PWD',      value: resident.familyParentPwd },
    { label: 'Family Informal Settler',value: resident.familyInformalSettler },
    { label: 'Sub-Cat: Orphaned',      value: resident.subCatOrphaned },
    { label: 'Sub-Cat: Trafficked',    value: resident.subCatTrafficked },
    { label: 'Sub-Cat: Child Labor',   value: resident.subCatChildLabor },
    { label: 'Sub-Cat: Physical Abuse',value: resident.subCatPhysicalAbuse },
    { label: 'Sub-Cat: Sexual Abuse',  value: resident.subCatSexualAbuse },
    { label: 'Sub-Cat: OSAEC',         value: resident.subCatOsaec },
    { label: 'Sub-Cat: CICL',          value: resident.subCatCicl },
    { label: 'Sub-Cat: At Risk',       value: resident.subCatAtRisk },
    { label: 'Sub-Cat: Street Child',  value: resident.subCatStreetChild },
    { label: 'Sub-Cat: Child w/ HIV',  value: resident.subCatChildWithHiv },
    { label: 'Notes (Restricted)',     value: resident.notesRestricted },
    { label: 'Created At',             value: resident.createdAt },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '0.5rem 1.5rem',
      padding: '1rem 1.5rem',
      background: 'var(--gray-50, #f9fafb)',
      borderTop: '1px solid var(--gray-200, #e5e7eb)',
    }}>
      {fields.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--gray-800, #1f2937)' }}>
            {value ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ResidentDirectory() {
  const [residents, setResidents]   = useState<Resident[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/Residents')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data: Resident[]) => {
        setResidents(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch residents');
        setLoading(false);
      });
  }, []);

  const filtered = residents.filter((r) =>
    (r.residentId    ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.caseControlNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.caseStatus    ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string | null) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <div className="table-toolbar">
        <h3>Resident Directory</h3>
        <div className="table-right">
          <div className="search-bar">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by ID, name, or status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && <p style={{ padding: '1rem' }}>Loading residents…</p>}
      {error   && <p style={{ padding: '1rem', color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Resident ID</th>
                <th>Case Control No.</th>
                <th>Case Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isExpanded = expandedId === r.residentId;
                return (
                  <>
                    <tr
                      key={r.residentId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleExpand(r.residentId)}
                    >
                      <td className="resident-id" style={{ color: 'var(--navy, #1e3a5f)', fontWeight: 600 }}>
                        {r.residentId ?? '—'}
                      </td>
                      <td>{r.caseControlNo ?? '—'}</td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[r.caseStatus ?? ''] ?? ''}`}>
                          {r.caseStatus ?? '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--gray-400, #9ca3af)', fontSize: '0.8rem' }}>
                        {isExpanded ? '▲ collapse' : '▼ expand'}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.residentId}-detail`}>
                        <td colSpan={4} style={{ padding: 0 }}>
                          <DetailGrid resident={r} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Showing {filtered.length} of {residents.length} residents</span>
          </div>
        </div>
      )}
    </div>
  );
}
