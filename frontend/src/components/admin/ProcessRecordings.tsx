// src/components/admin/ProcessRecordings.tsx
import { useEffect, useState } from 'react';

import { get, post, put, api } from '../../lib/api';
import '../../styles/HomeVisitationConferences.css';

interface Recording {
  recordingId: string | null;
  residentId: string | null;
  sessionDate: string | null;
  socialWorker: string | null;
  sessionType: string | null;
  sessionDurationMinutes: string | null;
  emotionalStateObserved: string | null;
  emotionalStateEnd: string | null;
  sessionNarrative: string | null;
  interventionsApplied: string | null;
  followUpActions: string | null;
  progressNoted: string | null;
  concernsFlagged: string | null;
  referralMade: string | null;
  notesRestricted: string | null;
}

interface ResidentOption {
  residentId: string;
  label: string;
}

const EMPTY_FORM: Omit<Recording, 'recordingId'> = {
  residentId: null,
  sessionDate: null,
  socialWorker: null,
  sessionType: null,
  sessionDurationMinutes: null,
  emotionalStateObserved: null,
  emotionalStateEnd: null,
  sessionNarrative: null,
  interventionsApplied: null,
  followUpActions: null,
  progressNoted: null,
  concernsFlagged: null,
  referralMade: null,
  notesRestricted: null,
};

const SESSION_TYPES = ['Individual', 'Group'];
const EMOTIONAL_STATES = [
  'Happy', 'Calm', 'Anxious', 'Sad', 'Angry', 'Fearful',
  'Withdrawn', 'Hopeful', 'Confused', 'Neutral',
];

export default function ProcessRecordings() {
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [filterSessionType, setFilterSessionType] = useState('');
  const [filterContentSearch, setFilterContentSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // Load residents for the selector
  useEffect(() => {
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

  // Load recordings when a resident is selected
  useEffect(() => {
    if (!selectedResident) {
      setRecordings([]);
      return;
    }
    setLoading(true);
    get<Recording[]>('/api/ProcessRecordings')
      .then((data) => {
        const filtered = data
          .filter((r) => r.residentId === selectedResident)
          .sort((a, b) => {
            const da = a.sessionDate ?? '';
            const db = b.sessionDate ?? '';
            return db.localeCompare(da); // newest first
          });
        setRecordings(filtered);
      })
      .catch(() => setRecordings([]))
      .finally(() => setLoading(false));
  }, [selectedResident]);

  function openNewForm() {
    setForm({ ...EMPTY_FORM, residentId: selectedResident });
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  function openEditForm(rec: Recording) {
    setForm({
      residentId: rec.residentId,
      sessionDate: rec.sessionDate,
      socialWorker: rec.socialWorker,
      sessionType: rec.sessionType,
      sessionDurationMinutes: rec.sessionDurationMinutes,
      emotionalStateObserved: rec.emotionalStateObserved,
      emotionalStateEnd: rec.emotionalStateEnd,
      sessionNarrative: rec.sessionNarrative,
      interventionsApplied: rec.interventionsApplied,
      followUpActions: rec.followUpActions,
      progressNoted: rec.progressNoted,
      concernsFlagged: rec.concernsFlagged,
      referralMade: rec.referralMade,
      notesRestricted: rec.notesRestricted,
    });
    setEditingId(rec.recordingId!);
    setShowForm(true);
    setError('');
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError('');
  }

  async function handleSave() {
    if (!form.sessionDate || !form.socialWorker) {
      setError('Session date and social worker are required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await put('/api/ProcessRecordings/' + editingId, { recordingId: editingId, ...form });
      } else {
        const newId = `PR-${Date.now()}`;
        await post('/api/ProcessRecordings', { recordingId: newId, ...form });
      }
      closeForm();
      // Refresh
      setSelectedResident((prev) => {
        // trigger re-fetch
        setTimeout(() => setSelectedResident(prev), 0);
        return '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api('/api/ProcessRecordings/' + id, { method: 'DELETE' });
      setRecordings((prev) => prev.filter((r) => r.recordingId !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recording.');
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  // Unique social workers from loaded recordings (for filter dropdown)
  const uniqueWorkers = Array.from(
    new Set(recordings.map(r => r.socialWorker).filter(Boolean) as string[])
  ).sort();

  // Apply filters to recordings
  const filteredRecordings = recordings.filter(r => {
    if (filterDateFrom && (r.sessionDate ?? '') < filterDateFrom) return false;
    if (filterDateTo && (r.sessionDate ?? '') > filterDateTo) return false;
    if (filterWorker && r.socialWorker !== filterWorker) return false;
    if (filterSessionType && r.sessionType !== filterSessionType) return false;
    if (filterContentSearch) {
      const q = filterContentSearch.trim().toLowerCase();
      const hay = [
        r.socialWorker,
        r.sessionNarrative,
        r.interventionsApplied,
        r.followUpActions,
        r.progressNoted,
        r.concernsFlagged,
        r.referralMade,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecordings.length / PAGE_SIZE));
  const paginatedRecordings = filteredRecordings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [filterDateFrom, filterDateTo, filterWorker, filterSessionType, filterContentSearch]);

  // Reset filters when resident changes
  useEffect(() => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterWorker('');
    setFilterSessionType('');
    setFilterContentSearch('');
    setCurrentPage(1);
  }, [selectedResident]);

  const listFiltersActive = Boolean(filterDateFrom || filterDateTo || filterWorker || filterSessionType || filterContentSearch);

  function clearAllFilters() {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterWorker('');
    setFilterSessionType('');
    setFilterContentSearch('');
  }

  // Filter residents by search
  const filteredResidents = searchQuery
    ? residents.filter((r) =>
        r.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : residents;

  return (
    <div className="pr-container">
      {/* Resident selector */}
      <div className="pr-selector">
        <div className="pr-selector__header">
          <h3>Select Resident</h3>
          {selectedResident && (
            <button className="btn-add pr-add-btn" onClick={openNewForm}>
              + New Recording
            </button>
          )}
        </div>

        <div className="search-bar pr-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Search by Resident ID or Social Worker…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pr-resident-list">
          {filteredResidents.map((r) => (
            <button
              key={r.residentId}
              className={`pr-resident-item${selectedResident === r.residentId ? ' active' : ''}`}
              onClick={() => {
                setSelectedResident(r.residentId);
                setShowForm(false);
              }}
            >
              <span className="pr-resident-item__id">{r.residentId}</span>
            </button>
          ))}
          {filteredResidents.length === 0 && (
            <p className="pr-empty">No residents found.</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="pr-main">
        {!selectedResident && (
          <div className="pr-placeholder">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
            </svg>
            <p>Select a resident from the left to view their process recordings.</p>
          </div>
        )}

        {selectedResident && loading && (
          <div className="pr-placeholder">
            <p>Loading recordings…</p>
          </div>
        )}

        {error && <div className="pr-error">{error}</div>}

        {/* New / Edit form */}
        {showForm && (
          <div className="pr-form-card">
            <div className="pr-form-card__header">
              <h3>{editingId ? 'Edit Recording' : 'New Process Recording'}</h3>
              <button className="pr-close-btn" onClick={closeForm}>✕</button>
            </div>

            <div className="pr-form-grid">
              <div className="pr-form-field">
                <label>Session Date *</label>
                <input
                  type="date"
                  value={form.sessionDate ?? ''}
                  onChange={(e) => updateField('sessionDate', e.target.value)}
                />
              </div>
              <div className="pr-form-field">
                <label>Social Worker *</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={form.socialWorker ?? ''}
                  onChange={(e) => updateField('socialWorker', e.target.value)}
                />
              </div>
              <div className="pr-form-field">
                <label>Session Type</label>
                <select
                  value={form.sessionType ?? ''}
                  onChange={(e) => updateField('sessionType', e.target.value)}
                >
                  <option value="">Select…</option>
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="pr-form-field">
                <label>Duration (minutes)</label>
                <input
                  type="text"
                  placeholder="e.g. 45"
                  value={form.sessionDurationMinutes ?? ''}
                  onChange={(e) => updateField('sessionDurationMinutes', e.target.value)}
                />
              </div>
              <div className="pr-form-field">
                <label>Emotional State (Start)</label>
                <select
                  value={form.emotionalStateObserved ?? ''}
                  onChange={(e) => updateField('emotionalStateObserved', e.target.value)}
                >
                  <option value="">Select…</option>
                  {EMOTIONAL_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="pr-form-field">
                <label>Emotional State (End)</label>
                <select
                  value={form.emotionalStateEnd ?? ''}
                  onChange={(e) => updateField('emotionalStateEnd', e.target.value)}
                >
                  <option value="">Select…</option>
                  {EMOTIONAL_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pr-form-field pr-form-full">
              <label>Session Narrative</label>
              <textarea
                rows={4}
                placeholder="Describe what happened during the session…"
                value={form.sessionNarrative ?? ''}
                onChange={(e) => updateField('sessionNarrative', e.target.value)}
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Interventions Applied</label>
              <textarea
                rows={2}
                placeholder="List interventions used…"
                value={form.interventionsApplied ?? ''}
                onChange={(e) => updateField('interventionsApplied', e.target.value)}
              />
            </div>
            <div className="pr-form-field pr-form-full">
              <label>Follow-Up Actions</label>
              <textarea
                rows={2}
                placeholder="What actions should follow this session…"
                value={form.followUpActions ?? ''}
                onChange={(e) => updateField('followUpActions', e.target.value)}
              />
            </div>

            <div className="pr-form-grid">
              <div className="pr-form-field">
                <label>Progress Noted</label>
                <input
                  type="text"
                  placeholder="Summary of progress…"
                  value={form.progressNoted ?? ''}
                  onChange={(e) => updateField('progressNoted', e.target.value)}
                />
              </div>
              <div className="pr-form-field">
                <label>Concerns Flagged</label>
                <input
                  type="text"
                  placeholder="Any concerns…"
                  value={form.concernsFlagged ?? ''}
                  onChange={(e) => updateField('concernsFlagged', e.target.value)}
                />
              </div>
              <div className="pr-form-field">
                <label>Referral Made</label>
                <input
                  type="text"
                  placeholder="e.g. Referred to psychologist"
                  value={form.referralMade ?? ''}
                  onChange={(e) => updateField('referralMade', e.target.value)}
                />
              </div>
            </div>

            <div className="pr-form-actions">
              <button className="btn-export" onClick={closeForm}>Cancel</button>
              <button className="btn-add" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Recording' : 'Save Recording'}
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {selectedResident && !loading && !showForm && recordings.length === 0 && (
          <div className="pr-placeholder">
            <p>No process recordings found for this resident.</p>
            <button className="btn-add" onClick={openNewForm} style={{ marginTop: 12 }}>
              + Create First Recording
            </button>
          </div>
        )}

        {selectedResident && !loading && recordings.length > 0 && !showForm && (
          <div className="pr-timeline">
            <div className="pr-timeline__header">
              <h3>{filteredRecordings.length} Session{filteredRecordings.length !== 1 ? 's' : ''}{filteredRecordings.length !== recordings.length ? ` (of ${recordings.length})` : ''} Recorded</h3>
            </div>

            {/* Filters */}
            <div className="hvc-filters" aria-label="Filter sessions">
              <div className="hvc-filters__head">
                <span className="hvc-filters__title">Filter results</span>
                {listFiltersActive && (
                  <button type="button" className="hvc-filters__clear" onClick={clearAllFilters}>
                    Clear all filters
                  </button>
                )}
              </div>
              <div className="hvc-filters__grid">
                <div className="hvc-filters__group">
                  <span className="hvc-filters__label">Session details</span>
                  <div className="hvc-filters__row">
                    <select
                      className="hvc-filters__control"
                      value={filterSessionType}
                      onChange={e => setFilterSessionType(e.target.value)}
                      aria-label="Session type"
                    >
                      <option value="">All session types</option>
                      {SESSION_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      className="hvc-filters__control"
                      value={filterWorker}
                      onChange={e => setFilterWorker(e.target.value)}
                      aria-label="Social worker"
                    >
                      <option value="">All social workers</option>
                      {uniqueWorkers.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hvc-filters__row hvc-filters__row--dates">
                    <div className="hvc-filters__field">
                      <label htmlFor="pr-date-from">From</label>
                      <input
                        id="pr-date-from"
                        className="hvc-filters__control"
                        type="date"
                        value={filterDateFrom}
                        onChange={e => setFilterDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="hvc-filters__field">
                      <label htmlFor="pr-date-to">To</label>
                      <input
                        id="pr-date-to"
                        className="hvc-filters__control"
                        type="date"
                        value={filterDateTo}
                        onChange={e => setFilterDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="hvc-filters__field hvc-filters__field--full">
                    <label htmlFor="pr-content-search">Search in session notes</label>
                    <input
                      id="pr-content-search"
                      className="hvc-filters__control"
                      type="search"
                      placeholder="Narrative, interventions, concerns, referrals…"
                      value={filterContentSearch}
                      onChange={e => setFilterContentSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {paginatedRecordings.length === 0 && (
              <div className="pr-placeholder">
                <p>No sessions match your filters.</p>
              </div>
            )}

            {paginatedRecordings.map((rec) => (
              <div key={rec.recordingId} className="pr-card">
                <div className="pr-card__top">
                  <div className="pr-card__date-badge">
                    {rec.sessionDate
                      ? new Date(rec.sessionDate + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No date'}
                  </div>
                  <div className="pr-card__meta">
                    {rec.sessionType && (
                      <span className={`pr-tag pr-tag--${rec.sessionType?.toLowerCase()}`}>
                        {rec.sessionType}
                      </span>
                    )}
                    {rec.sessionDurationMinutes && (
                      <span className="pr-card__duration">{rec.sessionDurationMinutes} min</span>
                    )}
                  </div>
                  <div className="pr-card__actions">
                    <button className="pr-icon-btn" title="Edit" onClick={() => openEditForm(rec)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {deleteConfirm === rec.recordingId ? (
                      <>
                        <button
                          className="pr-icon-btn pr-icon-btn--danger"
                          title="Confirm delete"
                          onClick={() => handleDelete(rec.recordingId!)}
                        >
                          Yes
                        </button>
                        <button
                          className="pr-icon-btn"
                          title="Cancel"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        className="pr-icon-btn pr-icon-btn--danger"
                        title="Delete"
                        onClick={() => setDeleteConfirm(rec.recordingId!)}
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
                  <strong>Social Worker:</strong> {rec.socialWorker ?? '—'}
                </div>

                {(rec.emotionalStateObserved || rec.emotionalStateEnd) && (
                  <div className="pr-card__emotions">
                    {rec.emotionalStateObserved && (
                      <span className="pr-emotion">
                        <span className="pr-emotion__label">Start:</span> {rec.emotionalStateObserved}
                      </span>
                    )}
                    {rec.emotionalStateEnd && (
                      <span className="pr-emotion">
                        <span className="pr-emotion__label">End:</span> {rec.emotionalStateEnd}
                      </span>
                    )}
                  </div>
                )}

                {rec.sessionNarrative && (
                  <div className="pr-card__section">
                    <h4>Session Narrative</h4>
                    <p>{rec.sessionNarrative}</p>
                  </div>
                )}

                {rec.interventionsApplied && (
                  <div className="pr-card__section">
                    <h4>Interventions Applied</h4>
                    <p>{rec.interventionsApplied}</p>
                  </div>
                )}

                {rec.followUpActions && (
                  <div className="pr-card__section">
                    <h4>Follow-Up Actions</h4>
                    <p>{rec.followUpActions}</p>
                  </div>
                )}

                {(rec.progressNoted || rec.concernsFlagged || rec.referralMade) && (
                  <div className="pr-card__footer-fields">
                    {rec.progressNoted && (
                      <div className="pr-card__footer-field">
                        <span className="pr-card__footer-label">Progress:</span>
                        <span>{rec.progressNoted}</span>
                      </div>
                    )}
                    {rec.concernsFlagged && (
                      <div className="pr-card__footer-field pr-card__footer-field--concern">
                        <span className="pr-card__footer-label">Concerns:</span>
                        <span>{rec.concernsFlagged}</span>
                      </div>
                    )}
                    {rec.referralMade && (
                      <div className="pr-card__footer-field">
                        <span className="pr-card__footer-label">Referral:</span>
                        <span>{rec.referralMade}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {filteredRecordings.length > PAGE_SIZE && (
              <div className="supporter-pagination">
                <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
                <span>Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filteredRecordings.length} total</span>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
