// src/components/home/HealingSteps.tsx

const STEPS = [
  {
    num: 1,
    title: 'Intake & Assessment',
    body: 'Girls are referred to us through partner agencies. We assess their needs and create an individualized care plan.',
  },
  {
    num: 2,
    title: 'Safe Housing',
    body: 'Residents move into a secure safehouse with safe meals, clothing, a safe home, and caring community.',
  },
  {
    num: 3,
    title: 'Counseling & Education',
    body: 'Trauma counseling sessions, individual counseling, and life skills programs are provided throughout their stay.',
  },
  {
    num: 4,
    title: 'Reintegration',
    body: 'Girls leave equipped and empowered to return safely to their communities and families with ongoing support.',
  },
];

export default function HealingSteps() {
  return (
    <div className="healing-section">
      <div className="healing-section__inner">
        <div className="section-eyebrow">How It Works</div>
        <h2 className="section__title">The Road to Healing</h2>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div className="step-card" key={step.num}>
              <div className="step-card__num">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
