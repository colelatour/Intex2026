// src/components/admin/SafehouseManagement.tsx
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/Safehouses`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data: Safehouse[]) => {
        setSafehouses(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch safehouses');
        setLoading(false);
      });
  }, []);

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
    </div>
  );
}
