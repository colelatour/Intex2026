// src/components/admin/CaseloadTable.tsx
import { useState } from 'react';
import type { CaseloadRow } from '../../types/AdminDashboard';

const STATUS_CLASS: Record<string, string> = {
  Progressing:   'badge-prog',
  Monitoring:    'badge-mon',
  'At Risk':     'badge-risk',
  Reintegrated:  'badge-re',
};

interface Props {
  rows: CaseloadRow[];
  loading?: boolean;
}

export default function CaseloadTable({ rows, loading }: Props) {
  const [search, setSearch] = useState('');

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      search === '' ||
      r.residentId.toLowerCase().includes(q) ||
      (r.caseType ?? '').toLowerCase().includes(q) ||
      (r.worker ?? '').toLowerCase().includes(q) ||
      (r.safehouseName ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="table-toolbar">
        <h3>Caseload Overview</h3>
        <div className="table-right">
          <div className="search-bar">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search residents, cases, workers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Resident ID</th>
              <th>Safehouse</th>
              <th>Case Type</th>
              <th>Social Worker</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ opacity: 0.4 }}>
                    <td colSpan={5}>Loading…</td>
                  </tr>
                ))
              : filtered.map((r) => (
                  <tr key={r.residentId}>
                    <td className="resident-id">{r.residentId}</td>
                    <td>{r.safehouseName ?? r.safehouseId ?? '—'}</td>
                    <td>{r.caseType ?? '—'}</td>
                    <td>{r.worker ?? '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[r.status] ?? ''}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-600)', padding: '2rem' }}>
                  No residents match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing {filtered.length} of {rows.length} residents</span>
        </div>
      </div>
    </div>
  );
}
