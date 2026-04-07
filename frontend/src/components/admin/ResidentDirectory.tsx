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

function hasValue(v: string | null): v is string {
  return v !== null && v.trim() !== '';
}

// ── Shared section definitions ──────────────────────────────────────────────
type SectionDef = {
  title: string;
  type?: 'tags';
  fields: { label: string; key: keyof Resident }[];
};

const SECTIONS: SectionDef[] = [
  {
    title: 'Personal Info',
    fields: [
      { label: 'Sex',                     key: 'sex' },
      { label: 'Date of Birth',           key: 'dateOfBirth' },
      { label: 'Birth Status',            key: 'birthStatus' },
      { label: 'Place of Birth',          key: 'placeOfBirth' },
      { label: 'Religion',                key: 'religion' },
      { label: 'Age on Admission',        key: 'ageUponAdmission' },
      { label: 'Present Age',             key: 'presentAge' },
      { label: 'Is PWD',                  key: 'isPwd' },
      { label: 'PWD Type',                key: 'pwdType' },
      { label: 'Has Special Needs',       key: 'hasSpecialNeeds' },
      { label: 'Special Needs Diagnosis', key: 'specialNeedsDiagnosis' },
    ],
  },
  {
    title: 'Case Details',
    fields: [
      { label: 'Case Category',           key: 'caseCategory' },
      { label: 'Case Status',             key: 'caseStatus' },
      { label: 'Initial Case Assessment', key: 'initialCaseAssessment' },
      { label: 'Initial Risk Level',      key: 'initialRiskLevel' },
      { label: 'Current Risk Level',      key: 'currentRiskLevel' },
      { label: 'Assigned Social Worker',  key: 'assignedSocialWorker' },
      { label: 'Referral Source',         key: 'referralSource' },
      { label: 'Referring Agency/Person', key: 'referringAgencyPerson' },
      { label: 'Date of Admission',       key: 'dateOfAdmission' },
      { label: 'Length of Stay',          key: 'lengthOfStay' },
      { label: 'Date Enrolled',           key: 'dateEnrolled' },
      { label: 'Date Closed',             key: 'dateClosed' },
    ],
  },
  {
    title: 'Case Subcategories',
    type: 'tags',
    fields: [
      { label: 'Orphaned',       key: 'subCatOrphaned' },
      { label: 'Trafficked',     key: 'subCatTrafficked' },
      { label: 'Child Labor',    key: 'subCatChildLabor' },
      { label: 'Physical Abuse', key: 'subCatPhysicalAbuse' },
      { label: 'Sexual Abuse',   key: 'subCatSexualAbuse' },
      { label: 'OSAEC',          key: 'subCatOsaec' },
      { label: 'CICL',           key: 'subCatCicl' },
      { label: 'At Risk',        key: 'subCatAtRisk' },
      { label: 'Street Child',   key: 'subCatStreetChild' },
      { label: 'Child w/ HIV',   key: 'subCatChildWithHiv' },
    ],
  },
  {
    title: 'Family Background',
    fields: [
      { label: 'Family Is 4Ps',      key: 'familyIs4ps' },
      { label: 'Solo Parent',        key: 'familySoloParent' },
      { label: 'Indigenous',         key: 'familyIndigenous' },
      { label: 'Parent PWD',         key: 'familyParentPwd' },
      { label: 'Informal Settler',   key: 'familyInformalSettler' },
    ],
  },
  {
    title: 'Administrative',
    fields: [
      { label: 'Internal Code',            key: 'internalCode' },
      { label: 'Safehouse ID',             key: 'safehouseId' },
      { label: 'Case Control No.',         key: 'caseControlNo' },
      { label: 'Date COLB Registered',     key: 'dateColbRegistered' },
      { label: 'Date COLB Obtained',       key: 'dateColbObtained' },
      { label: 'Date Case Study Prepared', key: 'dateCaseStudyPrepared' },
      { label: 'Reintegration Type',       key: 'reintegrationType' },
      { label: 'Reintegration Status',     key: 'reintegrationStatus' },
      { label: 'Notes (Restricted)',       key: 'notesRestricted' },
      { label: 'Created At',               key: 'createdAt' },
    ],
  },
];

// ── Read-only detail panel ───────────────────────────────────────────────────
interface DetailPanelProps {
  resident: Resident;
  onEditStart: () => void;
  onDelete: () => void;
}

function DetailPanel({ resident, onEditStart, onDelete }: DetailPanelProps) {
  return (
    <div className="detail-panel">
      {SECTIONS.map((section) => {
        if (section.type === 'tags') {
          const active = section.fields.filter((f) => hasValue(resident[f.key] as string | null));
          if (active.length === 0) return null;
          return (
            <div className="detail-section" key={section.title}>
              <div className="detail-section__title">{section.title}</div>
              <div className="subcat-tags">
                {active.map((f) => (
                  <span key={f.key} className="badge badge-risk">{f.label}</span>
                ))}
              </div>
            </div>
          );
        }

        const visible = section.fields.filter((f) => hasValue(resident[f.key] as string | null));
        if (visible.length === 0) return null;

        return (
          <div className="detail-section" key={section.title}>
            <div className="detail-section__title">{section.title}</div>
            <div className="detail-grid">
              {visible.map((f) => (
                <div key={f.key}>
                  <div className="detail-field__label">{f.label}</div>
                  <div className="detail-field__value">{resident[f.key] as string}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
        <button className="btn-add" onClick={(e) => { e.stopPropagation(); onEditStart(); }}>
           Edit Record
        </button>
        <button
          className="btn-export"
          style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          🗑 Delete Record
        </button>
      </div>
    </div>
  );
}

// ── Dropdown options for enum / boolean fields ───────────────────────────────
const BOOL_OPTIONS = ['True', 'False'];

const FIELD_OPTIONS: Partial<Record<keyof Resident, string[]>> = {
  caseStatus:           ['Active', 'Closed', 'Transferred'],
  sex:                  ['F', 'M'],
  birthStatus:          ['Marital', 'Non-Marital'],
  caseCategory:         ['Surrendered', 'Abandoned', 'Foundling', 'Neglected'],
  initialRiskLevel:     ['Low', 'Medium', 'High', 'Critical'],
  currentRiskLevel:     ['Low', 'Medium', 'High', 'Critical'],
  reintegrationType:    ['None', 'Family Reunification', 'Foster Care', 'Independent Living', 'Adoption (Domestic)', 'Adoption (Inter-Country)'],
  reintegrationStatus:  ['Not Started', 'In Progress', 'On Hold', 'Completed'],
  religion:             ['Roman Catholic', 'Evangelical', 'Seventh-day Adventist', 'Islam', "Jehovah's Witness", 'Buddhism', 'Unspecified', 'Other'],
  referralSource:       ['Government Agency', 'Police', 'Court Order', 'NGO', 'Community', 'Self-Referral'],
  initialCaseAssessment:['For Reunification', 'For Continued Care', 'For Foster Care', 'For Independent Living', 'For Adoption'],
  safehouseId:          ['1','2','3','4','5','6','7','8','9'],
  pwdType:              ['', 'Hearing', 'Intellectual'],
  specialNeedsDiagnosis:['', 'Learning Disability', 'Speech Impairment', 'Developmental Delay'],
  isPwd:                BOOL_OPTIONS,
  hasSpecialNeeds:      BOOL_OPTIONS,
  familyIs4ps:          BOOL_OPTIONS,
  familySoloParent:     BOOL_OPTIONS,
  familyIndigenous:     BOOL_OPTIONS,
  familyParentPwd:      BOOL_OPTIONS,
  familyInformalSettler:BOOL_OPTIONS,
  subCatOrphaned:       BOOL_OPTIONS,
  subCatTrafficked:     BOOL_OPTIONS,
  subCatChildLabor:     BOOL_OPTIONS,
  subCatPhysicalAbuse:  BOOL_OPTIONS,
  subCatSexualAbuse:    BOOL_OPTIONS,
  subCatOsaec:          BOOL_OPTIONS,
  subCatCicl:           BOOL_OPTIONS,
  subCatAtRisk:         BOOL_OPTIONS,
  subCatStreetChild:    BOOL_OPTIONS,
  subCatChildWithHiv:   BOOL_OPTIONS,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '0.15rem',
  padding: '5px 8px',
  border: '1.5px solid var(--gray-200)',
  borderRadius: '6px',
  fontSize: '0.82rem',
  fontFamily: 'DM Sans, sans-serif',
  color: 'var(--gray-800)',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
};

// ── Keys auto-generated by the backend — excluded from the create form ───────
const AUTO_KEYS = new Set<keyof Resident>(['residentId', 'caseControlNo', 'internalCode', 'createdAt']);

// ── Create form panel ────────────────────────────────────────────────────────
interface CreatePanelProps {
  draft: Partial<Resident>;
  onChange: (key: keyof Resident, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  creating: boolean;
}

function CreatePanel({ draft, onChange, onSave, onCancel, creating }: CreatePanelProps) {
  return (
    <div className="detail-panel" style={{ borderRadius: '12px', border: '1px solid var(--gray-200)', marginBottom: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div className="detail-section__title" style={{ fontSize: '0.8rem', color: 'var(--navy)' }}>
          New Resident — IDs will be assigned automatically
        </div>
      </div>
      {SECTIONS.map((section) => {
        const fields = section.fields.filter((f) => !AUTO_KEYS.has(f.key));
        if (fields.length === 0) return null;
        return (
          <div className="detail-section" key={section.title}>
            <div className="detail-section__title">{section.title}</div>
            <div className="detail-grid">
              {fields.map((f) => {
                const options = FIELD_OPTIONS[f.key];
                const value = (draft[f.key] as string | null) ?? '';
                return (
                  <div key={f.key}>
                    <div className="detail-field__label">{f.label}</div>
                    {options ? (
                      <select
                        value={value}
                        onChange={(e) => onChange(f.key, e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">— select —</option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>{opt || '(none)'}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(f.key, e.target.value)}
                        style={inputStyle}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
        <button className="btn-add" onClick={onSave} disabled={creating}>
          {creating ? 'Creating…' : '+ Create Resident'}
        </button>
        <button className="btn-export" onClick={onCancel} disabled={creating}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Edit form panel ──────────────────────────────────────────────────────────
interface EditPanelProps {
  draft: Resident;
  onChange: (key: keyof Resident, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function EditPanel({ draft, onChange, onSave, onCancel, saving }: EditPanelProps) {
  return (
    <div className="detail-panel">
      {SECTIONS.map((section) => (
        <div className="detail-section" key={section.title}>
          <div className="detail-section__title">{section.title}</div>
          <div className="detail-grid">
            {section.fields.map((f) => {
              const options = FIELD_OPTIONS[f.key];
              const value = (draft[f.key] as string | null) ?? '';
              return (
                <div key={f.key}>
                  <div className="detail-field__label">{f.label}</div>
                  {options ? (
                    <select
                      value={value}
                      onChange={(e) => onChange(f.key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={inputStyle}
                    >
                      <option value="">— select —</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>{opt || '(none)'}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => onChange(f.key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={inputStyle}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save / Cancel */}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
        <button
          className="btn-add"
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          disabled={saving}
        >
          {saving ? 'Saving…' : ' Save Changes'}
        </button>
        <button
          className="btn-export"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
interface ResidentDirectoryProps {
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
}

export default function ResidentDirectory({ showCreate, setShowCreate }: ResidentDirectoryProps) {
  const [residents, setResidents]   = useState<Resident[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editDraft, setEditDraft]       = useState<Resident | null>(null);
  const [saving, setSaving]             = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [createDraft, setCreateDraft]   = useState<Partial<Resident>>({});
  const [creating, setCreating]         = useState(false);
  const [pageSize, setPageSize]         = useState(10);
  const [currentPage, setCurrentPage]   = useState(1);

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

  const filtered = residents.filter((r) => {
    const matchesSearch = search === '' || (r.residentId ?? '').toLowerCase() === search.toLowerCase();
    const matchesStatus = statusFilter === '' || r.caseStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleExpand = (id: string | null) => {
    if (editingId) return; // block collapse while editing
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleEditStart = (resident: Resident) => {
    setEditingId(resident.residentId);
    setEditDraft({ ...resident });
  };

  const handleEditChange = (key: keyof Resident, value: string) => {
    setEditDraft((prev) => prev ? { ...prev, [key]: value || null } : prev);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const handleEditSave = async () => {
    if (!editDraft?.residentId) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/Residents/${editDraft.residentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResidents((prev) =>
        prev.map((r) => (r.residentId === editDraft.residentId ? editDraft : r))
      );
      setEditingId(null);
      setEditDraft(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChange = (key: keyof Resident, value: string) => {
    setCreateDraft((prev) => ({ ...prev, [key]: value || null }));
  };

  const handleCreateSave = async () => {
    setCreating(true);
    try {
      const res = await fetch('http://localhost:5000/Residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createDraft),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const created: Resident = await res.json();
      setResidents((prev) => [created, ...prev]);
      setShowCreate(false);
      setCreateDraft({});
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create resident');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete resident ${id}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/Residents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResidents((prev) => prev.filter((r) => r.residentId !== id));
      setExpandedId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete resident');
    }
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
              placeholder="Search by resident ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-btn"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <option value="">All Statuses</option>
            {FIELD_OPTIONS.caseStatus!.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {showCreate && (
        <CreatePanel
          draft={createDraft}
          onChange={handleCreateChange}
          onSave={handleCreateSave}
          onCancel={() => { setShowCreate(false); setCreateDraft({}); }}
          creating={creating}
        />
      )}

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
              {paginated.map((r) => {
                const isExpanded = expandedId === r.residentId;
                const isEditing  = editingId  === r.residentId;
                return (
                  <>
                    <tr
                      key={r.residentId}
                      style={{ cursor: editingId ? 'default' : 'pointer' }}
                      onClick={() => toggleExpand(r.residentId)}
                    >
                      <td className="resident-id">{r.residentId ?? '—'}</td>
                      <td>{r.caseControlNo ?? '—'}</td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[r.caseStatus ?? ''] ?? ''}`}>
                          {r.caseStatus ?? '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--gray-400)', fontSize: '0.78rem' }}>
                        {isEditing ? '✏️ editing' : isExpanded ? '▲ collapse' : '▼ expand'}
                      </td>
                    </tr>
                    {isExpanded && !isEditing && (
                      <tr key={`${r.residentId}-detail`}>
                        <td colSpan={4} style={{ padding: 0 }}>
                          <DetailPanel
                            resident={r}
                            onEditStart={() => handleEditStart(r)}
                            onDelete={() => handleDelete(r.residentId!)}
                          />
                        </td>
                      </tr>
                    )}
                    {isEditing && editDraft && (
                      <tr key={`${r.residentId}-edit`}>
                        <td colSpan={4} style={{ padding: 0 }}>
                          <EditPanel
                            draft={editDraft}
                            onChange={handleEditChange}
                            onSave={handleEditSave}
                            onCancel={handleEditCancel}
                            saving={saving}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          <div className="table-footer">
            <span>
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} residents
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <select
                className="filter-btn"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={30}>30 / page</option>
              </select>
              <button
                className="filter-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{ padding: '3px 10px' }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className="filter-btn"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    padding: '3px 10px',
                    background: p === safePage ? 'var(--navy)' : 'white',
                    color: p === safePage ? 'white' : 'var(--gray-600)',
                    borderColor: p === safePage ? 'var(--navy)' : undefined,
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                className="filter-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{ padding: '3px 10px' }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
