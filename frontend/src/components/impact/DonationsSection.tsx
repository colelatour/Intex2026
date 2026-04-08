import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ImpactSummary } from '../../hooks/useImpactSummary';

interface Props {
  data: ImpactSummary | null;
  loading: boolean;
}

const BAR_COLORS = ['#022846', '#356272', '#d4a018', '#0f3e5f', '#4d7b8b', '#b68713'];

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
        <div className="donations-chart-card">
          <h3 className="donations-chart-card__title">Where your donations go</h3>
          {loading ? (
            <div className="skeleton skeleton-chart" aria-label="Loading donation breakdown chart" />
          ) : (
            <ResponsiveContainer width="100%" height={260} aria-label="Bar chart of donations by program area">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 56 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d9e2ea" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#4d6478' }}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#022846' }} width={54} />
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
      </div>
    </section>
  );
}
