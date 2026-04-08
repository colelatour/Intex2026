// src/pages/Admin.tsx
import { useState, type Dispatch, type SetStateAction } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';

import '../styles/Admin.css';

import AdminSidebar from '../components/admin/AdminSidebar';
import KpiCards from '../components/admin/KpiCards';
import CaseloadTable from '../components/admin/CaseloadTable';
import RecentActivity from '../components/admin/RecentActivity';
import QuickActions from '../components/admin/QuickActions';
import BottomCharts from '../components/admin/BottomCharts';
import ResidentDirectory from '../components/admin/ResidentDirectory';
import DonorDashboard from '../components/admin/DonorDashboard';
import ProcessRecordings from '../components/admin/ProcessRecordings';
import SafehouseManagement from '../components/admin/SafehouseManagement';
import UserManagement from '../components/admin/UserManagement';
import HomeVisitationConferences from '../components/admin/HomeVisitationConferences';

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
  return (
    <>
      <KpiCards />
      <div className="admin-mid-row">
        <CaseloadTable />
        <div className="admin-mid-right">
          <RecentActivity />
          <QuickActions />
        </div>
      </div>
      <BottomCharts />
    </>
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

/** Redirect unknown `/admin/*` segments to dashboard */
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
