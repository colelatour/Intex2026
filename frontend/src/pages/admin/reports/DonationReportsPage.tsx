import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getDonationReportBreakdown,
  getDonationReportDistribution,
  getDonationReportFilterOptions,
  getDonationReportSummary,
  getDonationReportTopContributors,
  getDonationReportTrends,
  type DonationReportQuery,
} from '../../../lib/donationsApi';
import type {
  DonationBreakdownSlice,
  DonationDistributionBucket,
  DonationFilterOptions,
  DonationReportSummary,
  DonationTrendPoint,
  TopContributor,
} from '../../../types/DonationReports';

const BREAKDOWN_OPTIONS = [
  { value: 'campaign', label: 'Campaign' },
  { value: 'channel', label: 'Channel' },
  { value: 'recurring', label: 'Donation cadence' },
  { value: 'type', label: 'Donation type' },
] as const;

const GRANULARITY_OPTIONS = [
  { value: 'month', label: 'Monthly' },
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
] as const;

const PIE_COLORS = ['#022846', '#0f3e5f', '#356272', '#d4a018', '#f59e0b', '#7c9fb0'];

function formatCurrency(value: number): string {
  return '₱' + value.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="report-empty">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function SectionHelp({ children }: { children: React.ReactNode }) {
  return <p className="report-help">{children}</p>;
}

export default function DonationReportsPage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [campaign, setCampaign] = useState<string>('');
  const [breakdown, setBreakdown] = useState<string>('campaign');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('month');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  const [summary, setSummary] = useState<DonationReportSummary | null>(null);
  const [trends, setTrends] = useState<DonationTrendPoint[]>([]);
  const [distribution, setDistribution] = useState<DonationDistributionBucket[]>([]);
  const [breakdownData, setBreakdownData] = useState<DonationBreakdownSlice[]>([]);
  const [contributors, setContributors] = useState<TopContributor[]>([]);
  const [options, setOptions] = useState<DonationFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDonationReportFilterOptions()
      .then(setOptions)
      .catch(() => setOptions(null));
  }, []);

  useEffect(() => {
    const query: DonationReportQuery = {
      startDate,
      endDate,
      campaign: campaign || null,
      breakdown,
      granularity,
      minAmount: minAmount === '' ? null : Number(minAmount),
      maxAmount: maxAmount === '' ? null : Number(maxAmount),
    };

    setLoading(true);
    setError(null);

    Promise.all([
      getDonationReportSummary(query),
      getDonationReportTrends(query),
      getDonationReportDistribution(query),
      getDonationReportBreakdown(query),
      getDonationReportTopContributors(query),
    ])
      .then(([summaryData, trendData, distributionData, breakdownSlices, topContributors]) => {
        setSummary(summaryData);
        setTrends(trendData);
        setDistribution(distributionData);
        setBreakdownData(breakdownSlices);
        setContributors(topContributors);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load donation reports.');
      })
      .finally(() => setLoading(false));
  }, [breakdown, campaign, endDate, granularity, maxAmount, minAmount, startDate]);

  const hasData = (summary?.donationCount ?? 0) > 0;

  return (
    <section className="reports-page">
      <div className="reports-page__intro">
        <p className="reports-page__eyebrow">Reports & Analytics</p>
        <h2>Donation Outcomes</h2>
        <p>
          Track giving performance, donor concentration, and campaign mix so the team can spot momentum shifts and
          decide where to focus outreach.
        </p>
      </div>

      <div className="reports-filters">
        <div className="reports-filter">
          <label htmlFor="report-start-date">Start date</label>
          <input id="report-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div className="reports-filter">
          <label htmlFor="report-end-date">End date</label>
          <input id="report-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div className="reports-filter">
          <label htmlFor="report-campaign">Campaign</label>
          <select id="report-campaign" value={campaign} onChange={e => setCampaign(e.target.value)}>
            <option value="">All campaigns</option>
            {options?.campaigns.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter">
          <label htmlFor="report-breakdown">Breakdown</label>
          <select id="report-breakdown" value={breakdown} onChange={e => setBreakdown(e.target.value)}>
            {BREAKDOWN_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter">
          <label htmlFor="report-granularity">Trend granularity</label>
          <select
            id="report-granularity"
            value={granularity}
            onChange={e => setGranularity(e.target.value as 'day' | 'week' | 'month')}
          >
            {GRANULARITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter reports-filter--compact">
          <label htmlFor="report-min-amount">Min amount</label>
          <input
            id="report-min-amount"
            type="number"
            min="0"
            placeholder={String(options?.suggestedMinAmount ?? 0)}
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
          />
        </div>

        <div className="reports-filter reports-filter--compact">
          <label htmlFor="report-max-amount">Max amount</label>
          <input
            id="report-max-amount"
            type="number"
            min="0"
            placeholder={String(options?.suggestedMaxAmount ?? 0)}
            value={maxAmount}
            onChange={e => setMaxAmount(e.target.value)}
          />
        </div>

        <div className="reports-filter reports-filter--actions">
          <button
            type="button"
            className="filter-btn"
            onClick={() => {
              setStartDate(defaults.startDate);
              setEndDate(defaults.endDate);
              setCampaign('');
              setBreakdown('campaign');
              setGranularity('month');
              setMinAmount('');
              setMaxAmount('');
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {error && (
        <div className="report-error">
          <strong>Could not load donation analytics.</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="reports-kpis">
        <article className="report-card kpi-card blue">
          <div className="kpi-card__label">Total in Range</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatCurrency(summary.totalDonationsInRange)}</div>
          <div className="kpi-card__sub">Shows how much revenue the selected period generated.</div>
        </article>

        <article className="report-card kpi-card gold">
          <div className="kpi-card__label">Average Donation</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatCurrency(summary.averageDonation)}</div>
          <div className="kpi-card__sub">Useful for judging donor quality and offer positioning.</div>
        </article>

        <article className="report-card kpi-card teal">
          <div className="kpi-card__label">Donor Count</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : summary.donorCount.toLocaleString()}</div>
          <div className="kpi-card__sub">Tracks reach and whether fundraising depends on a small donor base.</div>
        </article>

        <article className="report-card kpi-card orange">
          <div className="kpi-card__label">% Change vs Previous</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatPercent(summary.percentChangeFromPreviousPeriod)}</div>
          <div className="kpi-card__sub">Flags momentum shifts that may need campaign or outreach changes.</div>
        </article>

        <article className="report-card kpi-card red">
          <div className="kpi-card__label">Median Donation</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatCurrency(summary.medianDonation)}</div>
          <div className="kpi-card__sub">Balances outliers and shows the typical gift size more honestly.</div>
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--wide">
          <div className="report-card__header">
            <div>
              <h3>Donation Trend</h3>
              <SectionHelp>
                Shows donation volume over time. Admins can use this to identify growth, seasonality, or sudden declines
                that may indicate campaign fatigue or weaker engagement.
              </SectionHelp>
            </div>
          </div>

          {loading ? (
            <div className="chart-placeholder">Loading trend data…</div>
          ) : !hasData || trends.length === 0 ? (
            <EmptyState
              title="No trend data in this range"
              message="Try widening the date range or removing filters to inspect longer-term giving patterns."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="donationTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f3e5f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f3e5f" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#486173' }} />
                <YAxis tickFormatter={(value: number) => `₱${Math.round(value / 1000)}k`} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'Donation count' ? value.toLocaleString() : formatCurrency(value),
                    name,
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  name="Total donated"
                  stroke="#0f3e5f"
                  fill="url(#donationTrendFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="report-card">
          <h3>Donation Distribution</h3>
          <SectionHelp>
            Groups donations into amount bands so admins can see whether giving is driven by many modest gifts or a small
            number of large outliers.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading distribution…</div>
          ) : !hasData || distribution.length === 0 ? (
            <EmptyState
              title="No distribution to display"
              message="This appears when there are no donations after applying the current filters."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distribution} margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#486173' }} angle={-15} textAnchor="end" height={52} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Donations']} />
                <Bar dataKey="donationCount" fill="#d4a018" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="report-card report-card--full">
          <h3>{BREAKDOWN_OPTIONS.find(option => option.value === breakdown)?.label} Breakdown</h3>
          <SectionHelp>
            Shows where donation value is concentrated. Use this to decide which campaigns, channels, or gift types
            deserve more investment or cleanup.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading breakdown…</div>
          ) : !hasData || breakdownData.length === 0 ? (
            <EmptyState
              title="No breakdown available"
              message="There is not enough filtered data to draw a meaningful contribution split."
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    dataKey="totalAmount"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Total donated']} />
                </PieChart>
              </ResponsiveContainer>

              <div className="report-legend">
                {breakdownData.map((slice, index) => (
                  <div key={slice.label} className="report-legend__item">
                    <span className="report-legend__swatch" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span>{slice.label}</span>
                    <strong>{slice.percentage.toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--wide">
          <h3>Top Contributors</h3>
          <SectionHelp>
            Highlights the donors contributing the most value in the selected period. Admins can use this to prioritize
            stewardship, identify concentration risk, and review which campaigns attract major support.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading top contributors…</div>
          ) : !hasData || contributors.length === 0 ? (
            <EmptyState
              title="No contributors to rank"
              message="No donors matched the current filter set."
            />
          ) : (
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Total Given</th>
                    <th>Donations</th>
                    <th>Primary Campaign</th>
                  </tr>
                </thead>
                <tbody>
                  {contributors.map(row => (
                    <tr key={row.supporterId}>
                      <td>{row.name}</td>
                      <td>{formatCurrency(row.totalAmount)}</td>
                      <td>{row.donationCount}</td>
                      <td>{row.primaryCampaign ?? 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="report-card">
          <h3>Decision Notes</h3>
          <SectionHelp>
            This panel translates the report into likely actions for the admin team.
          </SectionHelp>

          <div className="report-insights">
            <div className="report-insight">
              <strong>Revenue health</strong>
              <p>
                {summary
                  ? `${formatPercent(summary.percentChangeFromPreviousPeriod)} vs the prior period. If this stays negative, review acquisition cadence and campaign timing.`
                  : 'Change vs prior period appears here once the report loads.'}
              </p>
            </div>
            <div className="report-insight">
              <strong>Donor mix</strong>
              <p>
                {summary
                  ? `${summary.donorCount.toLocaleString()} donors generated ${summary.donationCount.toLocaleString()} gifts in the selected range. A small donor base may signal concentration risk.`
                  : 'Donor concentration guidance appears here once the report loads.'}
              </p>
            </div>
            <div className="report-insight">
              <strong>Typical gift size</strong>
              <p>
                {summary
                  ? `Median donation is ${formatCurrency(summary.medianDonation)}. Compare this against the average to judge whether large gifts are skewing the picture.`
                  : 'Typical gift-size guidance appears here once the report loads.'}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
