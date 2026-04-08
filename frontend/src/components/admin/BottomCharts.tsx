// src/components/admin/BottomCharts.tsx
import type { DonationMonth, OutcomeSlice, UpcomingEvent } from '../../types/AdminDashboard';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const OUTCOME_COLORS: Record<string, string> = {
  Progressing:  'var(--gold, #eab308)',
  Monitoring:   'var(--orange, #f97316)',
  'At Risk':    'var(--red, #ef4444)',
  Reintegrated: 'var(--blue, #3b82f6)',
};

interface Props {
  donationsMonthly: DonationMonth[];
  residentOutcomes: OutcomeSlice[];
  upcomingEvents: UpcomingEvent[];
  loading?: boolean;
}

export default function BottomCharts({ donationsMonthly, residentOutcomes, upcomingEvents, loading }: Props) {
  const maxDonation = Math.max(...donationsMonthly.map(d => d.total), 1);
  const totalOutcomes = residentOutcomes.reduce((s, o) => s + o.count, 0) || 1;

  return (
    <div className="bottom-grid">
      {/* Donation Trends */}
      <div className="admin-card">
        <h4>
          Donation Trends
          <span className="admin-card__link">Last {donationsMonthly.length} months</span>
        </h4>
        {loading ? (
          <div className="chart-placeholder">Loading…</div>
        ) : donationsMonthly.length === 0 ? (
          <div className="chart-placeholder">No donation data available.</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '140px', padding: '0.5rem 0' }}>
            {donationsMonthly.map((d) => {
              const pct = Math.max((d.total / maxDonation) * 100, 4);
              return (
                <div key={`${d.year}-${d.month}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <span style={{ fontSize: '0.625rem', color: 'var(--gray-600)', marginBottom: '2px' }}>
                    ₱{d.total >= 1000 ? `${(d.total / 1000).toFixed(0)}k` : d.total.toLocaleString()}
                  </span>
                  <div style={{ width: '100%', maxWidth: '32px', height: `${pct}%`, background: 'var(--navy, #1e3a5f)', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '0.625rem', color: 'var(--gray-600)', marginTop: '2px' }}>
                    {MONTH_NAMES[d.month - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resident Outcomes */}
      <div className="admin-card">
        <h4>
          Resident Outcomes
          <span className="admin-card__link">Status Breakdown</span>
        </h4>
        {loading ? (
          <div className="chart-placeholder">Loading…</div>
        ) : residentOutcomes.length === 0 ? (
          <div className="chart-placeholder">No outcome data.</div>
        ) : (
          <>
            {/* Stacked bar as a simple visual */}
            <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
              {residentOutcomes.map((o) => (
                <div
                  key={o.label}
                  style={{
                    width: `${(o.count / totalOutcomes) * 100}%`,
                    background: OUTCOME_COLORS[o.label] ?? '#94a3b8',
                    minWidth: '2px',
                  }}
                  title={`${o.label}: ${o.count}`}
                />
              ))}
            </div>
            <div className="legend">
              {residentOutcomes.map((o) => (
                <div className="legend-item" key={o.label}>
                  <div className="legend-dot" style={{ background: OUTCOME_COLORS[o.label] ?? '#94a3b8' }} />
                  {o.label} ({o.count})
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="admin-card">
        <h4>
          Upcoming Events
          <span className="admin-card__link">Next 7 days</span>
        </h4>
        {loading ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Loading…</p>
        ) : upcomingEvents.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>No upcoming events.</p>
        ) : (
          upcomingEvents.map((e, i) => (
            <div className="event-item" key={i}>
              <div className="event-date">{e.date}</div>
              <div className="event-info">
                <h5>{e.title}</h5>
                <p>{e.location ?? '—'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
