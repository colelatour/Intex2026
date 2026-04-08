// src/pages/Admin.tsx
import { useState } from 'react';
import '../styles/Admin.css';

import AdminSidebar               from '../components/admin/AdminSidebar';
import KpiCards                   from '../components/admin/KpiCards';
import CaseloadTable              from '../components/admin/CaseloadTable';
import RecentActivity             from '../components/admin/RecentActivity';
import QuickActions               from '../components/admin/QuickActions';
import BottomCharts               from '../components/admin/BottomCharts';
import ResidentDirectory          from '../components/admin/ResidentDirectory';
import DonorDashboard             from '../components/admin/DonorDashboard';
import ProcessRecordings          from '../components/admin/ProcessRecordings';
import SafehouseManagement        from '../components/admin/SafehouseManagement';
import UserManagement             from '../components/admin/UserManagement';
import HomeVisitationConferences  from '../components/admin/HomeVisitationConferences';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

const SECTION_TITLES: Record<string, string> = {
  'dashboard':            'Admin Dashboard',
  'resident-directory':   'Resident Directory',
  'donors':               'Donor Dashboard',
  'process-recordings':   'Process Recordings',
  'safehouse-management': 'Safehouse Management',
  'user-management':      'User Management',
  'home-visits':          'Home Visitation & Case Conferences',
};

export default function Admin() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showCreate, setShowCreate]       = useState(false);
  const { data: dash, loading: dashLoading, error: dashError, refresh } = useAdminDashboard();

  return (
    <div className="admin-layout">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <div>
            <div className="breadcrumb">
              Admin Panel · <span>{SECTION_TITLES[activeSection]}</span>
            </div>
            <h1>{SECTION_TITLES[activeSection]}</h1>
          </div>
          <div className="admin-actions">
            {activeSection === 'dashboard' && (
              <button className="filter-btn" onClick={refresh} disabled={dashLoading}>
                {dashLoading ? 'Refreshing…' : '↻ Refresh'}
              </button>
            )}
            {activeSection === 'resident-directory' && (
              <button className="btn-add" onClick={() => setShowCreate(true)}>+ New Resident</button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeSection === 'dashboard' && (
          <>
            {dashError && (
              <p style={{ padding: '1rem', color: 'var(--red)' }}>Error: {dashError}</p>
            )}
            <KpiCards kpis={dash?.kpis ?? null} loading={dashLoading} />
            <div className="admin-mid-row">
              <CaseloadTable rows={dash?.caseload ?? []} loading={dashLoading} />
              <div className="admin-mid-right">
                <RecentActivity items={dash?.activity ?? []} loading={dashLoading} />
                <QuickActions />
              </div>
            </div>
            <BottomCharts
              donationsMonthly={dash?.donationsMonthly ?? []}
              residentOutcomes={dash?.residentOutcomes ?? []}
              upcomingEvents={dash?.upcomingEvents ?? []}
              loading={dashLoading}
            />
          </>
        )}
        {activeSection === 'resident-directory' && (
          <ResidentDirectory showCreate={showCreate} setShowCreate={setShowCreate} />
        )}
        {activeSection === 'donors' && <DonorDashboard />}
        {activeSection === 'process-recordings' && <ProcessRecordings />}
        {activeSection === 'safehouse-management' && <SafehouseManagement />}
        {activeSection === 'user-management' && <UserManagement />}
        {activeSection === 'home-visits' && <HomeVisitationConferences />}
      </div>
    </div>
  );
}
