// src/components/admin/KpiCards.tsx
import type { DashboardKpis } from '../../types/AdminDashboard';

interface Props {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

export default function KpiCards({ kpis, loading }: Props) {
  const pctChange =
    kpis && kpis.donationsLastMonth > 0
      ? Math.round(
          ((kpis.donationsThisMonth - kpis.donationsLastMonth) / kpis.donationsLastMonth) * 100,
        )
      : null;

  const cards = kpis
    ? [
        {
          label: 'Active Residents',
          value: kpis.activeResidents.toLocaleString(),
          sub: 'Across all safehouses',
          color: 'blue',
        },
        {
          label: 'Donations (This Month)',
          value: `₱${kpis.donationsThisMonth.toLocaleString()}`,
          sub: pctChange !== null ? `${pctChange >= 0 ? '+' : ''}${pctChange}% vs last month` : 'No prior month data',
          color: 'gold',
        },
        {
          label: 'Upcoming Conferences',
          value: String(kpis.upcomingConferences),
          sub: 'Next 7 days',
          color: 'orange',
        },
        {
          label: 'At-Risk Flags',
          value: String(kpis.atRiskResidents),
          sub: 'Needs attention',
          color: 'red',
        },
      ]
    : [];

  return (
    <div className="kpi-row dashboard-kpi-row">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div className="kpi-card blue" key={i} style={{ opacity: 0.5 }}>
              <div className="kpi-card__label">Loading…</div>
              <div className="kpi-card__num">—</div>
              <div className="kpi-card__sub">&nbsp;</div>
            </div>
          ))
        : cards.map((k) => (
            <div className={`kpi-card ${k.color}`} key={k.label}>
              <div className="kpi-card__label">{k.label}</div>
              <div className="kpi-card__num">{k.value}</div>
              <div className="kpi-card__sub">{k.sub}</div>
            </div>
          ))}
    </div>
  );
}
