// src/components/donate/DonationInfo.tsx
import DonorHistory from './DonorHistory';

const IMPACT_ITEMS = [
  'Safe housing and daily essentials',
  'Trauma-informed counseling support',
  'Education and reintegration planning',
];

export default function DonationInfo({ refreshKey }: { refreshKey?: number }) {
  return (
    <div>
      <aside className="donate-lean-info-card" aria-label="How donations help">
        <h3>How your gift helps</h3>
        <ul>
          {IMPACT_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="donate-lean-info-stat">
          <div className="donate-lean-info-stat__num">100%</div>
          <div className="donate-lean-info-stat__label">direct program support</div>
        </div>
      </aside>

      <DonorHistory refreshKey={refreshKey} />
    </div>
  );
}
