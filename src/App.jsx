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
import SalesReportPage from './pages/admin/SalesReportPage';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import BrandManagementPage from './pages/company/BrandManagementPage';
import BrandEditPage from './pages/company/BrandEditPage';
import CampaignListPage from './pages/company/CampaignListPage';
import CampaignCreatePage from './pages/company/CampaignCreatePage';
import CampaignDetailPage from './pages/company/CampaignDetailPage';
import CampaignPaymentPage from './pages/company/CampaignPaymentPage';
import ChangePasswordPage from './pages/account/ChangePasswordPage';
import LoginPage from './pages/auth/CompanyLoginPage'; // 기업 로그인 페이지로 변경
import AdminLoginPage from './pages/auth/AdminLoginPage'; // 관리자 로그인 페이지 추가
import RegisterPage from './components/auth/RegisterPage';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'; // 비밀번호 찾기 페이지 추가
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
    // 관리자 권한이 필요한데 관리자가 아닌 경우
    if (requiredRole === 'admin') {
      return <Navigate to="/" replace />;
    }
    // 기업 권한이 필요한데 기업이 아닌 경우
    if (requiredRole === 'company') {
      return <Navigate to="/" replace />;
    }
    // 그 외의 경우
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
        <Route path="admin-login" element={<AdminLoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="password-reset" element={<PasswordResetPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
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
        <Route path="sales" element={<SalesReportPage />} />
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
        <Route path="brands" element={<BrandManagementPage />} />
        <Route path="brands/:brandId/edit" element={<BrandEditPage />} />
        <Route path="campaigns" element={<CampaignListPage />} />
        <Route path="campaigns/create" element={<CampaignCreatePage />} />
        <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
        <Route path="campaigns/:campaignId/payment" element={<CampaignPaymentPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>
      
      {/* 이전 경로 리다이렉트 (하위 호환성) */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      <Route path="/admin/login" element={<Navigate to="/auth/admin-login" replace />} />
      
      {/* 404 페이지 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
