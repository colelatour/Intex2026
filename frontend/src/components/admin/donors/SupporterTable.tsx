import { useState, useRef, useEffect } from 'react';
import { useSupporters, SupporterListItem } from '../../../hooks/useSupporters';
import PaginationControls from '../PaginationControls';

interface Props {
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const TYPES    = ['MonetaryDonor', 'InKindDonor', 'VolunteerSupporter', 'CorporatePartner'];
const STATUSES = ['Active', 'Inactive', 'Lapsed'];
const REGIONS  = ['Luzon', 'Visayas', 'Mindanao'];

export default function SupporterTable({ onSelect, onAdd }: Props) {
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [search,        setSearch]        = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [supporterType, setSupporterType] = useState('');
  const [status,        setStatus]        = useState('');
  const [region,        setRegion]        = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, loading, error } = useSupporters({
    page, pageSize, search: debouncedSearch, supporterType, status, region,
  });

  // Reset to page 1 on any filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, supporterType, status, region, pageSize]);

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="supporter-table-wrap">
      {/* Filters */}
      <div className="supporter-filters">
        <input
          className="supporter-search"
          placeholder="Search name or email…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        <select value={supporterType} onChange={e => setSupporterType(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn-add" onClick={onAdd}>+ Add Supporter</button>
      </div>

      {error && <p className="supporter-error">{error}</p>}

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Region</th>
              <th>Status</th>
              <th>Donations</th>
              <th>Total Value</th>
              <th>Last Donation</th>
              <th>Churn Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    {Array.from({ length: 9 }).map((_, j) => <td key={j}>&nbsp;</td>)}
                  </tr>
                ))
              : data?.items.length === 0
                ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                      No supporters found.
                    </td>
                  </tr>
                )
                : data?.items.map(s => (
                    <tr key={s.supporterId} className="clickable-row" onClick={() => onSelect(s.supporterId)}>
                      <td>{s.displayName ?? '—'}</td>
                      <td>{s.email ?? '—'}</td>
                      <td>{s.supporterType ?? '—'}</td>
                      <td>{s.region ?? '—'}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>{s.totalDonations}</td>
                      <td>₱{s.totalValue.toLocaleString()}</td>
                      <td>{s.latestDonationDate ?? '—'}</td>
                      <td><ChurnBadge label={s.churnRiskLabel} /></td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        label={`Page ${page} of ${totalPages} · ${data?.total ?? 0} total`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const cls = status?.toLowerCase() === 'active' ? 'badge badge-prog'
    : status?.toLowerCase() === 'inactive' ? 'badge badge-risk'
    : 'badge badge-re';
  return <span className={cls}>{status ?? '—'}</span>;
}

function ChurnBadge({ label }: { label: string | null }) {
  if (!label) return <span className="badge-churn-none">—</span>;
  const cls = label === 'High' ? 'badge-churn-high'
    : label === 'Medium' ? 'badge-churn-medium'
    : 'badge-churn-low';
  return <span className={cls}>{label}</span>;
}
