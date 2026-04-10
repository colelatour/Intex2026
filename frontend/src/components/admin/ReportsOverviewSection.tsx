import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSession } from "../../lib/authApi";
import type { DashboardReportsOverview } from "../../types/AdminDashboard";

function formatRange(start: string, end: string): string {
  if (!start || !end) return "";
  return `${start} → ${end}`;
}

function pctLabel(n: number): string {
  if (n === 0) return "0% vs prior period";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}% vs prior period`;
}

interface Props {
  overview: DashboardReportsOverview | null | undefined;
  loading?: boolean;
}

export default function ReportsOverviewSection({ overview, loading }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    getSession().then((s) => setIsAdmin(s.roles.includes("Admin")));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-section">
        <h3 className="reports-overview__title">Reports &amp; analytics snapshot</h3>
        <p className="reports-overview__subtitle">
          Same default date ranges as the full report pages (no filters). Updates when you refresh.
        </p>
        <div className="reports-overview__grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="admin-card reports-overview__card" style={{ opacity: 0.6 }}>
              <div className="chart-placeholder">Loading…</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const { donations, residents, safehouses } = overview;

  return (
    <div className="dashboard-section">
      <h3 className="reports-overview__title">Reports &amp; analytics snapshot</h3>
      <p className="reports-overview__subtitle">
        Headline metrics using each report&apos;s default range (matches Donation, Resident, and Safehouse
        report pages when opened without changing dates).
        {isAdmin && (
          <>
            {" "}
            <Link to="/admin/reports/donations" className="reports-overview__link">
              Open reports →
            </Link>
          </>
        )}
      </p>

      <div className="reports-overview__grid">
        <div className="admin-card reports-overview__card">
          <h4>
            Donations
            <span className="admin-card__link">{formatRange(donations.rangeStart, donations.rangeEnd)}</span>
          </h4>
          <div className="reports-overview__stat">
            <span className="reports-overview__stat-label">Total in range</span>
            <span className="reports-overview__stat-value">₱{donations.totalInRange.toLocaleString()}</span>
          </div>
          <div className="reports-overview__meta">
            {pctLabel(donations.percentChangeFromPreviousPeriod)} · {donations.donationCount.toLocaleString()}{" "}
            gifts · {donations.donorCount.toLocaleString()} donors
          </div>
          {isAdmin ? (
            <Link to="/admin/reports/donations" className="reports-overview__footer-link">
              Donation reports
            </Link>
          ) : (
            <span className="reports-overview__meta">Full drill-down: Admins</span>
          )}
        </div>

        <div className="admin-card reports-overview__card">
          <h4>
            Residents
            <span className="admin-card__link">{formatRange(residents.rangeStart, residents.rangeEnd)}</span>
          </h4>
          <div className="reports-overview__stat">
            <span className="reports-overview__stat-label">In range (admissions)</span>
            <span className="reports-overview__stat-value">{residents.totalResidentsInRange.toLocaleString()}</span>
          </div>
          <div className="reports-overview__meta">
            {residents.activeResidents.toLocaleString()} active · {residents.completionRate.toFixed(1)}% completion ·{" "}
            {pctLabel(residents.intakeChangePercent)} intake
          </div>
          {isAdmin ? (
            <Link to="/admin/reports/resident-outcomes" className="reports-overview__footer-link">
              Resident outcomes
            </Link>
          ) : (
            <span className="reports-overview__meta">Full drill-down: Admins</span>
          )}
        </div>

        <div className="admin-card reports-overview__card">
          <h4>
            Safehouses
            <span className="admin-card__link">{formatRange(safehouses.rangeStart, safehouses.rangeEnd)}</span>
          </h4>
          <div className="reports-overview__stat">
            <span className="reports-overview__stat-label">Avg utilization</span>
            <span className="reports-overview__stat-value">{safehouses.averageOccupancyRate.toFixed(1)}%</span>
          </div>
          <div className="reports-overview__meta">
            {safehouses.totalSafehouses} sites · {safehouses.totalResidentsHoused.toLocaleString()} currently housed ·
            turnover {safehouses.turnoverRate.toFixed(1)}%
            {safehouses.highestUtilization && (
              <>
                <br />
                Highest: {safehouses.highestUtilization.name} ({safehouses.highestUtilization.utilizationPct}%)
              </>
            )}
          </div>
          {isAdmin ? (
            <Link to="/admin/reports/safehouse-performance" className="reports-overview__footer-link">
              Safehouse performance
            </Link>
          ) : (
            <span className="reports-overview__meta">Full drill-down: Admins</span>
          )}
        </div>
      </div>
    </div>
  );
}
