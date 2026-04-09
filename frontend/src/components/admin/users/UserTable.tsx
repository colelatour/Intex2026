import { useState, useRef, useEffect } from 'react';
import { useAdminUsers, UserListItem } from '../../../hooks/useAdminUsers';
import { del } from '../../../lib/api';

const ROLES = ['Admin', 'Worker', 'Donor'];

interface Props {
  onSelect: (user: UserListItem) => void;
  onAdd: () => void;
  onDeleted: () => void;
  currentUserEmail: string | null;
}

export default function UserTable({ onSelect, onAdd, onDeleted, currentUserEmail }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, loading, error } = useAdminUsers({
    page, pageSize, search: debouncedSearch, role,
  });

  useEffect(() => { setPage(1); }, [debouncedSearch, role, pageSize]);

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }

  async function handleDelete(u: UserListItem) {
    try {
      await del(`/api/admin/users/${u.id}`);
      onDeleted();
    } catch {
      // del() shows its own confirm dialog; if cancelled, nothing happens
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="supporter-table-wrap">
      {/* Filters */}
      <div className="supporter-filters">
        <input
          className="supporter-search"
          placeholder="Search by email…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn-add" onClick={onAdd}>+ Add User</button>
      </div>

      {error && <p className="supporter-error">{error}</p>}

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                    </tr>
                  ))
                : data?.items.length === 0
                  ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                        No users found.
                      </td>
                    </tr>
                  )
                  : data?.items.map(u => {
                      const isSelf = currentUserEmail && u.email.toLowerCase() === currentUserEmail.toLowerCase();
                      return (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td><RoleBadge role={u.role} /></td>
                          <td>
                            {isSelf ? (
                              <span style={{ color: '#999', fontSize: '0.85rem' }}>You</span>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  className="btn-export"
                                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
                                  onClick={(e) => { e.stopPropagation(); onSelect(u); }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-export"
                                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem', color: '#dc3545', borderColor: '#dc3545' }}
                                  onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <span>Page {page} of {totalPages} &nbsp;·&nbsp; {data?.total ?? 0} total</span>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <select
            className="filter-btn"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={30}>30 / page</option>
          </select>
          <button
            className="filter-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '3px 10px' }}
          >‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className="filter-btn"
              onClick={() => setPage(p)}
              style={{
                padding: '3px 10px',
                background: p === page ? 'var(--navy)' : 'white',
                color: p === page ? 'white' : 'var(--gray-600)',
                borderColor: p === page ? 'var(--navy)' : undefined,
              }}
            >{p}</button>
          ))}
          <button
            className="filter-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: '3px 10px' }}
          >›</button>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls = role === 'Admin' ? 'badge badge-risk'
    : role === 'Worker' ? 'badge badge-prog'
    : 'badge badge-re';
  return <span className={cls}>{role}</span>;
}
