// src/pages/Admin.tsx
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';

import '../styles/Admin.css';

import AdminSidebar from '../components/admin/AdminSidebar';
import KpiCards from '../components/admin/KpiCards';
import CaseloadTable from '../components/admin/CaseloadTable';
import RecentActivity from '../components/admin/RecentActivity';
import BottomCharts from '../components/admin/BottomCharts';
import ResidentDirectory from '../components/admin/ResidentDirectory';
import DonorDashboard from '../components/admin/DonorDashboard';
import ProcessRecordings from '../components/admin/ProcessRecordings';
import SafehouseManagement from '../components/admin/SafehouseManagement';
import UserManagement from '../components/admin/UserManagement';
import HomeVisitationConferences from '../components/admin/HomeVisitationConferences';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

export const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Admin Dashboard',
  'resident-directory': 'Resident Directory',
  donors: 'Donor Dashboard',
  'process-recordings': 'Process Recordings',
  'safehouse-management': 'Safehouse Management',
  'user-management': 'User Management',
  'home-visits': 'Home Visitation & Case Conferences',
};

export type AdminOutletContext = {
  showCreate: boolean;
  setShowCreate: Dispatch<SetStateAction<boolean>>;
};

export function AdminDashboard() {
  const { data: dash, loading: dashLoading, error: dashError } = useAdminDashboard();

  return (
    <div className="dashboard-shell">
      {dashError && (
        <p style={{ padding: '1rem', color: 'var(--red)' }}>Error: {dashError}</p>
      )}

      <div className="dashboard-hero">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">Operations Overview</span>
          <h2>Daily admin snapshot</h2>
          <p>
            Monitor residents, conferences, donations, and operational activity from a single fuller dashboard view.
          </p>
        </div>
        <div className="dashboard-hero__meta">
          <span className="dashboard-hero__meta-label">Status</span>
          <strong>{dashLoading ? 'Refreshing data…' : 'Live operational view'}</strong>
        </div>
      </div>

      <div className="dashboard-section dashboard-section--kpis">
        <KpiCards kpis={dash?.kpis ?? null} loading={dashLoading} />
      </div>

      <div className="admin-mid-row dashboard-section">
        <div className="dashboard-panel dashboard-panel--table">
          <CaseloadTable rows={dash?.caseload ?? []} loading={dashLoading} />
        </div>
        <div className="admin-mid-right">
          <div className="dashboard-panel">
            <RecentActivity items={dash?.activity ?? []} loading={dashLoading} />
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <BottomCharts
          donationsMonthly={dash?.donationsMonthly ?? []}
          residentOutcomes={dash?.residentOutcomes ?? []}
          upcomingEvents={dash?.upcomingEvents ?? []}
          loading={dashLoading}
        />
      </div>
    </div>
  );
}

export function AdminResidentDirectory() {
  const { showCreate, setShowCreate } = useOutletContext<AdminOutletContext>();
  return <ResidentDirectory showCreate={showCreate} setShowCreate={setShowCreate} />;
}

export function AdminDonors() {
  return <DonorDashboard />;
}

export function AdminProcessRecordings() {
  return <ProcessRecordings />;
}

export function AdminSafehouseManagement() {
  return <SafehouseManagement />;
}

export function AdminUserManagement() {
  return <UserManagement />;
}

export function AdminHomeVisits() {
  return <HomeVisitationConferences />;
}

export function AdminCatchAll() {
  return <Navigate to="/admin/dashboard" replace />;
}

export default function AdminLayout() {
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  const segment = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';
  const title = SECTION_TITLES[segment] ?? SECTION_TITLES.dashboard;

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="breadcrumb">
              Admin Panel · <span>{title}</span>
            </div>
            <h1>{title}</h1>
          </div>
          <div className="admin-actions">
            {segment === 'resident-directory' && (
              <button type="button" className="btn-add" onClick={() => setShowCreate(true)}>
                + New Resident
              </button>
            )}
          </div>
        </div>

        <Outlet context={{ showCreate, setShowCreate } satisfies AdminOutletContext} />
      </div>
    </div>
  );
}
