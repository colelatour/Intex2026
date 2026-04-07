import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../lib/authApi';
import { post } from '../lib/api';
import type { AuthSession } from '../types/AuthSession';
import Footer from '../components/layout/Footer';
import '../styles/Account.css';

export default function Account() {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSession()
      .then((s) => {
        if (!s.isAuthenticated) {
          navigate('/login');
          return;
        }
        setSession(s);
        setLoading(false);
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      await post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update password.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="account-loading">Loading...</div>;

  return (
    <>
      <main className="account">
        <div className="account__container">
          <h1>Account Details</h1>

          <section className="account__section">
            <h2>Profile Information</h2>
            <div className="account__field">
              <label>Email</label>
              <p>{session?.email}</p>
            </div>
            <div className="account__field">
              <label>Role</label>
              <p>{session?.roles?.join(', ') || 'No role assigned'}</p>
            </div>
          </section>

          <section className="account__section">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword} className="account__form">
              <div className="account__field">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="account__field">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="account__field">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {message && (
                <div className={`account__message account__message--${message.type}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" className="account__btn" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
