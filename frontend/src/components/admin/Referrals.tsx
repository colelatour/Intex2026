import { useEffect, useState } from 'react';
import { get, patch } from '../../lib/api';

interface Tip {
  tipId: number;
  name: string | null;
  email: string | null;
  region: string | null;
  submittedAt: string | null;
  contacted: boolean;
}

export default function Referrals() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draftFor, setDraftFor] = useState<Tip | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    get<Tip[]>('/api/tips')
      .then(setTips)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load referrals'),
      )
      .finally(() => setLoading(false));
  }, []);

  const pending = tips.filter((t) => !t.contacted);
  const contacted = tips.filter((t) => t.contacted);

  const applySearch = (list: Tip[]) => {
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        (t.name ?? '').toLowerCase().includes(q) ||
        (t.email ?? '').toLowerCase().includes(q) ||
        (t.region ?? '').toLowerCase().includes(q),
    );
  };

  const filteredPending = applySearch(pending);
  const filteredContacted = applySearch(contacted);

  const handleContacted = async (tip: Tip) => {
    try {
      await patch(`/api/tips/${tip.tipId}/contacted`, {});
      setTips((prev) =>
        prev.map((t) => (t.tipId === tip.tipId ? { ...t, contacted: true } : t)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as contacted');
    }
  };

  const emailDraft = (tip: Tip) =>
    `Dear ${tip.name ?? 'Friend'},\n\nWe received a referral regarding someone who may benefit from the services provided by Sheltered Light. We would love to connect and learn more about how we can help.\n\nPlease feel free to reach out to us at your earliest convenience so we can discuss next steps.\n\nWarm regards,\nSheltered Light Team`;

  const handleCopy = async () => {
    if (!draftFor) return;
    await navigator.clipboard.writeText(emailDraft(draftFor));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderTable = (rows: Tip[], grayed = false) => (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Region</th>
          <th>Submitted</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} style={{ opacity: 0.4 }}>
                <td colSpan={6}>Loading…</td>
              </tr>
            ))
          : rows.map((t) => (
              <tr key={t.tipId} style={grayed ? { opacity: 0.5 } : undefined}>
                <td>{t.tipId}</td>
                <td>{t.name ?? '—'}</td>
                <td>{t.email ?? '—'}</td>
                <td>{t.region ?? '—'}</td>
                <td>
                  {t.submittedAt
                    ? new Date(t.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </td>
                <td>
                  <div className="referral-actions">
                    <button
                      type="button"
                      className="referral-btn referral-btn--draft"
                      onClick={() => { setDraftFor(t); setCopied(false); }}
                    >
                      Draft Email
                    </button>
                    {!grayed && (
                      <button
                        type="button"
                        className="referral-btn referral-btn--contacted"
                        onClick={() => handleContacted(t)}
                      >
                        Contacted
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
        {!loading && rows.length === 0 && (
          <tr>
            <td
              colSpan={6}
              style={{ textAlign: 'center', color: 'var(--gray-600)', padding: '2rem' }}
            >
              {grayed ? 'No contacted referrals yet.' : 'No referrals match your search.'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div>
      {error && (
        <p style={{ padding: '1rem', color: 'var(--red)' }}>Error: {error}</p>
      )}

      <div className="table-toolbar">
        <h3>Pending Referrals</h3>
        <div className="table-right">
          <div className="search-bar">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, region…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="data-table">
        {renderTable(filteredPending)}
        <div className="table-footer">
          <span>Showing {filteredPending.length} of {pending.length} pending referrals</span>
        </div>
      </div>

      {contacted.length > 0 && (
        <>
          <div className="table-toolbar" style={{ marginTop: '2rem' }}>
            <h3>Contacted Referrals</h3>
          </div>
          <div className="data-table">
            {renderTable(filteredContacted, true)}
            <div className="table-footer">
              <span>Showing {filteredContacted.length} of {contacted.length} contacted referrals</span>
            </div>
          </div>
        </>
      )}

      {draftFor && (
        <div className="referral-modal-overlay" onClick={() => setDraftFor(null)}>
          <div className="referral-modal" onClick={(e) => e.stopPropagation()}>
            <div className="referral-modal__header">
              <h3>Email Draft for {draftFor.name ?? 'Referral'}</h3>
              <button type="button" className="referral-modal__close" onClick={() => setDraftFor(null)}>
                &times;
              </button>
            </div>
            <pre className="referral-modal__body">{emailDraft(draftFor)}</pre>
            <div className="referral-modal__footer">
              <button type="button" className="referral-btn referral-btn--copy" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
