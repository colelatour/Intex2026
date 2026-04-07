// src/components/admin/ResidentDirectory.tsx
import { useEffect, useState } from 'react';

interface Resident {
  residentId: string | null;
  caseControlNo: string | null;
  caseStatus: string | null;
}

const STATUS_CLASS: Record<string, string> = {
  Active:        'badge-prog',
  Closed:        'badge-re',
  'At Risk':     'badge-risk',
  Monitoring:    'badge-mon',
};

export default function ResidentDirectory() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');

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
    (r.residentId   ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.caseControlNo ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.caseStatus   ?? '').toLowerCase().includes(search.toLowerCase())
  );

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
                <th>Name / Case Control No.</th>
                <th>Case Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.residentId}>
                  <td className="resident-id">{r.residentId ?? '—'}</td>
                  <td>{r.caseControlNo ?? '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[r.caseStatus ?? ''] ?? ''}`}>
                      {r.caseStatus ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
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
