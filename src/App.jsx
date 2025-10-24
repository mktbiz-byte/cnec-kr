import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import emailScheduler from './lib/emailScheduler';
import './App.css';

// 페이지 컴포넌트
import HomePageExactReplica from './components/HomePageExactReplica';
import LoginPageExactReplica from './components/LoginPageExactReplica';
import SignupPageExactReplica from './components/SignupPageExactReplica';
import CampaignApplicationPage from './components/CampaignApplicationPage';
import CompanyReportNew from './components/CompanyReportNew';
import MyPageKorea from './components/MyPageKorea';
import ProfileSettings from './components/ProfileSettings';
import AuthCallbackSafe from './components/AuthCallbackSafe';

// 관리자 컴포넌트
import AdminDashboardSimple from './components/admin/AdminDashboardSimple';
import AdminCampaignsWithQuestions from './components/admin/AdminCampaignsWithQuestions';
import CampaignCreationWithTranslator from './components/admin/CampaignCreationWithTranslator';
import ApplicationsReportSimple from './components/admin/ApplicationsReportSimple_final';
import AdminConfirmedCreators from './components/admin/AdminConfirmedCreators';
import ConfirmedCreatorsNew from './components/admin/ConfirmedCreatorsNew';
import SNSUploadNew from './components/admin/SNSUploadNew';
import CampaignReportEnhanced from './components/admin/CampaignReportEnhanced';
import EmailTemplateManager from './components/admin/EmailTemplateManager';
import UserApprovalManagerEnhanced from './components/admin/UserApprovalManagerEnhanced';
import AdminWithdrawals from './components/admin/AdminWithdrawals';
import SystemSettings from './components/admin/SystemSettings';
import EmailSettings from './components/admin/EmailSettings';

// 관리자 로그인
import SecretAdminLogin from './components/SecretAdminLogin';
import TestAdminLogin from './components/TestAdminLogin';
import CampaignApplicationUpdated from './components/CampaignApplicationUpdated';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent = () => {
  const { user } = useAuth();

  useEffect(() => {
    // 이메일 스케줄러 시작
    emailScheduler.start();
    
    // 컴포넌트 언마운트 시 스케줄러 중지
    return () => {
      emailScheduler.stop();
    };
  }, []);

  return (
    <div className="App">
      <Routes>
        {/* 메인 페이지 */}
        <Route path="/" element={<HomePageExactReplica />} />
        
        {/* 인증 관련 */}
        <Route path="/login" element={<LoginPageExactReplica />} />
        <Route path="/signup" element={<SignupPageExactReplica />} />
        <Route path="/auth/callback" element={<AuthCallbackSafe />} />
        
        {/* 사용자 페이지 */}
        <Route path="/campaign-application" element={<CampaignApplicationUpdated />} />
        <Route path="/mypage" element={<MyPageKorea />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/company-report/:campaignId" element={<CompanyReportNew />} />
        <Route path="/profile-settings" element={<ProfileSettings />} />
        
        {/* 관리자 페이지 */}
        <Route path="/secret-admin-login" element={<SecretAdminLogin />} />
        <Route path="/test-admin-login" element={<TestAdminLogin />} />
        <Route path="/dashboard" element={<ProtectedRoute requireAdmin={true}><AdminDashboardSimple /></ProtectedRoute>} />
        <Route path="/campaigns-manage" element={<ProtectedRoute requireAdmin={true}><AdminCampaignsWithQuestions /></ProtectedRoute>} />
        <Route path="/campaign-create" element={<ProtectedRoute requireAdmin={true}><CampaignCreationWithTranslator /></ProtectedRoute>} />
        <Route path="/applications-manage" element={<ProtectedRoute requireAdmin={true}><ApplicationsReportSimple /></ProtectedRoute>} />
        <Route path="/applications-report" element={<ProtectedRoute requireAdmin={true}><ApplicationsReportSimple /></ProtectedRoute>} />
        <Route path="/confirmed-creators" element={<ProtectedRoute requireAdmin={true}><AdminConfirmedCreators /></ProtectedRoute>} />
        <Route path="/confirmed-creators/:campaignId" element={<ProtectedRoute requireAdmin={true}><ConfirmedCreatorsNew /></ProtectedRoute>} />
        <Route path="/sns-uploads" element={<ProtectedRoute requireAdmin={true}><SNSUploadNew /></ProtectedRoute>} />
        <Route path="/sns-uploads/:campaignId" element={<ProtectedRoute requireAdmin={true}><SNSUploadNew /></ProtectedRoute>} />
        <Route path="/campaign-report/:campaignId" element={<ProtectedRoute requireAdmin={true}><CampaignReportEnhanced /></ProtectedRoute>} />
        <Route path="/email-templates" element={<ProtectedRoute requireAdmin={true}><EmailTemplateManager /></ProtectedRoute>} />
        <Route path="/user-approval" element={<ProtectedRoute requireAdmin={true}><UserApprovalManagerEnhanced /></ProtectedRoute>} />
        <Route path="/withdrawals-manage" element={<ProtectedRoute requireAdmin={true}><AdminWithdrawals /></ProtectedRoute>} />
        <Route path="/system-settings" element={<ProtectedRoute requireAdmin={true}><SystemSettings /></ProtectedRoute>} />
        <Route path="/email-settings" element={<ProtectedRoute requireAdmin={true}><EmailSettings /></ProtectedRoute>} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

