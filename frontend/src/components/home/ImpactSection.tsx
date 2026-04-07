// src/components/home/ImpactSection.tsx
import activities from '../../images/activities.png';

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

        <img
          src={activities}
          alt="Residents participating in activities at Sheltered Light"
          className="impact__image"
        />
      </div>
    </div>
  );
}
