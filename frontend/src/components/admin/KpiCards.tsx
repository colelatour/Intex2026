// src/components/admin/KpiCards.tsx

const KPI_DATA = [
  { label: 'Active Residents',       value: '247',   sub: 'Across all safehouses',  color: 'blue'   },
  { label: 'Donations (This Month)', value: '$8,340', sub: '+14% vs last month',     color: 'gold'   },
  { label: 'Upcoming Conferences',   value: '6',     sub: 'Next 7 days',            color: 'orange' },
  { label: 'At-Risk Flags',          value: '3',     sub: 'Needs attention',        color: 'red'    },
];

export default function KpiCards() {
  return (
    <div className="kpi-row">
      {KPI_DATA.map((k) => (
        <div className={`kpi-card ${k.color}`} key={k.label}>
          <div className="kpi-card__label">{k.label}</div>
          <div className="kpi-card__num">{k.value}</div>
          <div className="kpi-card__sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
