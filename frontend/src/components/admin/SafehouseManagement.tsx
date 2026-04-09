// src/components/admin/SafehouseManagement.tsx
import { useEffect, useState } from 'react';
import { get, post, put, del } from '../../lib/api';

interface Safehouse {
  safehouseId: string | null;
  safehouseCode: string | null;
  name: string | null;
  region: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  openDate: string | null;
  status: string | null;
  capacityGirls: string | null;
  capacityStaff: string | null;
  currentOccupancy: string | null;
  notes: string | null;
}

const STATUS_CLASS: Record<string, string> = {
  Active:   'badge-prog',
  Inactive: 'badge-re',
  Closed:   'badge-risk',
};

const FIELDS: { label: string; key: keyof Safehouse }[] = [
  { label: 'Safehouse ID',       key: 'safehouseId' },
  { label: 'Safehouse Code',     key: 'safehouseCode' },
  { label: 'Name',               key: 'name' },
  { label: 'Region',             key: 'region' },
  { label: 'City',               key: 'city' },
  { label: 'Province',           key: 'province' },
  { label: 'Country',            key: 'country' },
  { label: 'Open Date',          key: 'openDate' },
  { label: 'Status',             key: 'status' },
  { label: 'Capacity (Girls)',   key: 'capacityGirls' },
  { label: 'Capacity (Staff)',   key: 'capacityStaff' },
  { label: 'Current Occupancy',  key: 'currentOccupancy' },
  { label: 'Notes',              key: 'notes' },
];

const EDITABLE_FIELDS: { label: string; key: keyof Safehouse; type?: string; options?: string[] }[] = [
  { label: 'Safehouse Code',    key: 'safehouseCode' },
  { label: 'Name',              key: 'name' },
  { label: 'Region',            key: 'region' },
  { label: 'City',              key: 'city' },
  { label: 'Province',          key: 'province' },
  { label: 'Country',           key: 'country' },
  { label: 'Open Date',         key: 'openDate', type: 'date' },
  { label: 'Status',            key: 'status', options: ['Active', 'Inactive', 'Closed'] },
  { label: 'Capacity (Girls)',  key: 'capacityGirls', type: 'number' },
  { label: 'Capacity (Staff)',  key: 'capacityStaff', type: 'number' },
  { label: 'Notes',             key: 'notes' },
];

function hasValue(v: string | null): v is string {
  return v !== null && v.trim() !== '';
}

export default function SafehouseManagement() {
  const [safehouses, setSafehouses]   = useState<Safehouse[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [regionFilter, setRegionFilter]   = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [editingSafehouse, setEditingSafehouse] = useState<Safehouse | null>(null);
  const [editForm, setEditForm]             = useState<Partial<Safehouse>>({});
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState<string | null>(null);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [addForm, setAddForm]               = useState<Partial<Safehouse>>({});
  const [addError, setAddError]             = useState<string | null>(null);
  const [adding, setAdding]                 = useState(false);

  useEffect(() => {
    Promise.all([
      get<Safehouse[]>('/api/Safehouses'),
      get<{ safehouseId: string | null }[]>('/api/Residents'),
    ])
      .then(([houses, residents]) => {
        const counts: Record<string, number> = {};
        for (const r of residents) {
          if (r.safehouseId) counts[r.safehouseId] = (counts[r.safehouseId] ?? 0) + 1;
        }
        setSafehouses(houses.map((h) => ({
          ...h,
          currentOccupancy: String(counts[h.safehouseId ?? ''] ?? 0),
        })));
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      });
  }, []);

  function handleEditOpen(s: Safehouse) {
    setEditingSafehouse(s);
    setEditForm({ ...s });
    setSaveError(null);
  }

  function handleEditClose() {
    setEditingSafehouse(null);
    setEditForm({});
    setSaveError(null);
  }

  async function handleEditSave() {
    if (!editingSafehouse?.safehouseId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await put(`/api/Safehouses/${editingSafehouse.safehouseId}`, {
        ...editForm,
        safehouseId: editingSafehouse.safehouseId,
      });
      setSafehouses((prev) =>
        prev.map((s) =>
          s.safehouseId === editingSafehouse.safehouseId
            ? { ...s, ...editForm }
            : s
        )
      );
      handleEditClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function nextSafehouseCode(): string {
    const codes = safehouses.map((s) => s.safehouseCode ?? '').filter(Boolean);
    if (codes.length === 0) return 'SH001';
    let bestPrefix = '';
    let bestNum = 0;
    let bestPad = 1;
    for (const code of codes) {
      const match = code.match(/^(.*?)(\d+)$/);
      if (match) {
        const n = Number(match[2]);
        if (n > bestNum) {
          bestNum = n;
          bestPrefix = match[1];
          bestPad = match[2].length;
        }
      }
    }
    const next = bestNum + 1;
    return bestPrefix + String(next).padStart(bestPad, '0');
  }

  function handleAddOpen() {
    const maxId = safehouses.reduce((max, s) => {
      const n = Number(s.safehouseId ?? '');
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    setAddForm({ safehouseId: String(maxId + 1), safehouseCode: nextSafehouseCode(), currentOccupancy: '0' });
    setAddError(null);
    setShowAddForm(true);
  }

  async function handleAddSave() {
    if (!addForm.safehouseId) return;
    setAdding(true);
    setAddError(null);
    try {
      const created = await post<Safehouse>('/api/Safehouses', addForm);
      setSafehouses((prev) => [...prev, created]);
      setShowAddForm(false);
      setAddForm({});
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create safehouse');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await del(`/api/Safehouses/${id}`);
      setSafehouses((prev) => prev.filter((s) => s.safehouseId !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      // cancelled or failed — do nothing
    }
  }

  const filtered = safehouses
    .filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === '' ||
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.safehouseCode ?? '').toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        (s.region ?? '').toLowerCase().includes(q);
      const matchesRegion = regionFilter === '' || s.region === regionFilter;
      const occupancy = Number(s.currentOccupancy ?? '');
      const capacity  = Number(s.capacityGirls ?? '');
      const atMax = !isNaN(occupancy) && !isNaN(capacity) && capacity > 0 && occupancy >= capacity;
      const matchesCapacity =
        capacityFilter === '' ||
        (capacityFilter === 'at-max' && atMax) ||
        (capacityFilter === 'available' && !atMax);
      return matchesSearch && matchesRegion && matchesCapacity;
    })
    .sort((a, b) => {
      const idA = Number(a.safehouseId ?? '');
      const idB = Number(b.safehouseId ?? '');
      if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
      return (a.safehouseId ?? '').localeCompare(b.safehouseId ?? '');
    });

  const regions  = Array.from(new Set(safehouses.map((s) => s.region).filter(Boolean))).sort() as string[];

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <h3>Safehouse Management</h3>
        <div className="table-right">
          <button className="btn-add" onClick={handleAddOpen}>+ Add Safehouse</button>
          <div className="search-bar">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, code, city, or region…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-btn"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className="filter-btn"
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <option value="">All Capacities</option>
            <option value="available">Has Availability</option>
            <option value="at-max">At Max Capacity</option>
          </select>
        </div>
      </div>

      {loading && <p style={{ padding: '1rem' }}>Loading safehouses…</p>}
      {error   && <p style={{ padding: '1rem', color: 'var(--red)' }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>City</th>
                <th>Region</th>
                <th>Occupancy</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isExpanded = expandedId === s.safehouseId;
                const visible = FIELDS.filter((f) => hasValue(s[f.key]));
                return (
                  <>
                    <tr
                      key={s.safehouseId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedId((prev) => prev === s.safehouseId ? null : s.safehouseId)}
                    >
                      <td className="resident-id">{s.safehouseId ?? '—'}</td>
                      <td style={{ fontWeight: 600 }}>{s.name ?? '—'}</td>
                      <td>{s.city ?? '—'}</td>
                      <td>{s.region ?? '—'}</td>
                      <td>
                        {hasValue(s.currentOccupancy) && hasValue(s.capacityGirls)
                          ? `${s.currentOccupancy} / ${s.capacityGirls}`
                          : '—'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[s.status ?? ''] ?? ''}`}>
                          {s.status ?? '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--gray-600)', fontSize: '0.825rem' }}>
                        {isExpanded ? '▲ collapse' : '▼ expand'}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${s.safehouseId}-detail`}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div className="detail-panel">
                            <div className="row g-3">
                              <div className="col-12">
                                <div className="detail-section__title">Safehouse Details</div>
                                <table className="table table-sm table-bordered table-striped mb-0" style={{ fontSize: '0.875rem' }}>
                                  <tbody>
                                    {visible.map((f) => (
                                      <tr key={f.key}>
                                        <td style={{ width: '45%', fontWeight: 600, color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>
                                          {f.label}
                                        </td>
                                        <td style={{ color: 'var(--gray-800)' }}>{s[f.key] as string}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                  <button
                                    className="btn-add"
                                    onClick={(e) => { e.stopPropagation(); handleEditOpen(s); }}
                                  >
                                    Edit Safehouse
                                  </button>
                                  <button
                                    className="btn-export"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(s.safehouseId!); }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-600)', padding: '2rem' }}>
                    No safehouses match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="table-footer">
            <span>Showing {filtered.length} of {safehouses.length} safehouses</span>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddForm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowAddForm(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '12px', padding: '2rem',
              width: '100%', maxWidth: '560px', maxHeight: '90vh',
              overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ marginBottom: '1.25rem', color: 'var(--navy)', fontFamily: 'DM Serif Display, serif' }}>
              Add New Safehouse
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Read-only auto-incremented ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Safehouse ID (auto)
                </label>
                <input
                  type="text"
                  value={addForm.safehouseId ?? ''}
                  readOnly
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', background: 'var(--gray-50)', color: 'var(--gray-400)' }}
                />
              </div>

              {EDITABLE_FIELDS.map((f) => {
                const isAutoCode = f.key === 'safehouseCode';
                return (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {f.label}{isAutoCode ? ' (auto)' : ''}
                    </label>
                    {f.options ? (
                      <select
                        value={(addForm[f.key] as string) ?? ''}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }}
                      >
                        <option value="">— Select —</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type ?? 'text'}
                        value={(addForm[f.key] as string) ?? ''}
                        readOnly={isAutoCode}
                        onChange={(e) => !isAutoCode && setAddForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', ...(isAutoCode ? { background: 'var(--gray-50)', color: 'var(--gray-400)' } : {}) }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {addError && (
              <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '0.75rem' }}>{addError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-export" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn-add" onClick={handleAddSave} disabled={adding}>
                {adding ? 'Creating…' : 'Create Safehouse'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSafehouse && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={handleEditClose}
        >
          <div
            style={{
              background: '#fff', borderRadius: '12px', padding: '2rem',
              width: '100%', maxWidth: '560px', maxHeight: '90vh',
              overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ marginBottom: '1.25rem', color: 'var(--navy)', fontFamily: 'DM Serif Display, serif' }}>
              Edit Safehouse — {editingSafehouse.name ?? editingSafehouse.safehouseId}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {EDITABLE_FIELDS.map((f) => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {f.label}
                  </label>
                  {f.options ? (
                    <select
                      value={(editForm[f.key] as string) ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }}
                    >
                      <option value="">— Select —</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type ?? 'text'}
                      value={(editForm[f.key] as string) ?? ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {saveError && (
              <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: '0.75rem' }}>{saveError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-export" onClick={handleEditClose}>
                Cancel
              </button>
              <button className="btn-add" onClick={handleEditSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
