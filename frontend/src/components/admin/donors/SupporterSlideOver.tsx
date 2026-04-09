import { useEffect, useRef, useState } from 'react';
import { useSupporterDetail } from '../../../hooks/useSupporters';
import { post } from '../../../lib/api';
import SupporterForm from './SupporterForm';

interface Props {
  supporterId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SupporterSlideOver({ supporterId, onClose, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [showAddDonationForm, setShowAddDonationForm] = useState(false);
  const { data, loading, error, refetch } = useSupporterDetail(supporterId);
  const [donationForm, setDonationForm] = useState({
    amount: '',
    donationDate: new Date().toISOString().slice(0, 10),
    isRecurring: false,
    notes: ''
  });
  const [donationSaving, setDonationSaving] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const donationFormRef = useRef<HTMLDivElement>(null);

  const open = !!supporterId;

  function handleSaved() {
    setEditing(false);
    setShowAddDonationForm(false);
    onSaved();
  }

  useEffect(() => {
    if (!showAddDonationForm || !donationFormRef.current) return;
    requestAnimationFrame(() => {
      const scroller = donationFormRef.current?.closest('.slide-over') as HTMLElement | null;
      if (!scroller) return;
      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior: 'smooth'
      });
    });
  }, [showAddDonationForm]);

  async function handleAddDonation(e: React.FormEvent) {
    e.preventDefault();
    if (!supporterId || !data) return;

    const amount = Number(donationForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDonationError('Enter a valid donation amount greater than zero.');
      return;
    }

    setDonationSaving(true);
    setDonationError(null);
    try {
      await post(`/api/supporters/${supporterId}/donations`, {
        amount,
        currencyCode: 'PHP',
        donationDate: donationForm.donationDate,
        isRecurring: donationForm.isRecurring,
        donationType: 'Monetary',
        notes: donationForm.notes || undefined
      });
      setDonationForm({
        amount: '',
        donationDate: new Date().toISOString().slice(0, 10),
        isRecurring: false,
        notes: ''
      });
      setShowAddDonationForm(false);
      refetch();
    } catch (err) {
      setDonationError(err instanceof Error ? err.message : 'Failed to add donation.');
    } finally {
      setDonationSaving(false);
    }
  }

  return (
    <>
      {open && <div className="slide-over-backdrop" onClick={onClose} />}
      <div className={`slide-over${open ? ' open' : ''}`}>
        {open && (
          <>
            <div className="slide-over__header">
              <h2>{data?.displayName ?? '…'}</h2>
              <button className="slide-over__close" onClick={onClose}>✕</button>
            </div>

            {loading && <p className="slide-over__loading">Loading…</p>}
            {error   && <p className="slide-over__error">{error}</p>}

            {data && !loading && !editing && (
              <div className="slide-over__body">
                {/* Profile fields */}
                <div className="slide-over__section">
                  <h3>Profile</h3>
                  <dl className="detail-list">
                    <dt>Email</dt>        <dd>{data.email ?? '—'}</dd>
                    <dt>Phone</dt>        <dd>{data.phone ?? '—'}</dd>
                    <dt>Type</dt>         <dd>{data.supporterType ?? '—'}</dd>
                    <dt>Status</dt>       <dd>{data.status ?? '—'}</dd>
                    <dt>Region</dt>       <dd>{data.region ?? '—'}</dd>
                    <dt>Country</dt>      <dd>{data.country ?? '—'}</dd>
                    <dt>Relationship</dt> <dd>{data.relationshipType ?? '—'}</dd>
                    <dt>Channel</dt>      <dd>{data.acquisitionChannel ?? '—'}</dd>
                    <dt>Organization</dt> <dd>{data.organizationName ?? '—'}</dd>
                    <dt>First Donation</dt><dd>{data.firstDonationDate ?? '—'}</dd>
                    <dt>Created</dt>      <dd>{data.createdAt ?? '—'}</dd>
                  </dl>
                </div>

                {/* Churn score */}
                {data.churnRiskLabel && (
                  <div className="slide-over__section">
                    <h3>Churn Risk</h3>
                    <p>
                      <ChurnBadge label={data.churnRiskLabel} />
                      &nbsp; {((data.churnProbability ?? 0) * 100).toFixed(1)}% probability
                    </p>
                  </div>
                )}

                {/* Donation history */}
                <div className="slide-over__section">
                  <h3>Donation History ({data.donations.length})</h3>
                  {data.donations.length === 0
                    ? <p className="empty-msg">No donations recorded.</p>
                    : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Recurring</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.donations.map((d, i) => (
                            <tr key={d.donationId ?? i}>
                              <td>{d.donationDate ?? '—'}</td>
                              <td>{d.donationType ?? '—'}</td>
                              <td>{d.amount != null ? `₱${d.amount.toLocaleString()}` : '—'}</td>
                              <td>{d.isRecurring ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn-add" onClick={() => setEditing(true)}>
                    Edit Supporter
                  </button>
                  <button
                    type="button"
                    className="btn-export"
                    onClick={() => {
                      setShowAddDonationForm((v) => !v);
                      setDonationError(null);
                    }}
                  >
                    {showAddDonationForm ? 'Cancel Donation' : 'Add Donation'}
                  </button>
                </div>

                <div
                  ref={donationFormRef}
                  className={`donation-form-reveal${showAddDonationForm ? ' donation-form-reveal--open' : ''}`}
                  aria-hidden={!showAddDonationForm}
                >
                  <div className="slide-over__section donation-form-section">
                    <h3>Add Donation</h3>
                    <form className="donation-quick-form" onSubmit={handleAddDonation}>
                      <div className="form-row form-row--2col">
                        <div>
                          <label>Amount (PHP)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={donationForm.amount}
                            onChange={(e) => setDonationForm((prev) => ({ ...prev, amount: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label>Date</label>
                          <input
                            type="date"
                            value={donationForm.donationDate}
                            onChange={(e) => setDonationForm((prev) => ({ ...prev, donationDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <label className="donation-toggle">
                          <input
                            type="checkbox"
                            checked={donationForm.isRecurring}
                            onChange={(e) => setDonationForm((prev) => ({ ...prev, isRecurring: e.target.checked }))}
                          />
                          <span className="donation-toggle__track" aria-hidden="true">
                            <span className="donation-toggle__thumb" />
                          </span>
                          <span className="donation-toggle__label">Recurring donation</span>
                        </label>
                      </div>
                      <div className="form-row">
                        <label>Notes</label>
                        <input
                          value={donationForm.notes}
                          onChange={(e) => setDonationForm((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Optional notes"
                        />
                      </div>
                      {donationError && <p className="field-error" style={{ marginBottom: '0.5rem' }}>{donationError}</p>}
                      <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                        <button type="submit" className="btn-add" disabled={donationSaving}>
                          {donationSaving ? 'Adding…' : 'Add Donation'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {data && editing && (
              <div className="slide-over__body">
                <SupporterForm
                  supporter={data}
                  onClose={() => setEditing(false)}
                  onSaved={handleSaved}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ChurnBadge({ label }: { label: string | null }) {
  if (!label) return <span className="badge-churn-none">—</span>;
  const cls = label === 'High' ? 'badge-churn-high'
    : label === 'Medium' ? 'badge-churn-medium'
    : 'badge-churn-low';
  return <span className={cls}>{label}</span>;
}
