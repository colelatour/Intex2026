// src/components/home/StatsBar.jsx

const STATS = [
  { num: '247',   label: 'Girls Currently in Care' },
  { num: '1,842', label: 'Successfully Reintegrated' },
  { num: '12',    label: 'Active Safehouses' },
  { num: '38',    label: 'Donors & Partners Worldwide' },
];

export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stats-bar__inner">
        {STATS.map((s) => (
          <div className="stat-item" key={s.label}>
            <span className="stat-item__num">{s.num}</span>
            <div className="stat-item__bar" />
            <span className="stat-item__label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
