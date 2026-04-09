// src/components/admin/KpiCards.tsx
import { useNavigate } from 'react-router-dom';
import type { DashboardKpis } from '../../types/AdminDashboard';

interface Props {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

export default function KpiCards({ kpis, loading }: Props) {
  const navigate = useNavigate();

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
        {
          label: 'Amount of Referrals',
          value: String(kpis.totalReferrals),
          sub: 'Total tips submitted',
          color: 'teal',
          link: '/admin/referrals',
        },
      ]
    : [];

  return (
    <div className="kpi-row">
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div className="kpi-card blue" key={i} style={{ opacity: 0.5 }}>
              <div className="kpi-card__label">Loading…</div>
              <div className="kpi-card__num">—</div>
              <div className="kpi-card__sub">&nbsp;</div>
            </div>
          ))
        : cards.map((k) => (
            <div
              className={`kpi-card ${k.color}${'link' in k ? ' kpi-card--clickable' : ''}`}
              key={k.label}
              onClick={'link' in k ? () => navigate(k.link as string) : undefined}
              style={'link' in k ? { cursor: 'pointer' } : undefined}
            >
              <div className="kpi-card__label">{k.label}</div>
              <div className="kpi-card__num">{k.value}</div>
              <div className="kpi-card__sub">
                {k.sub}
                {'link' in k && <span className="kpi-card__arrow"> →</span>}
              </div>
            </div>
          ))}
    </div>
  );
}
