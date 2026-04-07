import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ImpactSummary } from '../../hooks/useImpactSummary';

interface Props {
  data: ImpactSummary | null;
  loading: boolean;
}

const BAR_COLORS = ['#c0533a', '#e07b5a', '#2a7a6a', '#5aaa8a', '#d4956a', '#7a6e68'];

function fmtPhp(n: number): string {
  return '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}

export default function DonationsSection({ data, loading }: Props) {
  const d = data?.donations;
  const chartData = (d?.byProgramArea ?? []).map((a) => ({
    name: a.area,
    amount: Number(a.amountPhp),
  }));

  return (
    <section className="impact-section" aria-labelledby="donations-heading">
      <h2 className="impact-section-title" id="donations-heading">Donations at work</h2>
      <p className="impact-section-subtitle">Every peso is accounted for and goes directly to the girls.</p>

      <div className="donations-grid">
        {/* Bar chart */}
        <div className="donations-chart-card">
          <h3 className="donations-chart-card__title">Where your donations go</h3>
          {loading ? (
            <div className="skeleton skeleton-chart" aria-label="Loading donation breakdown chart" />
          ) : (
            <ResponsiveContainer width="100%" height={260} aria-label="Bar chart of donations by program area">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 56 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede8e2" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#9a8e88' }}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#5a4e48' }} width={54} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? fmtPhp(v) : String(v ?? ''), 'Allocated']} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} name="Amount (PHP)">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats */}
        <div className="donations-stats-card">
          <h3 className="donations-stats-card__title">Our donor community</h3>

          {loading ? (
            <>
              <div className="skeleton" style={{ height: 40, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 40, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 40 }} />
            </>
          ) : (
            <>
              <div className="donations-stat-row">
                <span className="donations-stat-row__num">{fmtPhp(d?.totalPhp ?? 0)}</span>
                <span className="donations-stat-row__label">total donations received</span>
              </div>
              <div className="donations-stat-row">
                <span className="donations-stat-row__num">{d?.uniqueSupporters ?? 0}</span>
                <span className="donations-stat-row__label">unique supporters</span>
              </div>
              <div className="donations-stat-row">
                <span className="donations-stat-row__num">{d?.recurringDonationCount ?? 0}</span>
                <span className="donations-stat-row__label">recurring donation commitments</span>
              </div>
              <p className="donations-copy">
                Our donors don't give once — they stay.{' '}
                <strong>{d?.recurringDonationCount ?? 0} recurring contributions</strong> show the sustained
                trust our community places in this mission.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
