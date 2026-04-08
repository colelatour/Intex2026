import { useState, useEffect } from 'react';
import { getSession } from '../../lib/authApi';
import UserTable from './users/UserTable';
import UserForm from './users/UserForm';
import type { UserListItem } from '../../hooks/useAdminUsers';

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    getSession().then(s => setCurrentEmail(s.email));
  }, []);

  function handleSaved() {
    setSelectedUser(null);
    setShowCreateForm(false);
    setTableKey(k => k + 1);
  }

  const showForm = selectedUser || showCreateForm;

  return (
    <div className="donor-dashboard">
      {!showForm && (
        <UserTable
          key={tableKey}
          onSelect={u => { setSelectedUser(u); setShowCreateForm(false); }}
          onAdd={() => { setShowCreateForm(true); setSelectedUser(null); }}
          onDeleted={() => setTableKey(k => k + 1)}
          currentUserEmail={currentEmail}
        />
      )}

      {showForm && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '540px',
          border: '1px solid #e5e7eb',
        }}>
          <UserForm
            user={selectedUser}
            onClose={() => { setSelectedUser(null); setShowCreateForm(false); }}
            onSaved={handleSaved}
          />
        </div>
      )}
    </div>
  );
}
