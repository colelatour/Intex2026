import { useEffect, useMemo, useState } from 'react';
import { get, post, put } from '../../lib/api';

interface Donation {
  donationId: string | null;
  supporterId: string | null;
  donationType: string | null;
  donationDate: string | null;
  isRecurring: string | null;
  campaignName: string | null;
  channelSource: string | null;
  currencyCode: string | null;
  amount: number | null;
  estimatedValue: number | null;
  impactUnit: string | null;
  notes: string | null;
  referralPostId: string | null;
}

interface SupporterOption {
  supporterId: string;
  displayName: string;
}

interface SupporterListResponse {
  items: Array<{ supporterId: string; displayName: string | null }>;
}

interface DonationFormState {
  donationId: string;
  supporterId: string;
  donationType: string;
  donationDate: string;
  isRecurring: boolean;
  currencyCode: string;
  amount: string;
  campaignName: string;
  channelSource: string;
  impactUnit: string;
  notes: string;
  referralPostId: string;
}

type DonationType = 'Monetary' | 'InKind' | 'Event' | 'Campaign';

const DONATION_TYPES: DonationType[] = ['Monetary', 'InKind', 'Event', 'Campaign'];

const DONATION_TYPE_DETAILS: Record<
  DonationType,
  { description: string; fields: Array<keyof DonationFormState> }
> = {
  Monetary: {
    description: 'Direct cash contribution from a supporter.',
    fields: ['supporterId', 'donationDate', 'amount', 'currencyCode', 'isRecurring', 'campaignName', 'channelSource', 'notes']
  },
  InKind: {
    description: 'Goods or services donated in place of cash.',
    fields: ['supporterId', 'donationDate', 'amount', 'currencyCode', 'impactUnit', 'campaignName', 'channelSource', 'notes']
  },
  Event: {
    description: 'Contribution tied to an event or fundraiser.',
    fields: ['supporterId', 'donationDate', 'amount', 'currencyCode', 'campaignName', 'channelSource', 'notes']
  },
  Campaign: {
    description: 'Donation attributed to a specific campaign effort.',
    fields: ['supporterId', 'donationDate', 'amount', 'currencyCode', 'isRecurring', 'campaignName', 'channelSource', 'notes']
  }
};

function isDonationType(value: string): value is DonationType {
  return DONATION_TYPES.includes(value as DonationType);
}

function toFormState(donation: Donation | null): DonationFormState {
  return {
    donationId: donation?.donationId ?? '',
    supporterId: donation?.supporterId ?? '',
    donationType: donation?.donationType ?? 'Monetary',
    donationDate: donation?.donationDate ?? new Date().toISOString().slice(0, 10),
    isRecurring: (donation?.isRecurring ?? '').toLowerCase() === 'true',
    currencyCode: donation?.currencyCode ?? 'PHP',
    amount: donation?.amount != null ? String(donation.amount) : '',
    campaignName: donation?.campaignName ?? '',
    channelSource: donation?.channelSource ?? '',
    impactUnit: donation?.impactUnit ?? 'pesos',
    notes: donation?.notes ?? '',
    referralPostId: donation?.referralPostId ?? ''
  };
}

export default function DonationManagement() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [supporters, setSupporters] = useState<SupporterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationTypeFilter, setDonationTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [form, setForm] = useState<DonationFormState>(toFormState(null));
  const [supporterQuery, setSupporterQuery] = useState('');
  const [showSupporterResults, setShowSupporterResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const supporterNameById = useMemo(
    () => Object.fromEntries(supporters.map((s) => [s.supporterId, s.displayName])),
    [supporters]
  );

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [donationData, supporterData] = await Promise.all([
        get<Donation[]>('/api/Donations'),
        get<SupporterListResponse>('/api/supporters?page=1&pageSize=1000')
      ]);
      setDonations(donationData);
      setSupporters(
        supporterData.items
          .map((s) => ({
            supporterId: s.supporterId,
            displayName: s.displayName ?? s.supporterId
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load donations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = donations
    .filter((d) => donationTypeFilter === '' || (d.donationType ?? '') === donationTypeFilter)
    .filter((d) => {
      if (recurringFilter === 'all') return true;
      const isRecurring = (d.isRecurring ?? '').toLowerCase() === 'true';
      return recurringFilter === 'recurring' ? isRecurring : !isRecurring;
    })
    .filter((d) => {
      if (!dateFromFilter && !dateToFilter) return true;
      if (!d.donationDate) return false;
      const donationDate = d.donationDate.slice(0, 10);
      if (dateFromFilter && donationDate < dateFromFilter) return false;
      if (dateToFilter && donationDate > dateToFilter) return false;
      return true;
    })
    .filter((d) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const supporterName = supporterNameById[d.supporterId ?? ''] ?? '';
      return (
        (d.donationId ?? '').toLowerCase().includes(q) ||
        (d.supporterId ?? '').toLowerCase().includes(q) ||
        supporterName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aDate = a.donationDate ? new Date(a.donationDate).getTime() : 0;
      const bDate = b.donationDate ? new Date(b.donationDate).getTime() : 0;
      return bDate - aDate;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageItems: Array<number | 'ellipsis'> = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(2, safePage - 1);
    let end = Math.min(totalPages - 1, safePage + 1);

    if (safePage <= 4) {
      start = 2;
      end = 5;
    } else if (safePage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }

    const items: Array<number | 'ellipsis'> = [1];
    if (start > 2) items.push('ellipsis');
    for (let p = start; p <= end; p += 1) items.push(p);
    if (end < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
    return items;
  })();

  function openCreate() {
    setEditingDonation(null);
    setFormError(null);
    setShowForm(false);
    setShowTypePicker(true);
    setSupporterQuery('');
    setShowSupporterResults(false);
  }

  function startCreateWithType(type: DonationType) {
    const next = toFormState(null);
    next.donationType = type;
    setEditingDonation(null);
    setIsFormEditing(true);
    setForm(next);
    setSupporterQuery('');
    setShowSupporterResults(false);
    setFormError(null);
    setShowTypePicker(false);
    setShowForm(true);
  }

  function openEdit(donation: Donation) {
    setEditingDonation(donation);
    setIsFormEditing(false);
    setForm(toFormState(donation));
    const name = supporterNameById[donation.supporterId ?? ''] ?? donation.supporterId ?? '';
    setSupporterQuery(name);
    setShowSupporterResults(false);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!isFormEditing) return;
    if (!form.supporterId) {
      setFormError('Supporter is required.');
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }
    if (!form.donationDate) {
      setFormError('Donation date is required.');
      return;
    }

    const payload: Donation = {
      donationId: editingDonation?.donationId ?? null,
      supporterId: form.supporterId,
      donationType: form.donationType || 'Monetary',
      donationDate: form.donationDate,
      isRecurring: form.isRecurring ? 'True' : 'False',
      campaignName: form.campaignName || null,
      channelSource: form.channelSource || null,
      currencyCode: form.currencyCode || 'PHP',
      amount,
      estimatedValue: amount,
      impactUnit: form.impactUnit || null,
      notes: form.notes || null,
      referralPostId: form.referralPostId || null
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editingDonation?.donationId) {
        payload.donationId = editingDonation.donationId;
        await put(`/api/Donations/${editingDonation.donationId}`, payload);
      } else {
        await post('/api/Donations', payload);
      }
      setIsFormEditing(false);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save donation.');
    } finally {
      setSaving(false);
    }
  }

  const activeType: DonationType = isDonationType(form.donationType) ? form.donationType : 'Monetary';
  const createVisibleFields = new Set<keyof DonationFormState>(DONATION_TYPE_DETAILS[activeType].fields);
  const shouldShowField = (field: keyof DonationFormState) =>
    !!editingDonation || createVisibleFields.has(field);
  const filteredSupporters = useMemo(() => {
    const q = supporterQuery.trim().toLowerCase();
    if (!q) return supporters.slice(0, 12);
    return supporters
      .filter((s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.supporterId.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [supporters, supporterQuery]);

  return (
    <div className="donor-dashboard">
      <div className="supporter-filters">
        <input
          className="supporter-search"
          placeholder="Search by donation ID or supporter…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className="btn-export"
          onClick={() => setShowFilters((prev) => !prev)}
          aria-expanded={showFilters}
          aria-controls="donation-filter-panel"
        >
          {showFilters ? 'Hide Filters' : 'Filters'}
        </button>
        <button type="button" className="btn-add" onClick={openCreate}>+ Add Donation</button>
      </div>
      <div
        id="donation-filter-panel"
        className={`supporter-filters-panel ${showFilters ? 'is-open' : ''}`}
      >
        <div className="supporter-filters-grid">
          <select
            value={donationTypeFilter}
            onChange={(e) => {
              setDonationTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All donation types</option>
            {DONATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={recurringFilter}
            onChange={(e) => {
              const value = e.target.value as 'all' | 'recurring' | 'one-time';
              setRecurringFilter(value);
              setPage(1);
            }}
          >
            <option value="all">All recurrence</option>
            <option value="recurring">Recurring only</option>
            <option value="one-time">One-time only</option>
          </select>
          <input
            type="date"
            value={dateFromFilter}
            onChange={(e) => {
              setDateFromFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter from date"
            title="From date"
          />
          <input
            type="date"
            value={dateToFilter}
            onChange={(e) => {
              setDateToFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter to date"
            title="To date"
          />
        </div>
      </div>

      {error && <p className="supporter-error">{error}</p>}
      {loading && <p style={{ padding: '1rem' }}>Loading donations…</p>}

      {!loading && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>Date</th>
                <th>Supporter</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Recurring</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    No donations found.
                  </td>
                </tr>
              )}
              {paginated.map((d) => (
                <tr key={d.donationId ?? `${d.supporterId}-${d.donationDate}`}>
                  <td>{d.donationId ?? '—'}</td>
                  <td>{d.donationDate ?? '—'}</td>
                  <td>{supporterNameById[d.supporterId ?? ''] ?? d.supporterId ?? '—'}</td>
                  <td>{d.donationType ?? '—'}</td>
                  <td>{d.amount != null ? `₱${d.amount.toLocaleString()}` : '—'}</td>
                  <td>{(d.isRecurring ?? '').toLowerCase() === 'true' ? 'Yes' : 'No'}</td>
                  <td>
                    <button type="button" className="btn-export" onClick={() => openEdit(d)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="supporter-pagination">
          <span>Page {safePage} of {totalPages} &nbsp;·&nbsp; {filtered.length} total</span>
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{ padding: '3px 10px' }}
            >‹</button>
            {pageItems.map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} style={{ color: 'var(--gray-500)', padding: '0 0.2rem' }}>
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  className="filter-btn"
                  onClick={() => setPage(item)}
                  style={{
                    padding: '3px 10px',
                    background: item === safePage ? 'var(--navy)' : 'white',
                    color: item === safePage ? 'white' : 'var(--gray-600)',
                    borderColor: item === safePage ? 'var(--navy)' : undefined,
                  }}
                >{item}</button>
              )
            )}
            <button
              className="filter-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{ padding: '3px 10px' }}
            >›</button>
          </div>
        </div>
      )}

      {showTypePicker && (
        <div className="modal-backdrop" onClick={() => setShowTypePicker(false)}>
          <div className="modal donation-type-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Donation Type</h3>
            <p className="donation-type-modal__subtitle">
              Choose a type to continue to the type-specific form.
            </p>
            <div className="donation-type-cards">
              {DONATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="donation-type-card"
                  onClick={() => startCreateWithType(type)}
                >
                  <span className="donation-type-card__title">{type}</span>
                  <span className="donation-type-card__desc">{DONATION_TYPE_DETAILS[type].description}</span>
                </button>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-export" onClick={() => setShowTypePicker(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal donation-modal" onClick={(e) => e.stopPropagation()}>
            <form className="supporter-form donation-form-grid" onSubmit={(e) => e.preventDefault()}>
              <h3>
                {editingDonation
                  ? (isFormEditing ? 'Edit Donation' : 'View Donation')
                  : 'Add Donation'}
              </h3>

              {!editingDonation && (
                <div className="donation-type-summary donation-form-full">
                  <span className="donation-type-summary__label">Type: {activeType}</span>
                  <button
                    type="button"
                    className="filter-btn"
                    onClick={() => {
                      setShowForm(false);
                      setShowTypePicker(true);
                    }}
                  >
                    Change Type
                  </button>
                </div>
              )}

              {editingDonation?.donationId && (
                <div className="form-row donation-form-full">
                  <label>Donation ID</label>
                  <input value={editingDonation.donationId} disabled />
                </div>
              )}

              {shouldShowField('supporterId') && (
                <div className="form-row donation-form-full">
                  <label>Supporter *</label>
                  {editingDonation && !isFormEditing ? (
                    <input value={supporterNameById[form.supporterId] ?? form.supporterId} disabled />
                  ) : (
                    <div className="supporter-autocomplete">
                      <input
                        value={supporterQuery}
                        placeholder="Search supporter by name or ID…"
                        onFocus={() => setShowSupporterResults(true)}
                        onBlur={() => {
                          window.setTimeout(() => setShowSupporterResults(false), 120);
                        }}
                        onChange={(e) => {
                          setSupporterQuery(e.target.value);
                          setShowSupporterResults(true);
                          setForm((prev) => ({ ...prev, supporterId: '' }));
                        }}
                      />
                      {showSupporterResults && (
                        <div className="supporter-autocomplete__menu">
                          {filteredSupporters.length === 0 ? (
                            <div className="supporter-autocomplete__empty">No supporters found</div>
                          ) : (
                            filteredSupporters.map((s) => (
                              <button
                                key={s.supporterId}
                                type="button"
                                className="supporter-autocomplete__item"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, supporterId: s.supporterId }));
                                  setSupporterQuery(`${s.displayName} (${s.supporterId})`);
                                  setShowSupporterResults(false);
                                }}
                              >
                                <span>{s.displayName}</span>
                                <span className="supporter-autocomplete__id">{s.supporterId}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {editingDonation && (
                <div className="form-row form-row--2col">
                  <div>
                    <label>Donation Type</label>
                    <select
                      value={form.donationType}
                      onChange={(e) => setForm((prev) => ({ ...prev, donationType: e.target.value }))}
                      disabled={!isFormEditing}
                    >
                      {DONATION_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Date *</label>
                    <input
                      type="date"
                      value={form.donationDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, donationDate: e.target.value }))}
                      disabled={!isFormEditing}
                    />
                  </div>
                </div>
              )}

              {!editingDonation && shouldShowField('donationDate') && (
                <div className="form-row">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={form.donationDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, donationDate: e.target.value }))}
                  />
                </div>
              )}

              {(shouldShowField('amount') || shouldShowField('currencyCode')) && (
                <div className="form-row form-row--2col">
                  {shouldShowField('amount') && (
                    <div>
                      <label>Amount *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                        disabled={!!editingDonation && !isFormEditing}
                      />
                    </div>
                  )}
                  {shouldShowField('currencyCode') && (
                    <div>
                      <label>Currency</label>
                      <input
                        value={form.currencyCode}
                        onChange={(e) => setForm((prev) => ({ ...prev, currencyCode: e.target.value }))}
                        disabled={!!editingDonation && !isFormEditing}
                      />
                    </div>
                  )}
                </div>
              )}

              {shouldShowField('isRecurring') && (
                <div className="form-row donation-form-full">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.isRecurring}
                      onChange={(e) => setForm((prev) => ({ ...prev, isRecurring: e.target.checked }))}
                      disabled={!!editingDonation && !isFormEditing}
                      style={{ marginRight: '0.45rem' }}
                    />
                    Recurring donation
                  </label>
                </div>
              )}

              {shouldShowField('campaignName') && (
                <div className="form-row">
                  <label>Campaign Name</label>
                  <input
                    value={form.campaignName}
                    onChange={(e) => setForm((prev) => ({ ...prev, campaignName: e.target.value }))}
                    disabled={!!editingDonation && !isFormEditing}
                  />
                </div>
              )}

              {(shouldShowField('channelSource') || shouldShowField('impactUnit')) && (
                <div className="form-row form-row--2col">
                  {shouldShowField('channelSource') && (
                    <div>
                      <label>Channel Source</label>
                      <input
                        value={form.channelSource}
                        onChange={(e) => setForm((prev) => ({ ...prev, channelSource: e.target.value }))}
                        disabled={!!editingDonation && !isFormEditing}
                      />
                    </div>
                  )}
                  {shouldShowField('impactUnit') && (
                    <div>
                      <label>Impact Unit</label>
                      <input
                        value={form.impactUnit}
                        onChange={(e) => setForm((prev) => ({ ...prev, impactUnit: e.target.value }))}
                        disabled={!!editingDonation && !isFormEditing}
                      />
                    </div>
                  )}
                </div>
              )}

              {shouldShowField('notes') && (
                <div className="form-row donation-form-full">
                  <label>Notes</label>
                  <input
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    disabled={!!editingDonation && !isFormEditing}
                  />
                </div>
              )}

              {formError && <p className="field-error donation-form-full" style={{ marginBottom: '0.5rem' }}>{formError}</p>}

              <div className="form-actions donation-form-full">
                <button type="button" className="btn-export" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </button>
                {editingDonation && !isFormEditing ? (
                  <button
                    type="button"
                    className="btn-add"
                    onClick={() => {
                      setIsFormEditing(true);
                      setFormError(null);
                    }}
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-add"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? 'Saving…' : editingDonation ? 'Save Changes' : 'Add Donation'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
