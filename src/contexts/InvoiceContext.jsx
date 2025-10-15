import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import invoiceService from '../services/invoiceService';

// 세금계산서 컨텍스트 생성
const InvoiceContext = createContext();

// 세금계산서 컨텍스트 제공자 컴포넌트
export const InvoiceProvider = ({ children }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 세금계산서 상태 로드
  useEffect(() => {
    const loadInvoiceStatuses = async () => {
      try {
        setLoading(true);
        const statuses = await invoiceService.getInvoiceStatuses();
        setInvoiceStatuses(statuses);
        setError(null);
      } catch (err) {
        console.error('세금계산서 상태 로드 오류:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceStatuses();
  }, []);

  // 알림 로드
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        const notifications = await invoiceService.getInvoiceNotifications(user.id);
        setNotifications(notifications);
        setUnreadCount(notifications.filter(n => !n.is_read).length);
      } catch (err) {
        console.error('알림 로드 오류:', err);
      }
    };

    loadNotifications();
  }, [user]);

  // 세금계산서 요청
  const requestInvoice = async (requestData) => {
    try {
      setLoading(true);
      const request = await invoiceService.requestInvoice(requestData);
      toast.success(t('invoice.requestSuccess'));
      return request;
    } catch (err) {
      console.error('세금계산서 요청 오류:', err);
      toast.error(t('invoice.requestFailed'));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 세금계산서 요청 처리 (관리자용)
  const processInvoiceRequest = async (requestId, approve, notes) => {
    try {
      setLoading(true);
      const result = await invoiceService.processInvoiceRequest(requestId, approve, notes);
      
      if (approve) {
        toast.success(t('invoice.requestApproved'));
      } else {
        toast.success(t('invoice.requestRejected'));
      }
      
      return result;
    } catch (err) {
      console.error('세금계산서 요청 처리 오류:', err);
      toast.error(t('invoice.processFailed'));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 세금계산서 발행 (관리자용)
  const issueInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      const result = await invoiceService.issueInvoice(invoiceId);
      toast.success(t('invoice.issueSuccess'));
      return result;
    } catch (err) {
      console.error('세금계산서 발행 오류:', err);
      toast.error(t('invoice.issueFailed'));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 세금계산서 조회
  const getInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      const invoice = await invoiceService.getInvoice(invoiceId);
      return invoice;
    } catch (err) {
      console.error('세금계산서 조회 오류:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 결제에 대한 세금계산서 조회
  const getInvoiceByPayment = async (paymentId) => {
    try {
      setLoading(true);
      const invoice = await invoiceService.getInvoiceByPayment(paymentId);
      return invoice;
    } catch (err) {
      console.error('세금계산서 조회 오류:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 기업의 세금계산서 요청 목록 조회
  const getCompanyInvoiceRequests = async (companyId) => {
    try {
      setLoading(true);
      const requests = await invoiceService.getCompanyInvoiceRequests(companyId);
      return requests;
    } catch (err) {
      console.error('세금계산서 요청 목록 조회 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 모든 세금계산서 요청 목록 조회 (관리자용)
  const getAllInvoiceRequests = async (filters) => {
    try {
      setLoading(true);
      const result = await invoiceService.getAllInvoiceRequests(filters);
      return result;
    } catch (err) {
      console.error('세금계산서 요청 목록 조회 오류:', err);
      setError(err.message);
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  // 기업의 세금계산서 목록 조회
  const getCompanyInvoices = async (companyId, filters) => {
    try {
      setLoading(true);
      const invoices = await invoiceService.getCompanyInvoices(companyId, filters);
      return invoices;
    } catch (err) {
      console.error('세금계산서 목록 조회 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 모든 세금계산서 목록 조회 (관리자용)
  const getAllInvoices = async (filters) => {
    try {
      setLoading(true);
      const result = await invoiceService.getAllInvoices(filters);
      return result;
    } catch (err) {
      console.error('세금계산서 목록 조회 오류:', err);
      setError(err.message);
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  // 세금계산서 상태 업데이트
  const updateInvoiceStatus = async (invoiceId, statusId, notes) => {
    try {
      setLoading(true);
      const invoice = await invoiceService.updateInvoiceStatus(invoiceId, statusId, notes);
      toast.success(t('invoice.updateSuccess'));
      return invoice;
    } catch (err) {
      console.error('세금계산서 상태 업데이트 오류:', err);
      toast.error(t('invoice.updateFailed'));
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 세금계산서 CSV 내보내기
  const exportInvoicesToCSV = (invoices) => {
    return invoiceService.exportInvoicesToCSV(invoices);
  };

  // 알림 읽음 처리
  const markNotificationAsRead = async (notificationId) => {
    try {
      await invoiceService.markNotificationAsRead(notificationId);
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
    invoiceStatuses,
    loading,
    error,
    notifications,
    unreadCount,
    requestInvoice,
    processInvoiceRequest,
    issueInvoice,
    getInvoice,
    getInvoiceByPayment,
    getCompanyInvoiceRequests,
    getAllInvoiceRequests,
    getCompanyInvoices,
    getAllInvoices,
    updateInvoiceStatus,
    exportInvoicesToCSV,
    markNotificationAsRead
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};

// 세금계산서 컨텍스트 사용 훅
export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

export default InvoiceContext;
