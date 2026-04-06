// src/pages/Admin.jsx
import '../styles/Admin.css';

import AdminSidebar  from '../components/admin/AdminSidebar';
import KpiCards      from '../components/admin/KpiCards';
import CaseloadTable from '../components/admin/CaseloadTable';
import RecentActivity from '../components/admin/RecentActivity';
import QuickActions  from '../components/admin/QuickActions';
import BottomCharts  from '../components/admin/BottomCharts';

export default function Admin() {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <div>
            <div className="breadcrumb">
              Admin Panel · <span>Dashboard</span>
            </div>
            <h1>Admin Dashboard</h1>
          </div>
          <div className="admin-actions">
            <button className="btn-export">Export Report</button>
            <button className="btn-add">+ Add Record</button>
          </div>
        </div>

        {/* KPI row */}
        <KpiCards />

        {/* Mid row: table + activity/actions */}
        <div className="admin-mid-row">
          <CaseloadTable />

          <div className="admin-mid-right">
            <RecentActivity />
            <QuickActions />
          </div>
        </div>

        {/* Bottom: charts + events */}
        <BottomCharts />
      </div>
    </div>
  );
}
