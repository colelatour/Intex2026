import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getResidentReportExitPathways,
  getResidentReportFilters,
  getResidentReportLengthOfStay,
  getResidentReportOutcomes,
  getResidentReportStatusBreakdown,
  getResidentReportSummary,
  getResidentReportTrends,
  type ResidentReportQuery,
} from '../../../lib/residentReportsApi';
import type {
  ResidentExitPathway,
  ResidentFilterOptions,
  ResidentLengthOfStayBucket,
  ResidentOutcomeBar,
  ResidentReportSummary,
  ResidentStatusSlice,
  ResidentTrendPoint,
} from '../../../types/ResidentReports';

const GRANULARITY_OPTIONS = [
  { value: 'month', label: 'Monthly' },
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
] as const;

const PIE_COLORS = ['#022846', '#0f3e5f', '#356272', '#d4a018', '#f59e0b', '#7c9fb0'];
const BAR_COLORS = ['#0f3e5f', '#356272', '#d4a018', '#f59e0b', '#7c9fb0', '#022846'];

function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatDays(value: number): string {
  return `${value.toLocaleString()} days`;
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

export default function ResidentOutcomesPage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [status, setStatus] = useState('');
  const [safehouseId, setSafehouseId] = useState('');
  const [caseCategory, setCaseCategory] = useState('');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('month');

  const [summary, setSummary] = useState<ResidentReportSummary | null>(null);
  const [trends, setTrends] = useState<ResidentTrendPoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<ResidentStatusSlice[]>([]);
  const [lengthOfStay, setLengthOfStay] = useState<ResidentLengthOfStayBucket[]>([]);
  const [outcomes, setOutcomes] = useState<ResidentOutcomeBar[]>([]);
  const [exitPathways, setExitPathways] = useState<ResidentExitPathway[]>([]);
  const [filters, setFilters] = useState<ResidentFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResidentReportFilters()
      .then((data) => {
        setFilters(data);
        if (data.earliestAdmissionDate) {
          setStartDate(data.earliestAdmissionDate);
        }
        if (data.latestAdmissionDate) {
          setEndDate(data.latestAdmissionDate);
        }
      })
      .catch(() => setFilters(null));
  }, []);

  useEffect(() => {
    const query: ResidentReportQuery = {
      startDate,
      endDate,
      status: status || null,
      safehouseId: safehouseId || null,
      caseCategory: caseCategory || null,
      granularity,
    };

    setLoading(true);
    setError(null);

    Promise.all([
      getResidentReportSummary(query),
      getResidentReportTrends(query),
      getResidentReportStatusBreakdown(query),
      getResidentReportLengthOfStay(query),
      getResidentReportOutcomes(query),
      getResidentReportExitPathways(query),
    ])
      .then(([summaryData, trendData, statusData, lengthData, outcomeData, exitData]) => {
        setSummary(summaryData);
        setTrends(trendData);
        setStatusBreakdown(statusData);
        setLengthOfStay(lengthData);
        setOutcomes(outcomeData);
        setExitPathways(exitData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load resident outcomes.');
      })
      .finally(() => setLoading(false));
  }, [caseCategory, endDate, granularity, safehouseId, startDate, status]);

  const hasData = (summary?.totalResidentsInRange ?? 0) > 0;

  return (
    <section className="reports-page">
      <div className="reports-page__intro">
        <p className="reports-page__eyebrow">Reports & Analytics</p>
        <h2>Resident Outcomes</h2>
        <p>
          Understand resident flow through the program using admissions, closures, reintegration progress, and stay
          duration so the team can spot bottlenecks and improve care delivery.
        </p>
      </div>

      <div className="reports-filters">
        <div className="reports-filter">
          <label htmlFor="resident-report-start">Start date</label>
          <input id="resident-report-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div className="reports-filter">
          <label htmlFor="resident-report-end">End date</label>
          <input id="resident-report-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div className="reports-filter">
          <label htmlFor="resident-report-status">Resident status</label>
          <select id="resident-report-status" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {filters?.statuses.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter">
          <label htmlFor="resident-report-safehouse">Safehouse</label>
          <select id="resident-report-safehouse" value={safehouseId} onChange={e => setSafehouseId(e.target.value)}>
            <option value="">All safehouses</option>
            {filters?.safehouses.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter">
          <label htmlFor="resident-report-category">Case category</label>
          <select id="resident-report-category" value={caseCategory} onChange={e => setCaseCategory(e.target.value)}>
            <option value="">All categories</option>
            {filters?.caseCategories.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter">
          <label htmlFor="resident-report-granularity">Trend granularity</label>
          <select
            id="resident-report-granularity"
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

        <div className="reports-filter reports-filter--actions">
          <button
            type="button"
            className="filter-btn"
            onClick={() => {
              setStartDate(filters?.earliestAdmissionDate || defaults.startDate);
              setEndDate(filters?.latestAdmissionDate || defaults.endDate);
              setStatus('');
              setSafehouseId('');
              setCaseCategory('');
              setGranularity('month');
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {error && (
        <div className="report-error">
          <strong>Could not load resident outcomes.</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="reports-kpis">
        <article className="report-card kpi-card blue">
          <div className="kpi-card__label">Residents in Range</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : summary.totalResidentsInRange.toLocaleString()}</div>
          <div className="kpi-card__sub">Shows intake volume and the size of the population under review.</div>
        </article>

        <article className="report-card kpi-card gold">
          <div className="kpi-card__label">Active Residents</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : summary.activeResidents.toLocaleString()}</div>
          <div className="kpi-card__sub">Helps admins monitor current caseload and staffing pressure.</div>
        </article>

        <article className="report-card kpi-card teal">
          <div className="kpi-card__label">Completion Rate</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : `${summary.completionRate.toFixed(1)}%`}</div>
          <div className="kpi-card__sub">Measures how often residents reach a completed reintegration status.</div>
        </article>

        <article className="report-card kpi-card orange">
          <div className="kpi-card__label">Avg Length of Stay</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatDays(summary.averageLengthOfStayDays)}</div>
          <div className="kpi-card__sub">Highlights throughput and whether residents are staying longer than expected.</div>
        </article>

        <article className="report-card kpi-card red">
          <div className="kpi-card__label">Intake Change</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatPercent(summary.intakeChangePercent)}</div>
          <div className="kpi-card__sub">Signals rising demand or slower intake compared with the prior period.</div>
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--wide">
          <div className="report-card__header">
            <div>
              <h3>Resident Trends</h3>
              <SectionHelp>
                Compares admissions and active caseload over time. Admins can use this to spot growth, seasonal intake,
                or a widening gap between new entries and residents exiting care.
              </SectionHelp>
            </div>
          </div>

          {loading ? (
            <div className="chart-placeholder">Loading resident trends…</div>
          ) : !hasData || trends.length === 0 ? (
            <EmptyState
              title="No resident trend data"
              message="Expand the date range or remove filters to view admissions and active caseload movement."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#486173' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newResidents" name="New residents" stroke="#d4a018" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="activeResidents" name="Active residents" stroke="#0f3e5f" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="report-card">
          <h3>Status Breakdown</h3>
          <SectionHelp>
            Gives a quick snapshot of current program mix. A large closed or on-hold segment may indicate service friction
            or follow-up gaps.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading status breakdown…</div>
          ) : !hasData || statusBreakdown.length === 0 ? (
            <EmptyState
              title="No status data"
              message="No residents matched the current filters."
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="label" innerRadius={56} outerRadius={88} paddingAngle={2}>
                    {statusBreakdown.map((slice, index) => (
                      <Cell key={slice.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Residents']} />
                </PieChart>
              </ResponsiveContainer>

              <div className="report-legend">
                {statusBreakdown.map((slice, index) => (
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
        <article className="report-card">
          <h3>Length of Stay</h3>
          <SectionHelp>
            Shows how long residents typically remain in care. This helps identify bottlenecks, unusually long cases, or
            very short stays that may signal early disengagement.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading stay duration…</div>
          ) : !hasData || lengthOfStay.length === 0 ? (
            <EmptyState title="No stay-duration data" message="There are no admission records in the selected period." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={lengthOfStay} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#486173' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Residents']} />
                <Bar dataKey="count" fill="#356272" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="report-card">
          <h3>Reintegration Outcomes</h3>
          <SectionHelp>
            Uses the available reintegration status field as the closest structured outcome signal. Admins can compare
            how many residents are progressing, completed, paused, or missing an outcome record.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading outcomes…</div>
          ) : !hasData || outcomes.length === 0 ? (
            <EmptyState title="No outcome data" message="Outcome distribution appears once matching residents are found." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={outcomes} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#486173' }} />
                <YAxis dataKey="label" type="category" width={90} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Residents']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {outcomes.map((entry, index) => (
                    <Cell key={entry.label} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--full">
          <h3>Exit Pathways</h3>
          <SectionHelp>
            There is no dedicated exit-reason field in the current schema, so this chart uses reintegration type as the
            closest available closure-pathway indicator. It helps admins see where residents are typically transitioning.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading exit pathways…</div>
          ) : !hasData || exitPathways.length === 0 ? (
            <EmptyState
              title="No closure pathways recorded"
              message="This appears when filtered residents have no closure or reintegration type data."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={exitPathways} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#486173' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Residents']} />
                <Bar dataKey="count" fill="#d4a018" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--wide">
          <h3>Data Notes</h3>
          <SectionHelp>
            This page is built from resident admissions, closures, reintegration status/type, case category, and
            safehouse assignment. The current database does not expose explicit employment or housing outcome fields.
          </SectionHelp>

          <div className="report-insights">
            <div className="report-insight">
              <strong>What this page is best at</strong>
              <p>
                It shows resident throughput, completion mix, case duration, and closure pathways so admins can review
                operational performance and case-flow health.
              </p>
            </div>
            <div className="report-insight">
              <strong>What needs caution</strong>
              <p>
                Exit-pathway analysis uses reintegration type as a proxy because there is no dedicated exit-reason field.
                Missing reintegration records should be treated as a documentation gap, not a negative outcome by default.
              </p>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>Decision Notes</h3>
          <SectionHelp>
            These notes summarize the kinds of actions an admin might take based on the current filtered view.
          </SectionHelp>

          <div className="report-insights">
            <div className="report-insight">
              <strong>Case-flow pressure</strong>
              <p>
                {summary
                  ? `${summary.activeResidents.toLocaleString()} active residents remain in the filtered cohort. If active caseload rises faster than completions, staffing or bed capacity may need review.`
                  : 'Case-flow guidance appears here after the report loads.'}
              </p>
            </div>
            <div className="report-insight">
              <strong>Program completion</strong>
              <p>
                {summary
                  ? `${summary.completionRate.toFixed(1)}% of filtered residents are marked completed. A weak rate can signal service delays, documentation issues, or reintegration barriers.`
                  : 'Completion guidance appears here after the report loads.'}
              </p>
            </div>
            <div className="report-insight">
              <strong>Length of stay</strong>
              <p>
                {summary
                  ? `Average stay is ${formatDays(summary.averageLengthOfStayDays)}. Longer stays may reflect complex cases, while very short stays can indicate onboarding or retention problems.`
                  : 'Stay-duration guidance appears here after the report loads.'}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
