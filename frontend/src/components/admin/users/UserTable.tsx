import { useState, useRef, useEffect } from 'react';
import { useAdminUsers, UserListItem } from '../../../hooks/useAdminUsers';
import { del } from '../../../lib/api';
import PaginationControls from '../PaginationControls';

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

function RoleBadge({ role }: { role: string }) {
  const cls = role === 'Admin' ? 'badge badge-risk'
    : role === 'Worker' ? 'badge badge-prog'
    : 'badge badge-re';
  return <span className={cls}>{role}</span>;
}
