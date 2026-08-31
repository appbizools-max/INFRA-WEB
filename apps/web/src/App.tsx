import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './app/auth/LoginPage';
import AdminLoginPage from './app/auth/AdminLoginPage';
import SaasAdminLayout from './pages/saas-admin/SaasAdminLayout';
import SaasAdminDashboard from './pages/saas-admin/Dashboard';
import ConfigPage from './pages/saas-admin/ConfigPage';
import TenantsPage from './app/saas-admin/tenants/TenantsPage';
import VendorsPage from './app/saas-admin/vendors/VendorsPage';
import PlansManagementPage from './app/saas-admin/plans/PlansManagementPage';
import ModulesPage from './app/saas-admin/modules/ModulesPage';
import ReportsPage from './app/saas-admin/reports/ReportsPage';
import AuditLogsPage from './app/saas-admin/audit-logs/AuditLogsPage';
import TenantLayout from './pages/tenant/TenantLayout';
import TenantDashboard from './pages/tenant/TenantDashboard';
import RegistrationWizard from './pages/tenant/registration/RegistrationWizard';
import ProfilePage from './pages/tenant/profile/ProfilePage';
import TeamPage from './pages/tenant/team/TeamPage';
import AccountsLedgersPage from './pages/tenant/dashboard/accountant/ledger/AccountsLedgersPage';
import ProjectsPage from './pages/tenant/project/ProjectsPage';
import CreateProjectPage from './pages/tenant/project/CreateProjectPage';
import ProjectDetailsPage from './pages/tenant/project/ProjectDetailsPage';
import WorkSitesPage from './pages/tenant/worksite/WorkSitesPage';
import AccessControlsPage from './pages/tenant/access-controls/AccessControlsPage';
import HRPage from './pages/tenant/hr/HRPage';
import DivisionsPage from './pages/tenant/divisions/DivisionsPage';
import ComingSoon from './pages/tenant/ComingSoon';
import AttendanceTrackerPage from './pages/tenant/hr/AttendanceTrackerPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleGuard from './components/RoleGuard';
import { getRoleDashboardPath } from './lib/api';
import './App.css';
function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <h1 className="text-4xl font-black text-black uppercase tracking-widest mb-4">
        InfraOps <span className="text-infra-green">360</span>
      </h1>
      <p className="text-gray-500 font-medium">System Initialization Complete.</p>
      <div className="mt-8 space-x-4">
        <a href="/login" className="px-6 py-3 bg-infra-green text-white font-bold rounded-sm uppercase tracking-wider hover:bg-infra-green/90 transition-colors">
          Go to Login
        </a>
      </div>
    </div>
  );
}

// Simple coming soon for unbuilt saas-admin pages
function AdminComingSoon({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-4xl mb-3">🔧</p>
      <p className="text-lg font-bold text-slate-700">{name}</p>
      <p className="text-sm mt-1">This section is under construction.</p>
    </div>
  );
}

// Guard for SaaS Admin Routes
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('saas_admin_jwt') || localStorage.getItem('saas_admin_jwt');
  if (!token) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

// Guard for Tenant Routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="font-bold">Verifying Session...</p>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />

          {/* SaaS Admin Routes */}
          <Route path="/saas-admin" element={
            <AdminProtectedRoute>
              <SaasAdminLayout />
            </AdminProtectedRoute>
          }>
            <Route path="dashboard" element={<SaasAdminDashboard />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="plans" element={<PlansManagementPage />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="config" element={<ConfigPage />} />
            <Route index element={<Navigate to="/saas-admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/saas-admin/dashboard" replace />} />
          </Route>

          {/* Tenant Routes */}
          <Route path="/tenant" element={
            <ProtectedRoute>
              <TenantLayout />
            </ProtectedRoute>
          }>
            <Route path="registration" element={<RegistrationWizard />} />
            <Route path="dashboard" element={<TenantDashboard />} />
            {/* Role-specific dashboard routes */}
            <Route path="accountant-dashboard" element={
              <RoleGuard allowedRoles={['admin', 'accountant', 'finance']}>
                <TenantDashboard />
              </RoleGuard>
            } />
            <Route path="hr-dashboard" element={
              <RoleGuard allowedRoles={['admin', 'hr']}>
                <TenantDashboard />
              </RoleGuard>
            } />
            <Route path="operations-dashboard" element={
              <RoleGuard allowedRoles={['admin', 'operations', 'logistics']}>
                <TenantDashboard />
              </RoleGuard>
            } />
            <Route path="employee-dashboard" element={<TenantDashboard />} />
            <Route path="team" element={
              <RoleGuard allowedRoles={['admin', 'hr']}>
                <TeamPage />
              </RoleGuard>
            } />
            <Route path="client-portal" element={<ComingSoon moduleName="Client Portal" />} />
            <Route path="vendor-operations" element={
              <RoleGuard allowedRoles={['admin', 'accountant', 'finance', 'vendor']}>
                <ComingSoon moduleName="Vendor Operations" />
              </RoleGuard>
            } />
            <Route path="material-management" element={<ComingSoon moduleName="Material Management" />} />
            <Route path="labor-management" element={<ComingSoon moduleName="Labor Management" />} />
            <Route path="project-management" element={<ProjectsPage />} />
            <Route path="project-management/new" element={<CreateProjectPage />} />
            <Route path="project-management/:id" element={<ProjectDetailsPage />} />
            <Route path="work-sites" element={<WorkSitesPage />} />
            <Route path="access-controls" element={
              <RoleGuard allowedRoles={['admin']}>
                <AccessControlsPage />
              </RoleGuard>
            } />
            <Route path="hr" element={
              <RoleGuard allowedRoles={['admin', 'hr']}>
                <HRPage />
              </RoleGuard>
            } />
            <Route path="attendance-tracker" element={
              <RoleGuard allowedRoles={['admin', 'hr']}>
                <AttendanceTrackerPage />
              </RoleGuard>
            } />
            <Route path="divisions" element={
              <RoleGuard allowedRoles={['admin', 'hr']}>
                <DivisionsPage />
              </RoleGuard>
            } />
            <Route path="accounts-ledgers" element={
              <RoleGuard allowedRoles={['admin', 'accountant', 'finance']}>
                <AccountsLedgersPage />
              </RoleGuard>
            } />
            <Route path="sub-contractors" element={<ComingSoon moduleName="Sub-Contractors" />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<ComingSoon moduleName="Settings" />} />
            <Route index element={<Navigate to="/tenant/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
