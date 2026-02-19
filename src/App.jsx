import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import emailScheduler from './lib/emailScheduler';
import './App.css';

// 크리에이터 앱 컴포넌트 (새 디자인)
import {
  CreatorApp,
  CreatorMyPage,
  GradeDetailPage,
  PointsPage,
  ApplicationsPage,
  WelcomeScreen,
  HomePage,
  CampaignsPage,
  MyPageWrapper,
  CreatorAIGuide,
  CreatorGuidePage
} from './components/creator';
import LandingPage from './components/creator/LandingPage';
import CampaignDetailPage from './components/creator/CampaignDetailPage';
import CampaignApplyPage from './components/creator/CampaignApplyPage';

// 인증 관련
import LoginPageExactReplica from './components/LoginPageExactReplica';
import SignupPageExactReplica from './components/SignupPageExactReplica';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import AuthCallbackSafe from './components/AuthCallbackSafe';

// 레거시 페이지 (호환성 유지)
import HomePageExactReplica from './components/HomePageExactReplica';
import MyPageKoreaEnhanced from './components/MyPageKoreaEnhanced';
import ProfileSettings from './components/ProfileSettings';
import ProfileSettingsTest from './components/ProfileSettingsTest';
import ProfileViewTest from './components/ProfileViewTest';
import NotificationSettings from './components/NotificationSettings';
import CampaignApplicationUpdated from './components/CampaignApplicationUpdated';
import CompanyReportNew from './components/CompanyReportNew';
import CNECPlusPageEnhanced from './components/CNECPlusPageEnhanced';
import VideoSubmissionPage from './components/VideoSubmissionPage';
import VideoReviewView from './components/VideoReviewView';
import OliveyoungVideoSubmissionPage from './components/OliveyoungVideoSubmissionPage';
import FourWeekVideoSubmissionPage from './components/FourWeekVideoSubmissionPage';
import HolidayNoticePopup from './components/HolidayNoticePopup';

// 관리자 컴포넌트
import AdminDashboardSimple from './components/admin/AdminDashboardSimple';
import AdminCampaignsWithQuestions from './components/admin/AdminCampaignsWithQuestions';
import CampaignCreationKorea from './components/admin/CampaignCreationKorea';
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
      <HolidayNoticePopup />
      <Routes>
        {/* 메인 페이지 - 로그인 여부에 따라 분기 */}
        <Route path="/" element={user ? <HomePage /> : <LandingPage />} />

        {/* 크리에이터 앱 - 개별 라우트 */}
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/mypage" element={<MyPageWrapper />} />
        <Route path="/campaign/:id" element={<CampaignDetailPage />} />
        <Route path="/campaign/:id/apply" element={<CampaignApplyPage />} />
        <Route path="/my/grade" element={<GradeDetailPage />} />
        <Route path="/my/points" element={<PointsPage />} />
        <Route path="/my/applications" element={<ApplicationsPage />} />
        <Route path="/my/ai-guide" element={<CreatorAIGuide />} />
        <Route path="/guide" element={<CreatorGuidePage />} />
        <Route path="/welcome" element={<WelcomeScreen />} />

        {/* 레거시 - 호환성 */}
        <Route path="/creator" element={<HomePage />} />

        {/* 인증 관련 */}
        <Route path="/login" element={<LoginPageExactReplica />} />
        <Route path="/signup" element={<SignupPageExactReplica />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackSafe />} />

        {/* 레거시 페이지 (호환성 유지) */}
        <Route path="/home-legacy" element={<HomePageExactReplica />} />
        <Route path="/cnecplus" element={<CNECPlusPageEnhanced />} />
        <Route path="/cnec-plus" element={<CNECPlusPageEnhanced />} />

        {/* 사용자 페이지 */}
        <Route path="/campaign-application" element={<CampaignApplicationUpdated />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/settings/notifications" element={<NotificationSettings />} />
        <Route path="/company-report/:campaignId" element={<CompanyReportNew />} />
        <Route path="/profile-settings" element={<ProfileSettings />} />
        <Route path="/profile-test-beta-2025" element={<ProfileSettingsTest />} />
        <Route path="/profile-view-beta-2025" element={<ProfileViewTest />} />
        <Route path="/submit-video/:campaignId" element={<VideoSubmissionPage />} />
        <Route path="/submit-oliveyoung-video/:campaignId" element={<OliveyoungVideoSubmissionPage />} />
        <Route path="/submit-4week-video/:campaignId" element={<FourWeekVideoSubmissionPage />} />
        <Route path="/video-review/:submissionId" element={<VideoReviewView />} />

        {/* 관리자 페이지 */}
        <Route path="/secret-admin-login" element={<SecretAdminLogin />} />
        <Route path="/test-admin-login" element={<TestAdminLogin />} />
        <Route path="/dashboard" element={<ProtectedRoute requireAdmin={true}><AdminDashboardSimple /></ProtectedRoute>} />
        <Route path="/campaigns-manage" element={<ProtectedRoute requireAdmin={true}><AdminCampaignsWithQuestions /></ProtectedRoute>} />
        <Route path="/campaign-create" element={<ProtectedRoute requireAdmin={true}><CampaignCreationKorea /></ProtectedRoute>} />
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
// Force redeploy: 1766315550
