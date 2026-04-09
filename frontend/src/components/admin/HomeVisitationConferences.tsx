// src/components/admin/HomeVisitationConferences.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';

import { get, post, put, api } from '../../lib/api';
import '../../styles/HomeVisitationConferences.css';
import PaginationControls from './PaginationControls';

interface HomeVisitation {
  visitationId: string | null;
  residentId: string | null;
  visitDate: string | null;
  socialWorker: string | null;
  visitType: string | null;
  locationVisited: string | null;
  familyMembersPresent: string | null;
  purpose: string | null;
  observations: string | null;
  familyCooperationLevel: string | null;
  safetyConcernsNoted: string | null;
  followUpNeeded: string | null;
  followUpNotes: string | null;
  visitOutcome: string | null;
}

interface InterventionPlan {
  planId: string | null;
  residentId: string | null;
  planCategory: string | null;
  planDescription: string | null;
  servicesProvided: string | null;
  targetValue: number | null;
  targetDate: string | null;
  status: string | null;
  caseConferenceDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ResidentOption {
  residentId: string;
  label: string;
}

const VISIT_TYPES = [
  'Initial assessment',
  'Routine follow-up',
  'Reintegration assessment',
  'Post-placement monitoring',
  'Emergency',
] as const;

const COOPERATION_LEVELS = ['Excellent', 'Good', 'Fair', 'Poor', 'Not observed'] as const;
const FOLLOW_UP_NEEDED = ['Yes', 'No', 'Pending'] as const;

const EMPTY_VISIT: Omit<HomeVisitation, 'visitationId'> = {
  residentId: null,
  visitDate: null,
  socialWorker: null,
  visitType: null,
  locationVisited: null,
  familyMembersPresent: null,
  purpose: null,
  observations: null,
  familyCooperationLevel: null,
  safetyConcernsNoted: null,
  followUpNeeded: null,
  followUpNotes: null,
  visitOutcome: null,
};

const PLAN_CATEGORIES = ['Education', 'Physical Health', 'Safety'] as const;

const EMPTY_PLAN: Omit<InterventionPlan, 'planId'> = {
  residentId: null,
  planCategory: 'Education',
  planDescription: null,
  servicesProvided: null,
  targetValue: null,
  targetDate: null,
  status: 'Scheduled',
  caseConferenceDate: null,
  createdAt: null,
  updatedAt: null,
};

const CONFERENCE_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'] as const;

/** Status values used in seeded intervention_plans data (distinct from conference workflow labels). */
const INTERVENTION_PLAN_SEED_STATUSES = ['On Hold', 'In Progress', 'Open', 'Achieved', 'Closed'] as const;

/** Compare labels from API/seed vs UI (case, hyphens, spacing). */
function normalizeForFilterMatch(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** YYYY-MM-DD for comparisons (handles ISO datetimes from the API). */
function toIsoDateOnly(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const m = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function coerceHomeVisitation(raw: Record<string, unknown>): HomeVisitation {
  const g = (c: string, p: string): string | null => {
    const v = raw[c] ?? raw[p];
    if (v === undefined || v === null) return null;
    return String(v);
  };
  return {
    visitationId: g('visitationId', 'VisitationId'),
    residentId: g('residentId', 'ResidentId'),
    visitDate: g('visitDate', 'VisitDate'),
    socialWorker: g('socialWorker', 'SocialWorker'),
    visitType: g('visitType', 'VisitType'),
    locationVisited: g('locationVisited', 'LocationVisited'),
    familyMembersPresent: g('familyMembersPresent', 'FamilyMembersPresent'),
    purpose: g('purpose', 'Purpose'),
    observations: g('observations', 'Observations'),
    familyCooperationLevel: g('familyCooperationLevel', 'FamilyCooperationLevel'),
    safetyConcernsNoted: g('safetyConcernsNoted', 'SafetyConcernsNoted'),
    followUpNeeded: g('followUpNeeded', 'FollowUpNeeded'),
    followUpNotes: g('followUpNotes', 'FollowUpNotes'),
    visitOutcome: g('visitOutcome', 'VisitOutcome'),
  };
}

function coerceInterventionPlan(raw: Record<string, unknown>): InterventionPlan {
  const g = (c: string, p: string): string | null => {
    const v = raw[c] ?? raw[p];
    if (v === undefined || v === null) return null;
    return String(v);
  };
  const tv = raw.targetValue ?? raw.TargetValue;
  let targetValue: number | null = null;
  if (tv !== undefined && tv !== null && tv !== '') {
    const n = typeof tv === 'number' ? tv : Number(tv);
    targetValue = Number.isFinite(n) ? n : null;
  }
  return {
    planId: g('planId', 'PlanId'),
    residentId: g('residentId', 'ResidentId'),
    planCategory: g('planCategory', 'PlanCategory'),
    planDescription: g('planDescription', 'PlanDescription'),
    servicesProvided: g('servicesProvided', 'ServicesProvided'),
    targetValue,
    targetDate: g('targetDate', 'TargetDate'),
    status: g('status', 'Status'),
    caseConferenceDate: g('caseConferenceDate', 'CaseConferenceDate'),
    createdAt: g('createdAt', 'CreatedAt'),
    updatedAt: g('updatedAt', 'UpdatedAt'),
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeVisitationConferences() {
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [visits, setVisits] = useState<HomeVisitation[]>([]);
  const [plans, setPlans] = useState<InterventionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  /** Narrow lists for the selected resident (main column). */
  const [visitTypeFilter, setVisitTypeFilter] = useState('');
  const [visitDateFrom, setVisitDateFrom] = useState('');
  const [visitDateTo, setVisitDateTo] = useState('');
  const [visitContentSearch, setVisitContentSearch] = useState('');
  const [visitsEmergencyOnly, setVisitsEmergencyOnly] = useState(false);

  const [planStatusFilter, setPlanStatusFilter] = useState('');
  const [planDateFrom, setPlanDateFrom] = useState('');
  const [planDateTo, setPlanDateTo] = useState('');
  const [planContentSearch, setPlanContentSearch] = useState('');

  const [visitPage, setVisitPage] = useState(1);
  const [visitPageSize, setVisitPageSize] = useState(10);
  const [planPage, setPlanPage] = useState(1);
  const [planPageSize, setPlanPageSize] = useState(10);

  const [showVisitForm, setShowVisitForm] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT);
  const [savingVisit, setSavingVisit] = useState(false);

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [savingPlan, setSavingPlan] = useState(false);

  const [deleteVisitId, setDeleteVisitId] = useState<string | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);

  const loadResidents = useCallback(() => {
    get<{ residentId: string; assignedSocialWorker?: string }[]>('/api/Residents')
      .then((data) => {
        const opts = data
          .filter((r) => r.residentId)
          .map((r) => ({
            residentId: r.residentId,
            label: `${r.residentId}${r.assignedSocialWorker ? ` — ${r.assignedSocialWorker}` : ''}`,
          }))
          .sort((a, b) => a.residentId.localeCompare(b.residentId, undefined, { numeric: true }));
        setResidents(opts);
      })
      .catch(() => setResidents([]));
  }, []);

  const loadResidentData = useCallback(() => {
    if (!selectedResident) {
      setVisits([]);
      setPlans([]);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([
      get<unknown[]>('/api/HomeVisitations'),
      get<unknown[]>('/api/InterventionPlans'),
    ])
      .then(([vData, pData]) => {
        const rid = String(selectedResident);
        const v = (Array.isArray(vData) ? vData : [])
          .map((row) => coerceHomeVisitation(row as Record<string, unknown>))
          .filter((x) => String(x.residentId ?? '') === rid)
          .sort((a, b) => (b.visitDate ?? '').localeCompare(a.visitDate ?? ''));
        const p = (Array.isArray(pData) ? pData : [])
          .map((row) => coerceInterventionPlan(row as Record<string, unknown>))
          .filter((x) => String(x.residentId ?? '') === rid);
        setVisits(v);
        setPlans(p);
      })
      .catch(() => {
        setError('Failed to load data.');
        setVisits([]);
        setPlans([]);
      })
      .finally(() => setLoading(false));
  }, [selectedResident]);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  useEffect(() => {
    loadResidentData();
  }, [loadResidentData]);

  const today = todayIsoDate();

  const filteredVisits = useMemo(() => {
    const q = visitContentSearch.trim().toLowerCase();
    return visits.filter((v) => {
      if (visitsEmergencyOnly && normalizeForFilterMatch(v.visitType) !== 'emergency') return false;
      if (visitTypeFilter && normalizeForFilterMatch(v.visitType) !== normalizeForFilterMatch(visitTypeFilter)) {
        return false;
      }
      const vd = toIsoDateOnly(v.visitDate);
      if (visitDateFrom && vd && vd < visitDateFrom) return false;
      if (visitDateTo && vd && vd > visitDateTo) return false;
      if (q) {
        const hay = [
          v.socialWorker,
          v.locationVisited,
          v.observations,
          v.purpose,
          v.safetyConcernsNoted,
          v.followUpNotes,
          v.visitOutcome,
          v.familyMembersPresent,
          v.visitType,
          v.followUpNeeded,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visits, visitsEmergencyOnly, visitTypeFilter, visitDateFrom, visitDateTo, visitContentSearch]);

  const filteredPlans = useMemo(() => {
    const q = planContentSearch.trim().toLowerCase();
    const hasDateBounds = Boolean(planDateFrom || planDateTo);
    return plans.filter((p) => {
      if (planStatusFilter && normalizeForFilterMatch(p.status) !== normalizeForFilterMatch(planStatusFilter)) {
        return false;
      }
      if (q) {
        const cdIso = toIsoDateOnly(p.caseConferenceDate);
        const hay = [
          p.planDescription,
          p.servicesProvided,
          p.planCategory,
          p.status,
          p.caseConferenceDate,
          cdIso,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const cd = toIsoDateOnly(p.caseConferenceDate);
      if (hasDateBounds) {
        if (!cd) return false;
        if (planDateFrom && cd < planDateFrom) return false;
        if (planDateTo && cd > planDateTo) return false;
      }
      return true;
    });
  }, [plans, planStatusFilter, planContentSearch, planDateFrom, planDateTo]);

  const visitTotalPages = Math.max(1, Math.ceil(filteredVisits.length / visitPageSize));
  const safeVisitPage   = Math.min(visitPage, visitTotalPages);
  const paginatedVisits = useMemo(
    () => filteredVisits.slice((safeVisitPage - 1) * visitPageSize, safeVisitPage * visitPageSize),
    [filteredVisits, safeVisitPage, visitPageSize]
  );

  const planTotalPages = Math.max(1, Math.ceil(filteredPlans.length / planPageSize));
  const safePlanPage   = Math.min(planPage, planTotalPages);
  const paginatedPlans = useMemo(
    () => filteredPlans.slice((safePlanPage - 1) * planPageSize, safePlanPage * planPageSize),
    [filteredPlans, safePlanPage, planPageSize]
  );

  const planStatusFilterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of CONFERENCE_STATUSES) set.add(s);
    for (const s of INTERVENTION_PLAN_SEED_STATUSES) set.add(s);
    for (const p of plans) {
      const st = p.status?.trim();
      if (st) set.add(st);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [plans]);

  const { upcomingConferences, pastConferences, otherPlans } = useMemo(() => {
    const withDate = paginatedPlans.filter((p) => toIsoDateOnly(p.caseConferenceDate) !== '');
    const upcoming = withDate
      .filter((p) => toIsoDateOnly(p.caseConferenceDate) >= today)
      .sort((a, b) => toIsoDateOnly(a.caseConferenceDate).localeCompare(toIsoDateOnly(b.caseConferenceDate)));
    const past = withDate
      .filter((p) => toIsoDateOnly(p.caseConferenceDate) < today)
      .sort((a, b) => toIsoDateOnly(b.caseConferenceDate).localeCompare(toIsoDateOnly(a.caseConferenceDate)));
    const other = paginatedPlans
      .filter((p) => toIsoDateOnly(p.caseConferenceDate) === '')
      .sort((a, b) => {
        const da = a.createdAt ?? '';
        const db = b.createdAt ?? '';
        return db.localeCompare(da);
      });
    return { upcomingConferences: upcoming, pastConferences: past, otherPlans: other };
  }, [filteredPlans, today]);

  const listFiltersActive =
    visitTypeFilter ||
    visitDateFrom ||
    visitDateTo ||
    visitContentSearch.trim() ||
    visitsEmergencyOnly ||
    planStatusFilter ||
    planDateFrom ||
    planDateTo ||
    planContentSearch.trim();

  function clearListFilters() {
    setVisitTypeFilter('');
    setVisitDateFrom('');
    setVisitDateTo('');
    setVisitContentSearch('');
    setVisitsEmergencyOnly(false);
    setPlanStatusFilter('');
    setPlanDateFrom('');
    setPlanDateTo('');
    setPlanContentSearch('');
    setVisitPage(1);
    setPlanPage(1);
  }

  const filteredResidents = searchQuery
    ? residents.filter((r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : residents;

  function updateVisitField(field: keyof typeof visitForm, value: string) {
    setVisitForm((prev) => ({ ...prev, [field]: value || null }));
  }

  function updatePlanField(field: keyof typeof planForm, value: string | number | null) {
    setPlanForm((prev) => ({ ...prev, [field]: value }));
  }

  function openNewVisit() {
    setVisitForm({ ...EMPTY_VISIT, residentId: selectedResident });
    setEditingVisitId(null);
    setShowVisitForm(true);
    setShowPlanForm(false);
    setError('');
  }

  function openEditVisit(v: HomeVisitation) {
    setVisitForm({
      residentId: v.residentId,
      visitDate: v.visitDate,
      socialWorker: v.socialWorker,
      visitType: v.visitType,
      locationVisited: v.locationVisited,
      familyMembersPresent: v.familyMembersPresent,
      purpose: v.purpose,
      observations: v.observations,
      familyCooperationLevel: v.familyCooperationLevel,
      safetyConcernsNoted: v.safetyConcernsNoted,
      followUpNeeded: v.followUpNeeded,
      followUpNotes: v.followUpNotes,
      visitOutcome: v.visitOutcome,
    });
    setEditingVisitId(v.visitationId!);
    setShowVisitForm(true);
    setShowPlanForm(false);
    setError('');
  }

  function openNewConference() {
    setPlanForm({ ...EMPTY_PLAN, residentId: selectedResident });
    setEditingPlanId(null);
    setShowPlanForm(true);
    setShowVisitForm(false);
    setError('');
  }

  function openEditPlan(p: InterventionPlan) {
    setPlanForm({
      residentId: p.residentId,
      planCategory: p.planCategory,
      planDescription: p.planDescription,
      servicesProvided: p.servicesProvided,
      targetValue: p.targetValue,
      targetDate: p.targetDate,
      status: p.status,
      caseConferenceDate: p.caseConferenceDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
    setEditingPlanId(p.planId!);
    setShowPlanForm(true);
    setShowVisitForm(false);
    setError('');
  }

  async function saveVisit() {
    if (!visitForm.visitDate || !visitForm.socialWorker) {
      setError('Visit date and social worker are required.');
      return;
    }
    setSavingVisit(true);
    setError('');
    try {
      if (editingVisitId) {
        await put('/api/HomeVisitations/' + editingVisitId, { visitationId: editingVisitId, ...visitForm });
      } else {
        const id = `HV-${Date.now()}`;
        await post('/api/HomeVisitations', { visitationId: id, ...visitForm });
      }
      setShowVisitForm(false);
      setEditingVisitId(null);
      loadResidentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save home visit.');
    } finally {
      setSavingVisit(false);
    }
  }

  async function savePlan() {
    if (!planForm.caseConferenceDate) {
      setError('Case conference date is required.');
      return;
    }
    setSavingPlan(true);
    setError('');
    try {
      const nowIso = new Date().toISOString();
      if (editingPlanId) {
        await put('/api/InterventionPlans/' + editingPlanId, { planId: editingPlanId, ...planForm, updatedAt: nowIso });
      } else {
        const id = `IP-${Date.now()}`;
        await post('/api/InterventionPlans', { planId: id, ...planForm, createdAt: nowIso, updatedAt: nowIso });
      }
      setShowPlanForm(false);
      setEditingPlanId(null);
      loadResidentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save case conference record.');
    } finally {
      setSavingPlan(false);
    }
  }

  async function deleteVisit(id: string) {
    try {
      await api('/api/HomeVisitations/' + id, { method: 'DELETE' });
      setDeleteVisitId(null);
      loadResidentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete visit.');
    }
  }

  async function deletePlan(id: string) {
    try {
      await api('/api/InterventionPlans/' + id, { method: 'DELETE' });
      setDeletePlanId(null);
      loadResidentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan.');
    }
  }

  function formatShortDate(d: string | null) {
    const iso = toIsoDateOnly(d);
    if (!iso) return d ? String(d) : '—';
    const [y, m, day] = iso.split('-').map(Number);
    if (!y || !m || !day) return String(d);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function renderVisitCard(v: HomeVisitation) {
    const emergency = normalizeForFilterMatch(v.visitType) === 'emergency';
    return (
      <div key={v.visitationId} className="pr-card hvc-card--compact">
        <div className="pr-card__top">
          <div className="pr-card__date-badge">{formatShortDate(v.visitDate)}</div>
          <div className="pr-card__meta">
            {v.visitType && (
              <span className={`pr-tag ${emergency ? 'hvc-tag-emergency' : ''}`}>{v.visitType}</span>
            )}
          </div>
          <div className="pr-card__actions">
            <button type="button" className="pr-icon-btn" title="Edit" onClick={() => openEditVisit(v)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {deleteVisitId === v.visitationId ? (
              <>
                <button type="button" className="pr-icon-btn pr-icon-btn--danger" onClick={() => deleteVisit(v.visitationId!)}>
                  Yes
                </button>
                <button type="button" className="pr-icon-btn" onClick={() => setDeleteVisitId(null)}>
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pr-icon-btn pr-icon-btn--danger"
                title="Delete"
                onClick={() => setDeleteVisitId(v.visitationId!)}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="pr-card__worker">
          <strong>Social worker:</strong> {v.socialWorker ?? '—'}
        </div>
        {v.locationVisited && (
          <div className="pr-card__section">
            <h4>Location</h4>
            <p>{v.locationVisited}</p>
          </div>
        )}
        {v.observations && (
          <div className="pr-card__section">
            <h4>Home environment & observations</h4>
            <p>{v.observations}</p>
          </div>
        )}
        {v.familyCooperationLevel && (
          <div className="pr-card__footer-fields">
            <div className="pr-card__footer-field">
              <span className="pr-card__footer-label">Cooperation:</span>
              <span>{v.familyCooperationLevel}</span>
            </div>
          </div>
        )}
        {v.safetyConcernsNoted && (
          <div className="pr-card__footer-field pr-card__footer-field--concern" style={{ marginTop: 8 }}>
            <span className="pr-card__footer-label">Safety:</span>
            <span>{v.safetyConcernsNoted}</span>
          </div>
        )}
        {(v.followUpNeeded || v.followUpNotes) && (
          <div className="pr-card__section">
            <h4>Follow-up</h4>
            <p>
              {v.followUpNeeded && <span>Needed: {v.followUpNeeded}. </span>}
              {v.followUpNotes}
            </p>
          </div>
        )}
        {v.visitOutcome && (
          <div className="pr-card__section">
            <h4>Outcome</h4>
            <p>{v.visitOutcome}</p>
          </div>
        )}
      </div>
    );
  }

  function renderPlanCard(p: InterventionPlan, variant: 'upcoming' | 'past' | 'other') {
    const badgeClass = variant === 'upcoming' ? 'pr-card__date-badge hvc-badge--upcoming' : 'pr-card__date-badge hvc-badge--past';
    return (
      <div key={p.planId} className="pr-card hvc-card--compact">
        <div className="pr-card__top">
          <div className={badgeClass}>
            {p.caseConferenceDate ? formatShortDate(p.caseConferenceDate) : 'Plan record'}
          </div>
          <div className="pr-card__meta">
            {p.status && <span className="pr-tag">{p.status}</span>}
            {p.planCategory && <span className="pr-tag pr-tag--group">{p.planCategory}</span>}
          </div>
          <div className="pr-card__actions">
            <button type="button" className="pr-icon-btn" title="Edit" onClick={() => openEditPlan(p)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {deletePlanId === p.planId ? (
              <>
                <button type="button" className="pr-icon-btn pr-icon-btn--danger" onClick={() => deletePlan(p.planId!)}>
                  Yes
                </button>
                <button type="button" className="pr-icon-btn" onClick={() => setDeletePlanId(null)}>
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pr-icon-btn pr-icon-btn--danger"
                title="Delete"
                onClick={() => setDeletePlanId(p.planId!)}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {p.planDescription && (
          <div className="pr-card__section">
            <h4>Notes / agenda</h4>
            <p>{p.planDescription}</p>
          </div>
        )}
        {p.servicesProvided && (
          <div className="pr-card__section">
            <h4>Decisions & services</h4>
            <p>{p.servicesProvided}</p>
          </div>
        )}
        {p.targetDate && (
          <div className="pr-card__footer-fields">
            <div className="pr-card__footer-field">
              <span className="pr-card__footer-label">Target date:</span>
              <span>{formatShortDate(p.targetDate)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pr-container hvc-page">
      <div className="pr-selector">
        <div className="pr-selector__header">
          <h3>Select resident</h3>
          {selectedResident && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-add pr-add-btn" onClick={openNewVisit}>
                + Log visit
              </button>
              <button type="button" className="btn-add pr-add-btn" onClick={openNewConference}>
                + Case conference
              </button>
            </div>
          )}
        </div>
        <div className="search-bar pr-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Search by resident ID or social worker…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="pr-resident-list">
          {filteredResidents.map((r) => (
            <button
              key={r.residentId}
              type="button"
              className={`pr-resident-item${selectedResident === r.residentId ? ' active' : ''}`}
              onClick={() => {
                setSelectedResident(r.residentId);
                setShowVisitForm(false);
                setShowPlanForm(false);
                setVisitPage(1);
                setPlanPage(1);
              }}
            >
              <span className="pr-resident-item__id">{r.residentId}</span>
            </button>
          ))}
          {filteredResidents.length === 0 && <p className="pr-empty">No residents found.</p>}
        </div>
      </div>

      <div className="pr-main">
        {!selectedResident && (
          <div className="pr-placeholder">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <p>Choose a resident to log home visits and review case conferences.</p>
          </div>
        )}

        {selectedResident && loading && (
          <div className="pr-placeholder">
            <p>Loading…</p>
          </div>
        )}

        {error && <div className="pr-error">{error}</div>}

        {showVisitForm && (
          <div className="pr-form-card">
            <div className="pr-form-card__header">
              <h3>{editingVisitId ? 'Edit home visit' : 'Log home / field visit'}</h3>
              <button type="button" className="pr-close-btn" onClick={() => { setShowVisitForm(false); setEditingVisitId(null); setError(''); }}>
                ✕
              </button>
            </div>
            <div className="pr-form-grid">
              <div className="pr-form-field">
                <label>Visit date *</label>
                <input
                  type="date"
                  value={visitForm.visitDate ?? ''}
                  onChange={(e) => updateVisitField('visitDate', e.target.value)}
                />
              </div>
              <div className="pr-form-field">
                <label>Social worker *</label>
                <input
                  type="text"
                  value={visitForm.socialWorker ?? ''}
                  onChange={(e) => updateVisitField('socialWorker', e.target.value)}
                  placeholder="Staff name"
                />
              </div>
              <div className="pr-form-field">
                <label>Visit type</label>
                <select value={visitForm.visitType ?? ''} onChange={(e) => updateVisitField('visitType', e.target.value)}>
                  <option value="">Select…</option>
                  {VISIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pr-form-field">
                <label>Family cooperation</label>
                <select
                  value={visitForm.familyCooperationLevel ?? ''}
                  onChange={(e) => updateVisitField('familyCooperationLevel', e.target.value)}
                >
                  <option value="">Select…</option>
                  {COOPERATION_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Location visited</label>
              <input
                type="text"
                value={visitForm.locationVisited ?? ''}
                onChange={(e) => updateVisitField('locationVisited', e.target.value)}
                placeholder="Address or area description"
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Family members present</label>
              <input
                type="text"
                value={visitForm.familyMembersPresent ?? ''}
                onChange={(e) => updateVisitField('familyMembersPresent', e.target.value)}
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Purpose of visit</label>
              <textarea
                rows={2}
                value={visitForm.purpose ?? ''}
                onChange={(e) => updateVisitField('purpose', e.target.value)}
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Observations (home environment)</label>
              <textarea
                rows={4}
                value={visitForm.observations ?? ''}
                onChange={(e) => updateVisitField('observations', e.target.value)}
                placeholder="Conditions, dynamics, supports, risks…"
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Safety concerns</label>
              <textarea
                rows={2}
                value={visitForm.safetyConcernsNoted ?? ''}
                onChange={(e) => updateVisitField('safetyConcernsNoted', e.target.value)}
              />
            </div>
            <div className="pr-form-grid">
              <div className="pr-form-field">
                <label>Follow-up needed</label>
                <select value={visitForm.followUpNeeded ?? ''} onChange={(e) => updateVisitField('followUpNeeded', e.target.value)}>
                  <option value="">Select…</option>
                  {FOLLOW_UP_NEEDED.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Follow-up actions</label>
              <textarea
                rows={3}
                value={visitForm.followUpNotes ?? ''}
                onChange={(e) => updateVisitField('followUpNotes', e.target.value)}
                placeholder="Next steps, referrals, deadlines…"
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Visit outcome</label>
              <textarea
                rows={2}
                value={visitForm.visitOutcome ?? ''}
                onChange={(e) => updateVisitField('visitOutcome', e.target.value)}
              />
            </div>
            <div className="pr-form-actions">
              <button type="button" className="btn-export" onClick={() => { setShowVisitForm(false); setEditingVisitId(null); }}>
                Cancel
              </button>
              <button type="button" className="btn-add" onClick={saveVisit} disabled={savingVisit}>
                {savingVisit ? 'Saving…' : editingVisitId ? 'Update visit' : 'Save visit'}
              </button>
            </div>
          </div>
        )}

        {showPlanForm && (
          <div className="pr-form-card">
            <div className="pr-form-card__header">
              <h3>{editingPlanId ? 'Edit case conference' : 'Schedule case conference'}</h3>
              <button type="button" className="pr-close-btn" onClick={() => { setShowPlanForm(false); setEditingPlanId(null); setError(''); }}>
                ✕
              </button>
            </div>
            <div className="pr-form-grid">
              <div className="pr-form-field">
                <label>Conference date *</label>
                <input
                  type="date"
                  value={planForm.caseConferenceDate ?? ''}
                  onChange={(e) => updatePlanField('caseConferenceDate', e.target.value || null)}
                />
              </div>
              <div className="pr-form-field">
                <label>Status</label>
                <select
                  value={planForm.status ?? ''}
                  onChange={(e) => updatePlanField('status', e.target.value || null)}
                >
                  {CONFERENCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pr-form-field">
                <label>Category</label>
                <select
                  value={planForm.planCategory ?? ''}
                  onChange={(e) => updatePlanField('planCategory', e.target.value || null)}
                >
                  <option value="">Select…</option>
                  {planForm.planCategory &&
                    !(PLAN_CATEGORIES as readonly string[]).includes(planForm.planCategory) && (
                      <option value={planForm.planCategory}>{planForm.planCategory}</option>
                    )}
                  {PLAN_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pr-form-field">
                <label>Target review date</label>
                <input
                  type="date"
                  value={planForm.targetDate ?? ''}
                  onChange={(e) => updatePlanField('targetDate', e.target.value || null)}
                />
              </div>
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Agenda / summary</label>
              <textarea
                rows={4}
                value={planForm.planDescription ?? ''}
                onChange={(e) => updatePlanField('planDescription', e.target.value || null)}
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Decisions & services discussed</label>
              <textarea
                rows={3}
                value={planForm.servicesProvided ?? ''}
                onChange={(e) => updatePlanField('servicesProvided', e.target.value || null)}
              />
            </div>
            <div className="pr-form-actions">
              <button type="button" className="btn-export" onClick={() => { setShowPlanForm(false); setEditingPlanId(null); }}>
                Cancel
              </button>
              <button type="button" className="btn-add" onClick={savePlan} disabled={savingPlan}>
                {savingPlan ? 'Saving…' : editingPlanId ? 'Update conference' : 'Save conference'}
              </button>
            </div>
          </div>
        )}

        {selectedResident && !loading && !showVisitForm && !showPlanForm && (
          <>
            <div className="hvc-hero-strip">
              <div className="hvc-hero-strip__eyebrow">Field & family engagement</div>
              <p>
                Document home and field visits with structured visit types and safety notes. Case conferences are stored as
                intervention plans with a conference date so you can see what is coming up and what has already occurred for
                this resident.
              </p>
            </div>

            <div className="hvc-filters" aria-label="Filter visits and conferences">
              <div className="hvc-filters__head">
                <span className="hvc-filters__title">Filter results</span>
                {listFiltersActive && (
                  <button type="button" className="hvc-filters__clear" onClick={clearListFilters}>
                    Clear all filters
                  </button>
                )}
              </div>
              <div className="hvc-filters__grid">
                <div className="hvc-filters__group">
                  <span className="hvc-filters__label">Visits</span>
                  <div className="hvc-filters__row">
                    <select
                      className="hvc-filters__control"
                      value={visitTypeFilter}
                      onChange={(e) => setVisitTypeFilter(e.target.value)}
                      aria-label="Visit type"
                    >
                      <option value="">All visit types</option>
                      {VISIT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <label className="hvc-filters__check">
                      <input
                        type="checkbox"
                        checked={visitsEmergencyOnly}
                        onChange={(e) => setVisitsEmergencyOnly(e.target.checked)}
                      />
                      Emergency only
                    </label>
                  </div>
                  <div className="hvc-filters__row hvc-filters__row--dates">
                    <div className="hvc-filters__field">
                      <label htmlFor="hvc-visit-from">From</label>
                      <input
                        id="hvc-visit-from"
                        className="hvc-filters__control"
                        type="date"
                        value={visitDateFrom}
                        onChange={(e) => setVisitDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="hvc-filters__field">
                      <label htmlFor="hvc-visit-to">To</label>
                      <input
                        id="hvc-visit-to"
                        className="hvc-filters__control"
                        type="date"
                        value={visitDateTo}
                        onChange={(e) => setVisitDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="hvc-filters__field hvc-filters__field--full">
                    <label htmlFor="hvc-visit-search">Search in visit notes</label>
                    <input
                      id="hvc-visit-search"
                      className="hvc-filters__control"
                      type="search"
                      placeholder="Worker, location, observations, safety, follow-up…"
                      value={visitContentSearch}
                      onChange={(e) => setVisitContentSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="hvc-filters__group">
                  <span className="hvc-filters__label">Case conferences</span>
                  <div className="hvc-filters__row">
                    <select
                      className="hvc-filters__control"
                      value={planStatusFilter}
                      onChange={(e) => setPlanStatusFilter(e.target.value)}
                      aria-label="Conference status"
                    >
                      <option value="">All statuses</option>
                      {planStatusFilterOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="hvc-filters__row hvc-filters__row--dates">
                    <div className="hvc-filters__field">
                      <label htmlFor="hvc-plan-from">Conference from</label>
                      <input
                        id="hvc-plan-from"
                        className="hvc-filters__control"
                        type="date"
                        value={planDateFrom}
                        onChange={(e) => setPlanDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="hvc-filters__field">
                      <label htmlFor="hvc-plan-to">Conference to</label>
                      <input
                        id="hvc-plan-to"
                        className="hvc-filters__control"
                        type="date"
                        value={planDateTo}
                        onChange={(e) => setPlanDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="hvc-filters__hint">
                    Date range applies to scheduled conference dates. Plans without a conference date are hidden while a range
                    is set.
                  </p>
                  <div className="hvc-filters__field hvc-filters__field--full">
                    <label htmlFor="hvc-plan-search">Search conferences</label>
                    <input
                      id="hvc-plan-search"
                      className="hvc-filters__control"
                      type="search"
                      placeholder="Agenda, decisions, category…"
                      value={planContentSearch}
                      onChange={(e) => setPlanContentSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="hvc-two-col">
              <div className="hvc-panel">
                <div className="hvc-panel__head">
                  <div className="hvc-panel__head-main">
                    <h3>Home & field visits</h3>
                    <span className="hvc-panel__count">
                      {visits.length === 0
                        ? '0 visits'
                        : `${filteredVisits.length} of ${visits.length} shown`}
                    </span>
                  </div>
                  <button type="button" className="btn-add" onClick={openNewVisit}>
                    + Log visit
                  </button>
                </div>
                {visits.length === 0 ? (
                  <p className="pr-empty" style={{ padding: '1rem 0' }}>
                    No visits logged yet for this resident.
                  </p>
                ) : filteredVisits.length === 0 ? (
                  <p className="pr-empty" style={{ padding: '1rem 0' }}>
                    No visits match the current filters. Try clearing filters or widening the date range.
                  </p>
                ) : (
                  <>
                    {paginatedVisits.map((v) => renderVisitCard(v))}
                    <PaginationControls
                      currentPage={safeVisitPage}
                      totalPages={visitTotalPages}
                      pageSize={visitPageSize}
                      onPageChange={setVisitPage}
                      onPageSizeChange={(s) => { setVisitPageSize(s); setVisitPage(1); }}
                      label={`Showing ${filteredVisits.length === 0 ? 0 : (safeVisitPage - 1) * visitPageSize + 1}–${Math.min(safeVisitPage * visitPageSize, filteredVisits.length)} of ${filteredVisits.length}`}
                    />
                  </>
                )}
              </div>

              <div className="hvc-panel">
                <div className="hvc-panel__head">
                  <div className="hvc-panel__head-main">
                    <h3>Case conferences</h3>
                    <span className="hvc-panel__count">
                      {plans.length === 0
                        ? '0 records'
                        : `${filteredPlans.length} of ${plans.length} shown`}
                    </span>
                  </div>
                  <button type="button" className="btn-add" onClick={openNewConference}>
                    + Add conference
                  </button>
                </div>

                {plans.length > 0 && filteredPlans.length === 0 ? (
                  <p className="pr-empty" style={{ padding: '0.75rem 0' }}>
                    No case conferences or intervention plans match the current filters. Adjust filters or use &quot;Clear all
                    filters&quot;.
                  </p>
                ) : (
                  <>
                    <div className="hvc-subhead">Upcoming</div>
                    {upcomingConferences.length === 0 ? (
                      <p className="pr-empty" style={{ padding: '0.5rem 0' }}>
                        No scheduled conferences on or after today
                        {listFiltersActive ? ' that match filters' : ''}.
                      </p>
                    ) : (
                      upcomingConferences.map((p) => renderPlanCard(p, 'upcoming'))
                    )}

                    <div className="hvc-subhead">History</div>
                    {pastConferences.length === 0 ? (
                      <p className="pr-empty" style={{ padding: '0.5rem 0' }}>
                        No past conference dates recorded
                        {listFiltersActive ? ' that match filters' : ''}.
                      </p>
                    ) : (
                      pastConferences.map((p) => renderPlanCard(p, 'past'))
                    )}

                    {otherPlans.length > 0 && (
                      <>
                        <div className="hvc-subhead">Other intervention plans (no conference date)</div>
                        {otherPlans.map((p) => renderPlanCard(p, 'other'))}
                      </>
                    )}

                    {filteredPlans.length > 0 && (
                      <PaginationControls
                        currentPage={safePlanPage}
                        totalPages={planTotalPages}
                        pageSize={planPageSize}
                        onPageChange={setPlanPage}
                        onPageSizeChange={(s) => { setPlanPageSize(s); setPlanPage(1); }}
                        label={`Showing ${filteredPlans.length === 0 ? 0 : (safePlanPage - 1) * planPageSize + 1}–${Math.min(safePlanPage * planPageSize, filteredPlans.length)} of ${filteredPlans.length}`}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
