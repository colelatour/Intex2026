import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { EducationJourneyPoint } from '../../hooks/useEducationJourney';

interface Props {
  data: EducationJourneyPoint[] | null;
  loading: boolean;
  error: string | null;
}

const LINE_COLOR = '#356272';
const NAVY_COLOR = '#022846';
const GOLD_COLOR = '#d4a018';
const GRID_COLOR = '#d9e2ea';
const TICK_COLOR = '#4d6478';

function xLabel(monthOffset: number): string {
  return monthOffset === 0 ? 'Arrival' : `Month ${monthOffset}`;
}

type ChartRow = EducationJourneyPoint & { label: string; value: number };

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ChartRow;
  return (
    <div className="journey-tooltip">
      <div className="journey-tooltip__title">{row.label}</div>
      <div>Average progress: <strong>{row.value.toFixed(1)}%</strong></div>
      <div className="journey-tooltip__meta">Girls included: {row.girlsIncluded}</div>
    </div>
  );
}

export default function EducationJourneyChart({ data, loading, error }: Props) {
  // Truncate to months 0–5 only
  const chartData = (data ?? [])
    .filter((p) => p.monthOffset <= 5)
    .map((p) => ({
      ...p,
      label: xLabel(p.monthOffset),
      value: p.avgProgress,
    }));

  const arrivalPoint = chartData[0] ?? null;
  const month5Point  = chartData.find((p) => p.monthOffset === 5) ?? null;
  const gainByMonth5 = arrivalPoint && month5Point
    ? Math.max(0, month5Point.value - arrivalPoint.value)
    : 0;

  return (
    <section className="impact-section" aria-labelledby="journey-heading">
      <h2 className="impact-section-title" id="journey-heading">
        A girl's journey through education with Sheltered Light
      </h2>
      <p className="impact-section-subtitle">
        Girls arrive behind. They leave ready.
      </p>

      <div className="trend-chart-card">
        {!loading && !error && (
          <div className="journey-summary" aria-label="Education journey highlights">
            <div className="journey-summary__card">
              <div className="journey-summary__value">{arrivalPoint?.value.toFixed(0) ?? '0'}%</div>
              <div className="journey-summary__label">average on arrival</div>
            </div>
            <div className="journey-summary__card journey-summary__card--teal">
              <div className="journey-summary__value">{month5Point?.value.toFixed(0) ?? '0'}%</div>
              <div className="journey-summary__label">average by month 5</div>
            </div>
            <div className="journey-summary__card">
              <div className="journey-summary__value">+{gainByMonth5.toFixed(0)} pts</div>
              <div className="journey-summary__label">progress gained</div>
            </div>
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="skeleton skeleton-chart" aria-label="Loading education journey chart" />
        ) : error ? (
          <div className="impact-error" role="alert">
            Unable to load education journey data.
          </div>
        ) : (
          <div className="journey-chart-shell">
            <ResponsiveContainer
              width="100%"
              height={320}
              aria-label="Area chart: education progress by months in program"
            >
              <AreaChart data={chartData} margin={{ top: 20, right: 24, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="eduJourneyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={LINE_COLOR} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: TICK_COLOR }}
                interval={0}
                label={{
                  value: 'Months after joining the program',
                  position: 'insideBottom',
                  offset: -1,
                  fontSize: 11,
                  fill: TICK_COLOR,
                }}
                height={42}
              />
              <YAxis
                domain={[40, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12, fill: TICK_COLOR }}
                label={{
                  value: '% of curriculum completed',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fontSize: 11,
                  fill: TICK_COLOR,
                  style: { textAnchor: 'middle' },
                }}
                width={80}
              />
              <Tooltip content={CustomTooltip} />
              <Area
                type="monotoneX"
                dataKey="value"
                stroke={LINE_COLOR}
                strokeWidth={3}
                fill="url(#eduJourneyFill)"
                dot={{ r: 4, fill: LINE_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: LINE_COLOR, stroke: NAVY_COLOR, strokeWidth: 1 }}
                name="Education Progress"
              />
              {/* Arrival marker */}
              {arrivalPoint && (
                <ReferenceDot
                  x={arrivalPoint.label}
                  y={arrivalPoint.value}
                  r={5}
                  fill={GOLD_COLOR}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
              {/* Month 5 marker */}
              {month5Point && (
                <ReferenceDot
                  x={month5Point.label}
                  y={month5Point.value}
                  r={5}
                  fill={LINE_COLOR}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Interpretation paragraph */}
        {!loading && !error && (
          <div className="chart-interpretation">
            <p>
              <strong>What this means in real life:</strong>{' '}
              When a girl first arrives at a Sheltered Light safehouse, she is typically midway through
              her schooling — often with significant gaps caused by trauma, displacement, or years
              out of the classroom. Within just 5 months, the average girl has caught up to over
              90% curriculum completion. By month 10, she is nearly finished. This isn't just
              academic progress — it represents a girl rebuilding confidence, routine, and a future
              she can picture.
            </p>
          </div>
        )}

        <p className="journey-footnote">
          Each data point represents the average across all girls at that stage of their stay.
          Showing first 5 months; data covers 60 girls across 9 safehouses.
        </p>
      </div>
    </section>
  );
}
