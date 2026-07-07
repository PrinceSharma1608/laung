import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Import Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import UserManagement from '../pages/UserManagement';
import AreaSupervisorMapping from '../pages/AreaSupervisorMapping';
import TeamLeaderJhoMapping from '../pages/TeamLeaderJhoMapping';
import MachineAllocation from '../pages/MachineAllocation';
import MaintenanceDashboard from '../pages/MaintenanceDashboard';
import AuditPage from '../pages/AuditPage';
import MaintenancePage from '../pages/MaintenancePage';
import MachineConfigurationPage from '../pages/MachineConfigurationPage';
import ChecklistManagementPage from '../pages/ChecklistManagementPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside DashboardLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/maintenance-logs"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE']}>
            <DashboardLayout>
              <Dashboard defaultTab="maintenance_logs" />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE']}>
            <DashboardLayout>
              <Dashboard defaultTab="audit_logs" />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/maintenance"
        element={
          <ProtectedRoute allowedRoles={['TEAM_LEADER', 'JH_OWNER']}>
            <DashboardLayout>
              <MaintenancePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE']}>
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/machine-configuration"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE']}>
            <DashboardLayout>
              <MachineConfigurationPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/area-supervisor"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE']}>
            <DashboardLayout>
              <AreaSupervisorMapping />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tl-jho"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE']}>
            <DashboardLayout>
              <TeamLeaderJhoMapping />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/machine-allocation"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE']}>
            <DashboardLayout>
              <MachineAllocation />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE', 'SUPERVISOR']}>
            <DashboardLayout>
              <AuditPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/checklist-management"
        element={
          <ProtectedRoute allowedRoles={['LINE_INCHARGE', 'SUPERVISOR']}>
            <DashboardLayout>
              <ChecklistManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
