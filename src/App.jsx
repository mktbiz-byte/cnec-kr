import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// 레이아웃
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import CompanyLayout from './components/layout/CompanyLayout';
import AuthLayout from './components/layout/AuthLayout';

// 페이지
import HomePage from './pages/home/HomePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import CompanyApprovalPage from './pages/admin/CompanyApprovalPage';
import CompanyListPage from './pages/admin/CompanyListPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import ChangePasswordPage from './pages/account/ChangePasswordPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import NotFoundPage from './pages/NotFoundPage';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // URL의 hash(#) 부분에 type=recovery가 포함되어 있는지 확인합니다.
    if (window.location.hash.includes('type=recovery')) {
      // 비밀번호 재설정 페이지로 즉시 이동합니다.
      navigate('/auth/password-reset', { replace: true });
    }
  }, [navigate]);
  return (
    <Routes>
      {/* 메인 페이지 */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
      </Route>
      
      {/* 인증 페이지 */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="password-reset" element={<PasswordResetPage />} />
      </Route>
      
      {/* 관리자 페이지 */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="companies" element={<CompanyListPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="approvals" element={<CompanyApprovalPage />} />
      </Route>
      
      {/* 기업 관리자 페이지 */}
      <Route 
        path="/company" 
        element={
          <ProtectedRoute requiredRole="company">
            <CompanyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CompanyDashboard />} />
        <Route path="profile" element={<CompanyProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>
      
      {/* 이전 경로 리다이렉트 (하위 호환성) */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      
      {/* 404 페이지 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
