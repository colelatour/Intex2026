// src/components/donate/DonationForm.tsx
import { useState } from 'react';

const AMOUNTS = [
  { value: 25,   label: '$25',    impact: 'Provides meals for one week' },
  { value: 50,   label: '$50',    impact: 'One counseling session' },
  { value: 100,  label: '$100',   impact: 'School supplies & uniforms' },
  { value: 250,  label: '$250',   impact: 'Monthly care for one resident' },
  { value: 500,  label: '$500',   impact: 'Sponsors a program' },
  { value: 1000, label: '$1,000', impact: 'Delivers major transformation' },
];

const TABS = ['One-Time Gift', 'Monthly Giving', 'In-Kind / Other'];

export default function DonationForm() {
  const [selectedAmt, setSelectedAmt] = useState<number | null>(50);
  const [customAmt, setCustomAmt]     = useState('');
  const [activeTab, setActiveTab]     = useState(0);
  const [honorToggle, setHonorToggle] = useState(false);

  const displayAmount = customAmt
    ? `$${customAmt}`
    : `$${selectedAmt?.toLocaleString()}`;

  const handleAmtClick = (val: number) => {
    setSelectedAmt(val);
    setCustomAmt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmt(e.target.value);
    setSelectedAmt(null);
  };

  return (
    <div className="form-card">
      {/* Header */}
      <div className="form-card__header">
        <h3>Make a Donation</h3>
        <p>100% of your gift goes directly to supporting residents in our safehouses.</p>
        <div className="tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`tab${activeTab === i ? ' active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="form-body">
        <span className="form-label">Select an Amount</span>
        <div className="amount-grid">
          {AMOUNTS.map((a) => (
            <div
              key={a.value}
              className={`amt-btn${selectedAmt === a.value ? ' selected' : ''}`}
              onClick={() => handleAmtClick(a.value)}
            >
              <span className="amt-btn__price">{a.label}</span>
              <div className="amt-btn__impact">{a.impact}</div>
            </div>
          ))}
        </div>

        <span className="form-label">Or enter a custom amount</span>
        <div className="custom-amount">
          <span style={{ color: 'var(--gray-600)', fontWeight: 600 }}>$</span>
          <input
            type="number"
            placeholder="Enter amount"
            value={customAmt}
            onChange={handleCustomChange}
          />
        </div>

        <div className="honor-row">
          <div>
            <p>Make this gift in honor of someone</p>
            <small>We'll send a notification to their email</small>
          </div>
          <button
            className={`toggle${honorToggle ? ' on' : ''}`}
            onClick={() => setHonorToggle(!honorToggle)}
          />
        </div>

        <div className="divider" />

        <span className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
          Your Information
        </span>

        <div className="two-col">
          <div className="field-group">
            <label>First Name</label>
            <input type="text" placeholder="First name" />
          </div>
          <div className="field-group">
            <label>Last Name</label>
            <input type="text" placeholder="Last name" />
          </div>
        </div>

        <div className="field-group">
          <label>Email Address</label>
          <input type="email" placeholder="you@example.com" />
        </div>

        <span className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
          Payment Method
        </span>
        <div className="field-group">
          <input type="text" placeholder="Credit / Debit Card ▾" style={{ cursor: 'pointer' }} readOnly />
        </div>

        <div className="field-group">
          <label>Card Number</label>
          <input type="text" placeholder="•••• •••• •••• ••••" />
        </div>

        <div className="two-col">
          <div className="field-group">
            <label>Expiry</label>
            <input type="text" placeholder="MM / YY" />
          </div>
          <div className="field-group">
            <label>CVV</label>
            <input type="text" placeholder="•••" />
          </div>
        </div>

        <button className="donate-btn">
          🔒 Donate {displayAmount} →
        </button>

        <div className="secure-note">
          🔒 Secure, encrypted payment · Tax-deductible receipt sent to your email
        </div>
      </div>
    </div>
  );
}
