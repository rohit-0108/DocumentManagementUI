import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout, PublicLayout } from '@/layouts';
import { UserRole } from '@/types';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { RoleRoute } from './RoleRoute';

// Code-split every page
const Login = lazy(() => import('@/features/auth/Login'));
const Register = lazy(() => import('@/features/auth/Register'));
const Profile = lazy(() => import('@/features/auth/Profile'));

const DocumentList = lazy(() => import('@/features/documents/DocumentList'));
const DocumentUpload = lazy(() => import('@/features/documents/DocumentUpload'));
const DocumentDetails = lazy(() => import('@/features/documents/DocumentDetails'));
const ApprovalQueue = lazy(() => import('@/features/documents/ApprovalQueue'));

const Dashboard = lazy(() => import('@/features/admin/Dashboard'));
const ManageUsers = lazy(() => import('@/features/admin/ManageUsers'));
const AuditLogViewer = lazy(() => import('@/features/admin/AuditLogViewer'));

const NotFound = lazy(() => import('@/features/NotFound'));

export function AppRoutes() {
  return (
    <Routes>
      {/* ---------- Public ---------- */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      {/* ---------- Authenticated ---------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/documents" replace />} />

          {/* All roles */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/documents/upload" element={<DocumentUpload />} />
          <Route path="/documents/:id" element={<DocumentDetails />} />

          {/* Admin + Approver */}
          <Route element={<RoleRoute allowedRoles={[UserRole.Admin, UserRole.Approver]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/approvals" element={<ApprovalQueue />} />
          </Route>

          {/* Admin only */}
          <Route element={<RoleRoute allowedRoles={[UserRole.Admin]} />}>
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/audit-logs" element={<AuditLogViewer />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}