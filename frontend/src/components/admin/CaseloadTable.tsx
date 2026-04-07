// src/components/admin/CaseloadTable.tsx
import { useState } from 'react';

const RESIDENTS = [
  { id: '#RES-001', safehouse: 'House A', caseType: 'Trafficking',    worker: 'J. Santos', status: 'Progressing' },
  { id: '#RES-002', safehouse: 'House B', caseType: 'Physical Abuse', worker: 'M. Reyes',  status: 'Monitoring' },
  { id: '#RES-003', safehouse: 'House A', caseType: 'Neglect',        worker: 'J. Santos', status: 'At Risk' },
  { id: '#RES-004', safehouse: 'House C', caseType: 'Trafficking',    worker: 'L. Cruz',   status: 'Reintegration' },
  { id: '#RES-005', safehouse: 'House B', caseType: 'Sexual Abuse',   worker: 'M. Reyes',  status: 'Progressing' },
];

const STATUS_CLASS: Record<string, string> = {
  Progressing:   'badge-prog',
  Monitoring:    'badge-mon',
  'At Risk':     'badge-risk',
  Reintegration: 'badge-re',
};

export default function CaseloadTable() {
  const [search, setSearch] = useState('');

  const filtered = RESIDENTS.filter((r) =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.caseType.toLowerCase().includes(search.toLowerCase()) ||
    r.worker.toLowerCase().includes(search.toLowerCase()) ||
    r.safehouse.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <h3>Caseload Overview</h3>
        <div className="table-right">
          <div className="search-bar">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search residents, donors, records…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn">Filter ▾</button>
          <button className="filter-btn">Safehouse ▾</button>
          <button className="filter-btn">Status ▾</button>
        </div>
      </div>

      {/* Table */}
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Resident ID</th>
              <th>Safehouse</th>
              <th>Case Type</th>
              <th>Social Worker</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="resident-id">{r.id}</td>
                <td>{r.safehouse}</td>
                <td>{r.caseType}</td>
                <td>{r.worker}</td>
                <td>
                  <span className={`badge ${STATUS_CLASS[r.status]}`}>{r.status}</span>
                </td>
                <td><span className="view-link">View</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing 1–{filtered.length} of {RESIDENTS.length} residents</span>
          <span className="next-link">Next →</span>
        </div>
      </div>
    </div>
  );
}
