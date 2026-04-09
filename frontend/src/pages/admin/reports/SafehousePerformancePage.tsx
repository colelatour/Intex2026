import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getSafehouseReportComparison,
  getSafehouseReportFilters,
  getSafehouseReportFlow,
  getSafehouseReportOccupancy,
  getSafehouseReportOutcomes,
  getSafehouseReportSummary,
  type SafehouseReportQuery,
} from '../../../lib/safehouseReportsApi';
import type {
  SafehouseComparisonRow,
  SafehouseFilterOptions,
  SafehouseFlowRow,
  SafehouseOccupancyPoint,
  SafehouseOutcomeRow,
  SafehouseSummary,
} from '../../../types/SafehouseReports';

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
  return `${value.toFixed(1)}%`;
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

export default function SafehousePerformancePage() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [safehouseId, setSafehouseId] = useState('');
  const [region, setRegion] = useState('');

  const [summary, setSummary] = useState<SafehouseSummary | null>(null);
  const [occupancy, setOccupancy] = useState<SafehouseOccupancyPoint[]>([]);
  const [comparison, setComparison] = useState<SafehouseComparisonRow[]>([]);
  const [outcomes, setOutcomes] = useState<SafehouseOutcomeRow[]>([]);
  const [flow, setFlow] = useState<SafehouseFlowRow[]>([]);
  const [filters, setFilters] = useState<SafehouseFilterOptions | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSafehouseReportFilters()
      .then((data) => {
        setFilters(data);
        if (data.earliestDate) {
          setStartDate(data.earliestDate);
        }
        if (data.latestDate) {
          setEndDate(data.latestDate);
        }
        setFiltersReady(true);
      })
      .catch(() => {
        setFilters(null);
        setFiltersReady(true);
      });
  }, []);

  useEffect(() => {
    if (!filtersReady) {
      return;
    }

    const query: SafehouseReportQuery = {
      startDate,
      endDate,
      safehouseId: safehouseId || null,
      region: region || null,
    };

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getSafehouseReportSummary(query),
      getSafehouseReportOccupancy(query),
      getSafehouseReportComparison(query),
      getSafehouseReportOutcomes(query),
      getSafehouseReportFlow(query),
    ])
      .then(([summaryData, occupancyData, comparisonData, outcomeData, flowData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setOccupancy(occupancyData);
        setComparison(comparisonData);
        setOutcomes(outcomeData);
        setFlow(flowData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load safehouse performance.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endDate, filtersReady, region, safehouseId, startDate]);

  const hasData = (summary?.totalSafehouses ?? 0) > 0;
  const mostUtilized = comparison[0] ?? null;
  const leastUtilized = comparison.length > 0 ? comparison[comparison.length - 1] : null;

  return (
    <section className="reports-page">
      <div className="reports-page__intro">
        <p className="reports-page__eyebrow">Reports & Analytics</p>
        <h2>Safehouse Performance</h2>
        <p>
          Compare utilization, resident flow, length of stay, and completion patterns across safehouses so the team can
          rebalance capacity and focus operational support where it matters most.
        </p>
      </div>

      <div className="reports-filters">
        <div className="reports-filter">
          <label htmlFor="safehouse-report-start">Start date</label>
          <input id="safehouse-report-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div className="reports-filter">
          <label htmlFor="safehouse-report-end">End date</label>
          <input id="safehouse-report-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div className="reports-filter">
          <label htmlFor="safehouse-report-safehouse">Safehouse</label>
          <select id="safehouse-report-safehouse" value={safehouseId} onChange={e => setSafehouseId(e.target.value)}>
            <option value="">All safehouses</option>
            {filters?.safehouses.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter">
          <label htmlFor="safehouse-report-region">Region</label>
          <select id="safehouse-report-region" value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">All regions</option>
            {filters?.regions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-filter reports-filter--actions">
          <button
            type="button"
            className="filter-btn"
            onClick={() => {
              setStartDate(filters?.earliestDate || defaults.startDate);
              setEndDate(filters?.latestDate || defaults.endDate);
              setSafehouseId('');
              setRegion('');
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {error && (
        <div className="report-error">
          <strong>Could not load safehouse performance.</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="reports-kpis">
        <article className="report-card kpi-card blue">
          <div className="kpi-card__label">Safehouses</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : summary.totalSafehouses.toLocaleString()}</div>
          <div className="kpi-card__sub">Shows how many locations are included in the current operational view.</div>
        </article>

        <article className="report-card kpi-card gold">
          <div className="kpi-card__label">Avg Occupancy Rate</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatPercent(summary.averageOccupancyRate)}</div>
          <div className="kpi-card__sub">Useful for identifying whether the network is generally under or over pressure.</div>
        </article>

        <article className="report-card kpi-card teal">
          <div className="kpi-card__label">Highest Utilization</div>
          <div className="kpi-card__num">
            {loading || !summary?.highestUtilization ? '...' : formatPercent(summary.highestUtilization.utilizationPct)}
          </div>
          <div className="kpi-card__sub">
            {summary?.highestUtilization ? `${summary.highestUtilization.name} is carrying the most load.` : 'Shows the most burdened location.'}
          </div>
        </article>

        <article className="report-card kpi-card orange">
          <div className="kpi-card__label">Residents Housed</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : summary.totalResidentsHoused.toLocaleString()}</div>
          <div className="kpi-card__sub">Tracks current placement volume across the filtered safehouse set.</div>
        </article>

        <article className="report-card kpi-card red">
          <div className="kpi-card__label">Turnover Rate</div>
          <div className="kpi-card__num">{loading || !summary ? '...' : formatPercent(summary.turnoverRate)}</div>
          <div className="kpi-card__sub">Helps show how quickly residents are moving through each safehouse.</div>
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--wide">
          <h3>Occupancy Trend</h3>
          <SectionHelp>
            Tracks active residents and average utilization over time. Safehouses consistently above 90% utilization may
            need redistribution, added beds, or operational support.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading occupancy trends…</div>
          ) : !hasData || occupancy.length === 0 ? (
            <EmptyState title="No occupancy trend data" message="No monthly safehouse metrics matched the current filters." />
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <ComposedChart data={occupancy} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#486173' }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12, fill: '#486173' }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value: number) => `${value}%`} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number, name: string) => [name.includes('%') ? formatPercent(value) : value.toLocaleString(), name]} />
                <Legend />
                <Bar yAxisId="left" dataKey="activeResidents" name="Active residents" fill="#0f3e5f" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="averageUtilizationPct" name="Avg utilization %" stroke="#d4a018" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="report-card">
          <h3>Capacity Utilization</h3>
          <SectionHelp>
            Compares current occupancy against each safehouse’s stated capacity. It highlights overburdened sites and
            locations with unused capacity.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading utilization…</div>
          ) : !hasData || comparison.length === 0 ? (
            <EmptyState title="No utilization data" message="No safehouses matched the current filters." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparison} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" horizontal={false} />
                <XAxis type="number" tickFormatter={(value: number) => `${value}%`} tick={{ fontSize: 12, fill: '#486173' }} />
                <YAxis dataKey="safehouseName" type="category" width={110} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number) => [formatPercent(value), 'Utilization']} />
                <Bar dataKey="utilizationPct" fill="#356272" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--full">
          <h3>Safehouse Comparison</h3>
          <SectionHelp>
            Places utilization, turnover, and average stay side by side so admins can compare operational balance. Low
            turnover with high stay duration can indicate reintegration bottlenecks.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading comparison…</div>
          ) : !hasData || comparison.length === 0 ? (
            <EmptyState title="No comparison data" message="No safehouse comparison rows are available for the current filters." />
          ) : (
            <ResponsiveContainer width="100%" height={310}>
              <ComposedChart data={comparison} margin={{ top: 8, right: 16, left: 0, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="safehouseName" tick={{ fontSize: 11, fill: '#486173' }} />
                <YAxis yAxisId="left" tickFormatter={(value: number) => `${value}%`} tick={{ fontSize: 12, fill: '#486173' }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value: number) => `${value}d`} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number, name: string) => [name.includes('days') ? `${value.toFixed(1)} days` : formatPercent(value), name]} />
                <Legend />
                <Bar yAxisId="left" dataKey="utilizationPct" name="Utilization %" fill="#0f3e5f" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="turnoverRate" name="Turnover %" fill="#d4a018" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="averageLengthOfStayDays" name="Avg stay days" stroke="#7c9fb0" strokeWidth={2.5} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card">
          <h3>Outcomes by Safehouse</h3>
          <SectionHelp>
            Uses reintegration completion as the most structured available outcome signal by location. Differences across
            safehouses can point to process quality or support gaps.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading outcomes…</div>
          ) : !hasData || outcomes.length === 0 ? (
            <EmptyState title="No outcome data" message="No resident outcomes are available for the selected safehouses." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={outcomes} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="safehouseName" tick={{ fontSize: 11, fill: '#486173' }} />
                <YAxis tickFormatter={(value: number) => `${value}%`} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip formatter={(value: number) => [formatPercent(value), 'Completion rate']} />
                <Bar dataKey="completionRate" fill="#0f3e5f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="report-card">
          <h3>Resident Flow</h3>
          <SectionHelp>
            Uses admissions and exits to show movement through each safehouse. A large entry-exit imbalance can suggest
            congestion or uneven resident distribution.
          </SectionHelp>

          {loading ? (
            <div className="chart-placeholder">Loading resident flow…</div>
          ) : !hasData || flow.length === 0 ? (
            <EmptyState title="No flow data" message="No resident movement is available in the selected date range." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={flow} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ea" />
                <XAxis dataKey="safehouseName" tick={{ fontSize: 11, fill: '#486173' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#486173' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="entries" name="Entries" fill="#356272" radius={[6, 6, 0, 0]} />
                <Bar dataKey="exits" name="Exits" fill="#d4a018" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>
      </div>

      <div className="reports-grid">
        <article className="report-card report-card--wide">
          <h3>Insights & Recommendations</h3>
          <SectionHelp>
            These recommendations are descriptive, based on current utilization, flow, and completion patterns rather than forecasting.
          </SectionHelp>

          <div className="report-insights">
            <div className="report-insight">
              <strong>Over-utilized locations</strong>
              <p>
                {mostUtilized
                  ? `${mostUtilized.safehouseName} is the most utilized site at ${formatPercent(mostUtilized.utilizationPct)}. If that level stays high, consider redistributing incoming residents or reviewing whether capacity or staffing should be expanded there.`
                  : 'Utilization insight appears here when safehouse data is available.'}
              </p>
            </div>
            <div className="report-insight">
              <strong>Under-utilized capacity</strong>
              <p>
                {leastUtilized
                  ? `${leastUtilized.safehouseName} is the least utilized site at ${formatPercent(leastUtilized.utilizationPct)}. That may be healthy reserve capacity, or it may indicate uneven placement patterns worth reviewing.`
                  : 'Under-utilization insight appears here when safehouse data is available.'}
              </p>
            </div>
            <div className="report-insight">
              <strong>Operational bottlenecks</strong>
              <p>
                {comparison.length > 0
                  ? `${comparison
                      .slice()
                      .sort((a, b) => b.averageLengthOfStayDays - a.averageLengthOfStayDays)[0].safehouseName} currently has the longest average stay. Pair that with its turnover rate to check for reintegration delays or case-management bottlenecks.`
                  : 'Length-of-stay insight appears here when safehouse comparison data is available.'}
              </p>
            </div>
          </div>
        </article>

        <article className="report-card">
          <h3>Data Notes</h3>
          <SectionHelp>
            This page combines `safehouses`, `safehouse_monthly_metrics`, and resident safehouse assignments. Monthly
            occupancy is derived from safehouse metrics; current utilization comes from the safehouse record itself.
          </SectionHelp>

          <div className="report-insights">
            <div className="report-insight">
              <strong>Available signals</strong>
              <p>
                Capacity, current occupancy, monthly active residents, admissions, exits, average stay, and reintegration
                completion by location.
              </p>
            </div>
            <div className="report-insight">
              <strong>Important limitation</strong>
              <p>
                The monthly metrics table does not include explicit historical capacity-utilization fields, so those
                percentages are computed from active residents and current recorded capacity.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
