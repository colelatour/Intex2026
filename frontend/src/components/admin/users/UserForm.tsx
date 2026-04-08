import { useState } from 'react';
import { post, put } from '../../../lib/api';
import type { UserListItem } from '../../../hooks/useAdminUsers';

interface Props {
  user: UserListItem | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const ROLES = ['Admin', 'Worker', 'Donor'];

export default function UserForm({ user, onClose, onSaved }: Props) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    email: user?.email ?? '',
    role: user?.role ?? 'Donor',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email address.';
    if (!form.role) e.role = 'Role is required.';
    if (!isEdit && !form.password.trim()) e.password = 'Password is required.';
    if (!isEdit && form.password.length > 0 && form.password.length < 14)
      e.password = 'Password must be at least 14 characters.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setApiError(null);
    try {
      if (isEdit) {
        await put(`/api/admin/users/${user!.id}`, {
          email: form.email,
          role: form.role,
        });
      } else {
        await post('/api/admin/users', {
          email: form.email,
          password: form.password,
          role: form.role,
        });
      }
      onSaved();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="supporter-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? 'Edit User' : 'Add User'}</h3>

      <div className="form-row">
        <label>Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-row">
        <label>Role *</label>
        <select value={form.role} onChange={e => set('role', e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.role && <span className="field-error">{errors.role}</span>}
      </div>

      {!isEdit && (
        <div className="form-row">
          <label>Temporary Password *</label>
          <input
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="Min 14 characters"
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
          <small style={{ color: '#888', marginTop: '0.25rem', display: 'block' }}>
            The user can change this password after logging in.
          </small>
        </div>
      )}

      {apiError && <p className="field-error" style={{ marginBottom: '0.5rem' }}>{apiError}</p>}

      <div className="form-actions">
        <button type="button" className="btn-export" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-add" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
