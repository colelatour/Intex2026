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
  const formTitle = selectedUser ? 'Edit user account' : 'Create new user';
  const formDescription = selectedUser
    ? 'Update account access and role assignments for this user.'
    : 'Add a new platform user with a temporary password and assigned role.';

  return (
    <section className="users-admin">
      <div className="users-admin__hero">
        <div>
          <span className="users-admin__eyebrow">Access Control</span>
          <h2 className="users-admin__title">User Management</h2>
          <p className="users-admin__intro">
            Manage admin, worker, and donor accounts from one place with clearer role visibility and a wider working area.
          </p>
        </div>
      </div>

      {!showForm && (
        <div className="users-admin__panel">
          <UserTable
            key={tableKey}
            onSelect={u => { setSelectedUser(u); setShowCreateForm(false); }}
            onAdd={() => { setShowCreateForm(true); setSelectedUser(null); }}
            onDeleted={() => setTableKey(k => k + 1)}
            currentUserEmail={currentEmail}
          />
        </div>
      )}

      {showForm && (
        <div className="users-admin__form-shell">
          <div className="users-admin__form-card">
            <div className="users-admin__form-layout">
              <aside className="users-admin__form-aside">
                <span className="users-admin__eyebrow">User Details</span>
                <h3>{formTitle}</h3>
                <p>{formDescription}</p>
                <div className="users-admin__form-note">
                  <h4>What you can manage</h4>
                  <ul>
                    <li>Update the account email used for sign-in.</li>
                    <li>Assign the correct platform role and access level.</li>
                    <li>Create users with a temporary password for first login.</li>
                  </ul>
                </div>
              </aside>

              <div className="users-admin__form-main">
                <div className="users-admin__form-head">
                  <div>
                    <span className="users-admin__eyebrow">Account Form</span>
                    <h3>{selectedUser ? selectedUser.email : 'New platform user'}</h3>
                    <p>
                      {selectedUser
                        ? 'Edit the selected account while keeping the same user-management workflow.'
                        : 'Fill in the required details below to add a new user account.'}
                    </p>
                  </div>
                </div>
                <UserForm
                  user={selectedUser}
                  onClose={() => { setSelectedUser(null); setShowCreateForm(false); }}
                  onSaved={handleSaved}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
