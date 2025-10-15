import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { CountryProvider } from './contexts/CountryContext';
import { Toaster } from 'react-hot-toast';

// i18n
import './i18n';
import { useTranslation } from 'react-i18next';

// 레이아웃
import CorporateLayout from './components/layout/CorporateLayout';
import CompanyLayout from './components/layout/CompanyLayout';
import AdminLayout from './components/layout/AdminLayout';

// 기업 홈페이지 페이지
import CorporateHomePage from './pages/corporate/CorporateHomePage';
import AboutPage from './pages/corporate/AboutPage';
import ServicesPage from './pages/corporate/ServicesPage';
import ContactPage from './pages/corporate/ContactPage';

// 인증 페이지
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import CompanyLoginPage from './pages/auth/CompanyLoginPage';

// 기업 관리자 페이지
import CompanyDashboardPage from './pages/company/CompanyDashboardPage';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import BrandManagementPage from './pages/company/BrandManagementPage';
import BrandEditPage from './pages/company/BrandEditPage';
import CampaignListPage from './pages/company/CampaignListPage';
import CampaignCreatePage from './pages/company/CampaignCreatePage';
import CampaignDetailPage from './pages/company/CampaignDetailPage';
import CampaignPaymentPage from './pages/company/CampaignPaymentPage';
import InvoiceRequestPage from './pages/company/InvoiceRequestPage';

// 통합 관리자 페이지
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SalesReportPage from './pages/admin/SalesReportPage';
import InvoiceManagementPage from './pages/admin/InvoiceManagementPage';
import IntegratedCampaignsPage from './pages/admin/IntegratedCampaignsPage';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || (allowedRoles && !allowedRoles.includes(userRole))) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return children;
};

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 브라우저 언어 감지 및 설정
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language.split('-')[0];
      const supportedLangs = ['ko', 'en', 'ja', 'zh'];
      if (supportedLangs.includes(browserLang)) {
        i18n.changeLanguage(browserLang);
      } else {
        i18n.changeLanguage('ko'); // 기본 언어
      }
    }
  }, [i18n]);

  return (
    <Router>
      <AuthProvider>
        <CountryProvider>
          <PaymentProvider>
            <InvoiceProvider>
              <Toaster position="top-right" />
              <Routes>
                {/* 기업 홈페이지 라우트 */}
                <Route path="/" element={<CorporateLayout />}>
                  <Route index element={<CorporateHomePage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="contact" element={<ContactPage />} />
                </Route>

                {/* 인증 라우트 */}
                <Route path="/auth">
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="admin-login" element={<AdminLoginPage />} />
                  <Route path="company-login" element={<CompanyLoginPage />} />
                </Route>

                {/* 기업 관리자 라우트 */}
                <Route 
                  path="/company" 
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <CompanyLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<CompanyDashboardPage />} />
                  <Route path="profile" element={<CompanyProfilePage />} />
                  <Route path="brands" element={<BrandManagementPage />} />
                  <Route path="brands/:id" element={<BrandEditPage />} />
                  <Route path="campaigns" element={<CampaignListPage />} />
                  <Route path="campaigns/create" element={<CampaignCreatePage />} />
                  <Route path="campaigns/:id" element={<CampaignDetailPage />} />
                  <Route path="campaigns/:id/payment" element={<CampaignPaymentPage />} />
                  <Route path="payments/:id/invoice" element={<InvoiceRequestPage />} />
                </Route>

                {/* 통합 관리자 라우트 */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="sales" element={<SalesReportPage />} />
                  <Route path="invoices" element={<InvoiceManagementPage />} />
                  <Route path="campaigns" element={<IntegratedCampaignsPage />} />
                </Route>

                {/* 404 페이지 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </InvoiceProvider>
          </PaymentProvider>
        </CountryProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
