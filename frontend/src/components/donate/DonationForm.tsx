// src/components/donate/DonationForm.tsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { recordDonation } from '../../lib/donationsApi';
import { getSession } from '../../lib/authApi';

const AMOUNTS = [
  { value: 25, impact: 'Provides meals for one week' },
  { value: 50, impact: 'One counseling session' },
  { value: 100, impact: 'School supplies & uniforms' },
  { value: 250, impact: 'Monthly care for one resident' },
];
const REGIONS = ['Luzon', 'Visayas', 'Mindanao'] as const;

export default function DonationForm({ onDonationSuccess }: { onDonationSuccess?: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedAmt, setSelectedAmt] = useState<number>(50);
  const [customAmt, setCustomAmt] = useState('');
  const [giftType, setGiftType] = useState<'one-time' | 'monthly'>('one-time');
  const initialRegion = useMemo(() => {
    const qp = (searchParams.get('region') ?? '').trim().toLowerCase();
    if (qp === 'luzon') return 'Luzon';
    if (qp === 'visayas') return 'Visayas';
    if (qp === 'mindanao') return 'Mindanao';
    return '';
  }, [searchParams]);
  const [region, setRegion] = useState(initialRegion);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [honorToggle, setHonorToggle] = useState(false);
  const [honoreeName, setHonoreeName] = useState('');
  const [honoreeEmail, setHonoreeEmail] = useState('');
  const [honorNote, setHonorNote] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalAmount = useMemo(() => {
    const parsed = Number(customAmt);
    if (customAmt.trim() !== '' && Number.isFinite(parsed) && parsed > 0) return parsed;
    return selectedAmt;
  }, [customAmt, selectedAmt]);

  useEffect(() => {
    setRegion(initialRegion);
  }, [initialRegion]);

  // Restore form draft saved before auth redirect
  useEffect(() => {
    const raw = sessionStorage.getItem('donate-form-draft');
    if (!raw) return;
    sessionStorage.removeItem('donate-form-draft');
    try {
      const d = JSON.parse(raw);
      if (d.selectedAmt) setSelectedAmt(d.selectedAmt);
      if (d.customAmt) setCustomAmt(d.customAmt);
      if (d.giftType) setGiftType(d.giftType);
      if (d.region) setRegion(d.region);
      if (d.firstName) setFirstName(d.firstName);
      if (d.lastName) setLastName(d.lastName);
      if (d.email) setEmail(d.email);
      if (d.honorToggle != null) setHonorToggle(d.honorToggle);
      if (d.honoreeName) setHonoreeName(d.honoreeName);
      if (d.honoreeEmail) setHonoreeEmail(d.honoreeEmail);
      if (d.honorNote) setHonorNote(d.honorNote);
    } catch { /* corrupted data — ignore */ }
  }, []);

  // Tie donation records to the signed-in account email (matches /api/donations/my lookup).
  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((session) => {
        if (cancelled || !session.isAuthenticated || !session.email?.trim()) return;
        setEmail((prev) => (prev.trim() === '' ? session.email!.trim() : prev));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    // Check if user is logged in before allowing donation
    try {
      const session = await getSession();
      if (!session.isAuthenticated) {
        const draft = { selectedAmt, customAmt, giftType, region, firstName, lastName, email,
                        honorToggle, honoreeName, honoreeEmail, honorNote };
        sessionStorage.setItem('donate-form-draft', JSON.stringify(draft));
        navigate('/login?redirect=/donate');
        return;
      }
    } catch {
      const draft = { selectedAmt, customAmt, giftType, region, firstName, lastName, email,
                      honorToggle, honoreeName, honoreeEmail, honorNote };
      sessionStorage.setItem('donate-form-draft', JSON.stringify(draft));
      navigate('/login?redirect=/donate');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setSubmitError('Please fill in first name, last name, and email.');
      return;
    }

    if (finalAmount <= 0) {
      setSubmitError('Donation amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await recordDonation({
        amount: finalAmount,
        currencyCode: 'USD',
        isRecurring: giftType === 'monthly',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        region: region || undefined,
        isHonorGift: honorToggle,
        honoreeName: honorToggle ? honoreeName.trim() : undefined,
        honoreeEmail: honorToggle ? honoreeEmail.trim() : undefined,
        honorMessage: honorToggle ? honorNote.trim() : undefined,
      });

      setSubmitSuccess(`Donation recorded successfully. Reference: ${result.donationId}`);
      onDonationSuccess?.();
      setCustomAmt('');
      setSelectedAmt(50);
      setGiftType('one-time');
      setRegion(initialRegion);
      setFirstName('');
      setLastName('');
      setEmail('');
      setHonorToggle(false);
      setHonoreeName('');
      setHonoreeEmail('');
      setHonorNote('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to record donation right now.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="donate-lean-form-card" onSubmit={handleSubmit}>
      <h2>Make a Donation</h2>
      <p>Choose an amount and share your details to support girls in our safehouses.</p>

      {submitError && <div className="donate-lean-alert donate-lean-alert--error">{submitError}</div>}
      {submitSuccess && <div className="donate-lean-alert donate-lean-alert--success">{submitSuccess}</div>}

      <label className="donate-lean-label">Gift Type</label>
      <div className="donate-lean-gift-type">
        <button
          type="button"
          className={`donate-lean-gift-type__btn${giftType === 'one-time' ? ' active' : ''}`}
          onClick={() => setGiftType('one-time')}
        >
          One-Time
        </button>
        <button
          type="button"
          className={`donate-lean-gift-type__btn${giftType === 'monthly' ? ' active' : ''}`}
          onClick={() => setGiftType('monthly')}
        >
          Monthly
        </button>
      </div>

      <label className="donate-lean-label">Amount</label>
      <div className="donate-lean-amount-grid">
        {AMOUNTS.map(({ value, impact }) => (
          <button
            key={value}
            type="button"
            className={`donate-lean-amount-btn${selectedAmt === value && customAmt.trim() === '' ? ' selected' : ''}`}
            onClick={() => {
              setSelectedAmt(value);
              setCustomAmt('');
            }}
          >
            <span className="donate-lean-amount-btn__price">${value}</span>
            <span className="donate-lean-amount-btn__impact">{impact}</span>
          </button>
        ))}
      </div>

      <label htmlFor="donate-region" className="donate-lean-label">Dedicate To Region (Optional)</label>
      <select
        id="donate-region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      >
        <option value="">Where needed most</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <label htmlFor="donate-custom" className="donate-lean-label">Custom amount</label>
      <div className="donate-lean-input-row">
        <span>$</span>
        <input
          id="donate-custom"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Enter amount"
          value={customAmt}
          onChange={(e) => setCustomAmt(e.target.value)}
        />
      </div>

      <div className="honor-row donate-lean-honor-row">
        <div>
          <p>Make this gift in honor of someone</p>
          <small>We'll include your tribute details with the donation.</small>
        </div>
        <button
          type="button"
          className={`toggle${honorToggle ? ' on' : ''}`}
          aria-label="Toggle gift in honor of someone"
          aria-pressed={honorToggle}
          onClick={() => setHonorToggle((prev) => !prev)}
        />
      </div>

      {honorToggle && (
        <div className="donate-lean-honor-fields">
          <div className="donate-lean-two-col">
            <div>
              <label htmlFor="donate-honoree-name" className="donate-lean-label">Honoree Name</label>
              <input
                id="donate-honoree-name"
                type="text"
                placeholder="Who is this gift honoring?"
                value={honoreeName}
                onChange={(e) => setHonoreeName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="donate-honoree-email" className="donate-lean-label">Honoree Email</label>
              <input
                id="donate-honoree-email"
                type="email"
                placeholder="honoree@example.com"
                value={honoreeEmail}
                onChange={(e) => setHonoreeEmail(e.target.value)}
              />
            </div>
          </div>

          <label htmlFor="donate-honor-note" className="donate-lean-label">Tribute Message (Optional)</label>
          <textarea
            id="donate-honor-note"
            placeholder="Write a short note"
            rows={3}
            value={honorNote}
            onChange={(e) => setHonorNote(e.target.value)}
          />
        </div>
      )}

      <div className="donate-lean-two-col">
        <div>
          <label htmlFor="donate-first" className="donate-lean-label">First Name</label>
          <input
            id="donate-first"
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="donate-last" className="donate-lean-label">Last Name</label>
          <input
            id="donate-last"
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <label htmlFor="donate-email" className="donate-lean-label">Email</label>
      <input
        id="donate-email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button className="donate-btn donate-lean-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? 'Submitting...'
          : `Submit ${giftType === 'monthly' ? 'Monthly ' : ''}Donation (${finalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })})`}
      </button>
      <p className="donate-lean-note">This records your donation request. Payment processing is not enabled yet.</p>
    </form>
  );
}
