// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import Home from './pages/Home';
import Donate from './pages/Donate';
import AdminLayout, {
  AdminDashboard,
  AdminResidentDirectory,
  AdminDonors,
  AdminDonations,
  AdminProcessRecordings,
  AdminSafehouseManagement,
  AdminUserManagement,
  AdminHomeVisits,
  AdminReferrals,
  AdminSocialStrategy,
  AdminDonationReports,
  AdminResidentOutcomes,
  AdminSafehousePerformance,
  AdminCatchAll,
} from './pages/Admin';
import Login from './pages/Login';
import ImpactDashboard from './pages/ImpactDashboard';
import RegionsPage from './pages/RegionsPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Account from './pages/Account';
import SubmitTip from './pages/SubmitTip';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/impact" element={<ImpactDashboard />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/regions" element={<RegionsPage />} />
        <Route path="/account" element={<ProtectedRoute requiredRoles={['Donor', 'Admin', 'Worker']}><Account /></ProtectedRoute>} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/submit-tip" element={<SubmitTip />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['Admin', 'Worker']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="resident-directory" element={<AdminResidentDirectory />} />
          <Route path="donors" element={<AdminDonors />} />
          <Route path="donations" element={<AdminDonations />} />
          <Route path="process-recordings" element={<AdminProcessRecordings />} />
          <Route path="safehouse-management" element={<AdminSafehouseManagement />} />
          <Route
            path="user-management"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />
          <Route path="home-visits" element={<AdminHomeVisits />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route
            path="social-strategy"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <AdminSocialStrategy />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/donations"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <AdminDonationReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/resident-outcomes"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <AdminResidentOutcomes />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/safehouse-performance"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <AdminSafehousePerformance />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<AdminCatchAll />} />
        </Route>
      </Routes>
      <CookieConsent />
    </>
  );
}
