import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ImpactTrends } from '../../hooks/useImpactTrends';

interface Props {
  data: ImpactTrends | null;
  loading: boolean;
}

const BRAND_NAVY = '#022846';
const BRAND_GOLD = '#d4a018';
const BRAND_TEAL = '#356272';
const GRID_COLOR = '#d9e2ea';
const TICK_COLOR = '#4d6478';

function fmtMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function TrendCharts({ data, loading }: Props) {
  const educationData = (data?.educationTrend ?? []).map((p) => ({
    label: fmtMonth(p.month),
    value: p.avgEducationProgress,
  }));

  const healthData = (data?.healthTrend ?? []).map((p) => ({
    label: fmtMonth(p.month),
    value: p.avgHealthScore,
  }));

  return (
    <section className="impact-section" aria-labelledby="trends-heading">
      <h2 className="impact-section-title" id="trends-heading">Progress over time</h2>
      <p className="impact-section-subtitle">
        Tracking real improvement month by month across all 9 safehouses.
      </p>

      <div className="trends-grid">
        {/* Education chart */}
        <div className="trend-chart-card">
          <h3 className="trend-chart-card__title">Education Progress</h3>
          <p className="trend-chart-card__desc">
            Tracks each girl's curriculum completion — 0 to 100%. Averaged across all safehouses monthly.
          </p>
          {loading ? (
            <div className="skeleton skeleton-chart" aria-label="Loading education chart" />
          ) : (
            <ResponsiveContainer width="100%" height={240} aria-label="Education progress trend line chart">
              <LineChart data={educationData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK_COLOR }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: TICK_COLOR }} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}%` : String(v ?? ''), 'Avg Progress']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={BRAND_TEAL}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: BRAND_TEAL, stroke: BRAND_NAVY, strokeWidth: 1 }}
                  name="Education Progress"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {!loading && (
            <div className="chart-interpretation">
              <p>
                <strong>What this means:</strong>{' '}
                This chart tracks average curriculum completion across all safehouses each month.
                The steady climb from 33% to over 84% over two years shows that as the program
                has matured and more girls have been enrolled longer, the overall education level
                across all our safehouses has risen consistently.
              </p>
            </div>
          )}
        </div>

        {/* Health chart */}
        <div className="trend-chart-card">
          <h3 className="trend-chart-card__title">Health Score</h3>
          <p className="trend-chart-card__desc">
            Tracks nutrition, sleep, and energy on a 1–5 scale. Averaged across all safehouses monthly.
          </p>
          {loading ? (
            <div className="skeleton skeleton-chart" aria-label="Loading health chart" />
          ) : (
            <ResponsiveContainer width="100%" height={240} aria-label="Health score trend line chart">
              <LineChart data={healthData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK_COLOR }} />
                <YAxis domain={[2.5, 5]} tickCount={6} tick={{ fontSize: 11, fill: TICK_COLOR }} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? v.toFixed(2) : String(v ?? ''), 'Avg Health Score']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={BRAND_GOLD}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: BRAND_GOLD, stroke: BRAND_NAVY, strokeWidth: 1 }}
                  name="Health Score"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {!loading && (
            <div className="chart-interpretation">
              <p>
                <strong>What this means:</strong>{' '}
                Health is measured across four dimensions — nutrition, sleep quality, energy, and
                general wellbeing — on a 1 to 5 scale, where 3 is stable and 5 is thriving. A
                score of 3.03 on arrival reflects the physical toll that trauma and instability
                takes on a girl's body. Reaching 3.40 and climbing reflects real improvements in
                nutrition, sleep, and physical energy as girls stabilise in a safe environment.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
