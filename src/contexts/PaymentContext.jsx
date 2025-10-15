import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import paymentService from '../services/paymentService';

// 결제 컨텍스트 생성
const PaymentContext = createContext();

// 결제 컨텍스트 제공자 컴포넌트
export const PaymentProvider = ({ children }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 결제 방법 및 상태 로드
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setLoading(true);
        const [methods, statuses] = await Promise.all([
          paymentService.getPaymentMethods(),
          paymentService.getPaymentStatuses()
        ]);
        setPaymentMethods(methods);
        setPaymentStatuses(statuses);
        setError(null);
      } catch (err) {
        console.error('결제 데이터 로드 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, []);

  // 알림 로드
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        const notifications = await paymentService.getPaymentNotifications(user.id);
        setNotifications(notifications);
        setUnreadCount(notifications.filter(n => !n.is_read).length);
      } catch (err) {
        console.error('알림 로드 오류:', err);
      }
    };

    loadNotifications();
  }, [user]);

  // 결제 생성
  const createPayment = async (paymentData) => {
    try {
      setLoading(true);
      const payment = await paymentService.createPayment(paymentData);
      toast.success(t('payment.createSuccess'));
      return payment;
    } catch (err) {
      console.error('결제 생성 오류:', err);
      toast.error(t('payment.createFailed'));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 결제 상태 업데이트
  const updatePaymentStatus = async (paymentId, statusId, notes) => {
    try {
      setLoading(true);
      const payment = await paymentService.updatePaymentStatus(paymentId, statusId, notes);
      toast.success(t('payment.updateSuccess'));
      return payment;
    } catch (err) {
      console.error('결제 상태 업데이트 오류:', err);
      toast.error(t('payment.updateFailed'));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 캠페인 결제 정보 조회
  const getCampaignPayment = async (campaignId) => {
    try {
      setLoading(true);
      const payment = await paymentService.getCampaignPayment(campaignId);
      return payment;
    } catch (err) {
      console.error('캠페인 결제 정보 조회 오류:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 기업의 결제 내역 조회
  const getCompanyPayments = async (companyId, filters) => {
    try {
      setLoading(true);
      const payments = await paymentService.getCompanyPayments(companyId, filters);
      return payments;
    } catch (err) {
      console.error('기업 결제 내역 조회 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 모든 결제 내역 조회 (관리자용)
  const getAllPayments = async (filters) => {
    try {
      setLoading(true);
      const result = await paymentService.getAllPayments(filters);
      return result;
    } catch (err) {
      console.error('결제 내역 조회 오류:', err);
      setError(err.message);
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  // 결제 통계 조회 (관리자용)
  const getPaymentStats = async (filters) => {
    try {
      setLoading(true);
      const stats = await paymentService.getPaymentStats(filters);
      return stats;
    } catch (err) {
      console.error('결제 통계 조회 오류:', err);
      setError(err.message);
      return {
        totalAmount: 0,
        statusCounts: [],
        countryStats: []
      };
    } finally {
      setLoading(false);
    }
  };

  // 결제 내역 CSV 내보내기
  const exportPaymentsToCSV = (payments) => {
    return paymentService.exportPaymentsToCSV(payments);
  };

  // 알림 읽음 처리
  const markNotificationAsRead = async (notificationId) => {
    try {
      await paymentService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('알림 읽음 처리 오류:', err);
    }
  };

  // 제공할 컨텍스트 값
  const value = {
    paymentMethods,
    paymentStatuses,
    loading,
    error,
    notifications,
    unreadCount,
    createPayment,
    updatePaymentStatus,
    getCampaignPayment,
    getCompanyPayments,
    getAllPayments,
    getPaymentStats,
    exportPaymentsToCSV,
    markNotificationAsRead
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// 결제 컨텍스트 사용 훅
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentContext;
