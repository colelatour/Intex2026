import { useState } from 'react';
import { post, put } from '../../../lib/api';
import type { SupporterDetail } from '../../../hooks/useSupporters';

interface Props {
  supporter: SupporterDetail | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const TYPES    = ['MonetaryDonor', 'InKindDonor', 'VolunteerSupporter', 'CorporatePartner'];
const STATUSES = ['Active', 'Inactive', 'Lapsed'];
const REGIONS  = ['Luzon', 'Visayas', 'Mindanao'];
const CHANNELS = ['Website', 'Referral', 'Event', 'Social Media', 'Direct Mail', 'Other'];

export default function SupporterForm({ supporter, onClose, onSaved }: Props) {
  const isEdit = !!supporter?.supporterId;

  const [form, setForm] = useState({
    displayName:       supporter?.displayName      ?? '',
    firstName:         supporter?.firstName        ?? '',
    lastName:          supporter?.lastName         ?? '',
    email:             supporter?.email            ?? '',
    phone:             supporter?.phone            ?? '',
    supporterType:     supporter?.supporterType    ?? '',
    relationshipType:  supporter?.relationshipType ?? '',
    status:            supporter?.status           ?? 'Active',
    region:            supporter?.region           ?? '',
    country:           supporter?.country          ?? '',
    acquisitionChannel: supporter?.acquisitionChannel ?? '',
    organizationName:  supporter?.organizationName ?? '',
  });

  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.displayName.trim())  e.displayName  = 'Name is required.';
    if (!form.supporterType)       e.supporterType = 'Type is required.';
    if (!form.status)              e.status        = 'Status is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email address.';
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
        await put(`/api/supporters/${supporter!.supporterId}`, form);
      } else {
        await post('/api/supporters', form);
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
      <h3>{isEdit ? 'Edit Supporter' : 'Add Supporter'}</h3>

      <div className="form-row">
        <label>Display Name *</label>
        <input value={form.displayName} onChange={e => set('displayName', e.target.value)} />
        {errors.displayName && <span className="field-error">{errors.displayName}</span>}
      </div>

      <div className="form-row form-row--2col">
        <div>
          <label>First Name</label>
          <input value={form.firstName} onChange={e => set('firstName', e.target.value)} />
        </div>
        <div>
          <label>Last Name</label>
          <input value={form.lastName} onChange={e => set('lastName', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <label>Email</label>
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-row">
        <label>Phone</label>
        <input value={form.phone} onChange={e => set('phone', e.target.value)} />
      </div>

      <div className="form-row form-row--2col">
        <div>
          <label>Type *</label>
          <select value={form.supporterType} onChange={e => set('supporterType', e.target.value)}>
            <option value="">Select…</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.supporterType && <span className="field-error">{errors.supporterType}</span>}
        </div>
        <div>
          <label>Status *</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.status && <span className="field-error">{errors.status}</span>}
        </div>
      </div>

      <div className="form-row form-row--2col">
        <div>
          <label>Region</label>
          <select value={form.region} onChange={e => set('region', e.target.value)}>
            <option value="">Select…</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label>Country</label>
          <input value={form.country} onChange={e => set('country', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <label>Acquisition Channel</label>
        <select value={form.acquisitionChannel} onChange={e => set('acquisitionChannel', e.target.value)}>
          <option value="">Select…</option>
          {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label>Organization Name</label>
        <input value={form.organizationName} onChange={e => set('organizationName', e.target.value)} />
      </div>

      {apiError && <p className="field-error" style={{ marginBottom: '0.5rem' }}>{apiError}</p>}

      <div className="form-actions">
        <button type="button" className="btn-export" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-add" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Supporter'}
        </button>
      </div>
    </form>
  );
}
