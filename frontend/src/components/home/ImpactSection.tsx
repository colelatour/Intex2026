// src/components/home/ImpactSection.tsx

const IMPACT_ITEMS = [
  'Funding is transparently tracked and allocated across safehouse programs',
  'Donor-funded updates tied to real resident outcomes, not just general stats',
  'Multiple ways to give — monthly, lump sum, skills, or social media advocacy',
  'All data handled with strict privacy protections for residents and donors',
];

export default function ImpactSection() {
  return (
    <div className="impact-section">
      <div className="impact-section__inner">
        <div>
          <div className="section-eyebrow">Your Impact</div>
          <h2 className="section__title">
            Every Gift Directly<br />Changes a Life
          </h2>
          <ul className="impact-list">
            {IMPACT_ITEMS.map((item) => (
              <li key={item}>
                <div className="check-icon">✓</div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="impact__video-placeholder">
          <svg width="36" height="36" fill="none" stroke="#e8c06a" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M10 8l6 4-6 4V8z" fill="#e8c06a" stroke="none" />
          </svg>
          <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>Learner Testimony</span>
          <span style={{ color: '#c8950f', fontSize: '0.7rem' }}>Click to watch</span>
        </div>
      </div>
    </div>
  );
}
