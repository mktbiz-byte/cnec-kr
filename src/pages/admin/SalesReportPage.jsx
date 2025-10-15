import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency } from '../../utils/formatters';

const SalesReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
  });
  const [filter, setFilter] = useState({
    dateRange: 'all', // all, today, this_week, this_month, custom
    startDate: '',
    endDate: '',
    paymentStatus: 'all', // all, pending, completed, failed
    companyId: 'all',
  });
  const [companies, setCompanies] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filter.dateRange, filter.paymentStatus, filter.companyId]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('id, company_name')
        .order('company_name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('회사 목록 로드 오류:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      // 기본 쿼리
      let query = supabase
        .from('transactions')
        .select(`
          *,
          corporate_accounts (id, company_name),
          campaigns (id, title),
          payments (id, payment_status, payment_method)
        `)
        .eq('transaction_type', 'payment_in');

      // 날짜 필터 적용
      if (filter.dateRange !== 'all') {
        let startDate, endDate;
        
        if (filter.dateRange === 'custom' && filter.startDate && filter.endDate) {
          startDate = new Date(filter.startDate);
          endDate = new Date(filter.endDate);
          endDate.setHours(23, 59, 59, 999); // 종료일 끝으로 설정
        } else {
          const now = new Date();
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          
          if (filter.dateRange === 'today') {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
          } else if (filter.dateRange === 'this_week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay()); // 이번 주 일요일
            startDate.setHours(0, 0, 0, 0);
          } else if (filter.dateRange === 'this_month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
          }
        }
        
        if (startDate) {
          query = query.gte('transaction_date', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('transaction_date', endDate.toISOString());
        }
      }

      // 결제 상태 필터 적용
      if (filter.paymentStatus !== 'all') {
        query = query.eq('payments.payment_status', filter.paymentStatus);
      }

      // 회사 필터 적용
      if (filter.companyId !== 'all') {
        query = query.eq('corporate_account_id', filter.companyId);
      }

      // 정렬 (최신순)
      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);

      // 요약 정보 계산
      calculateSummary(data || []);
    } catch (err) {
      console.error('거래 내역 로드 오류:', err);
      setError('거래 내역을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    const summary = {
      totalRevenue: 0,
      totalPayments: data.length,
      pendingPayments: 0,
      completedPayments: 0,
    };

    data.forEach(transaction => {
      summary.totalRevenue += transaction.amount;
      
      if (transaction.payments?.payment_status === 'pending') {
        summary.pendingPayments++;
      } else if (transaction.payments?.payment_status === 'completed') {
        summary.completedPayments++;
      }
    });

    setSummary(summary);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'dateRange' && value !== 'custom') {
      setShowDatePicker(false);
    } else if (name === 'dateRange' && value === 'custom') {
      setShowDatePicker(true);
    }
    
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCustomDate = () => {
    loadTransactions();
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    // CSV 헤더
    const headers = [
      '거래 ID',
      '거래 일시',
      '회사명',
      '캠페인',
      '금액',
      '결제 방법',
      '결제 상태',
      '설명',
    ];
    
    // CSV 데이터 행
    const rows = transactions.map(transaction => [
      transaction.id,
      formatDate(transaction.transaction_date),
      transaction.corporate_accounts?.company_name || '',
      transaction.campaigns?.title || '',
      transaction.amount,
      transaction.payments?.payment_method || '',
      transaction.payments?.payment_status || '',
      transaction.description || '',
    ]);
    
    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // 다운로드 링크 생성
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="page-title mb-6">매출 보고서</h1>

      {error && <div className="error-message mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">총 매출</h3>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)} JPY</p>
        </div>
        <div className="card p-4 bg-green-50">
          <h3 className="text-lg font-semibold text-green-800 mb-2">총 결제 건수</h3>
          <p className="text-2xl font-bold">{summary.totalPayments}건</p>
        </div>
        <div className="card p-4 bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">대기 중인 결제</h3>
          <p className="text-2xl font-bold">{summary.pendingPayments}건</p>
        </div>
        <div className="card p-4 bg-green-50">
          <h3 className="text-lg font-semibold text-green-800 mb-2">완료된 결제</h3>
          <p className="text-2xl font-bold">{summary.completedPayments}건</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group mb-0">
            <label htmlFor="dateRange" className="mr-2">기간:</label>
            <select
              id="dateRange"
              name="dateRange"
              className="form-select"
              value={filter.dateRange}
              onChange={handleFilterChange}
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘</option>
              <option value="this_week">이번 주</option>
              <option value="this_month">이번 달</option>
              <option value="custom">직접 지정</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label htmlFor="paymentStatus" className="mr-2">결제 상태:</label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              className="form-select"
              value={filter.paymentStatus}
              onChange={handleFilterChange}
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기 중</option>
              <option value="completed">완료됨</option>
              <option value="failed">실패</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label htmlFor="companyId" className="mr-2">회사:</label>
            <select
              id="companyId"
              name="companyId"
              className="form-select"
              value={filter.companyId}
              onChange={handleFilterChange}
            >
              <option value="all">모든 회사</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showDatePicker && (
          <div className="mt-4 p-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label htmlFor="startDate" className="mr-2">시작일:</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="form-control"
                  value={filter.startDate}
                  onChange={handleDateChange}
                />
              </div>
              <div className="form-group mb-0">
                <label htmlFor="endDate" className="mr-2">종료일:</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="form-control"
                  value={filter.endDate}
                  onChange={handleDateChange}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="btn-primary"
                onClick={handleApplyCustomDate}
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">거래 내역</h2>
          <button
            className="btn-secondary"
            onClick={exportToCSV}
            disabled={transactions.length === 0}
          >
            CSV 내보내기
          </button>
        </div>

        {loading ? (
          <div className="text-center p-4">로딩 중...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            조건에 맞는 거래 내역이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b text-left">거래 ID</th>
                  <th className="py-2 px-4 border-b text-left">거래 일시</th>
                  <th className="py-2 px-4 border-b text-left">회사명</th>
                  <th className="py-2 px-4 border-b text-left">캠페인</th>
                  <th className="py-2 px-4 border-b text-right">금액</th>
                  <th className="py-2 px-4 border-b text-center">결제 방법</th>
                  <th className="py-2 px-4 border-b text-center">결제 상태</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{transaction.id}</td>
                    <td className="py-2 px-4 border-b">{formatDate(transaction.transaction_date)}</td>
                    <td className="py-2 px-4 border-b">{transaction.corporate_accounts?.company_name || '-'}</td>
                    <td className="py-2 px-4 border-b">{transaction.campaigns?.title || '-'}</td>
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(transaction.amount)} JPY</td>
                    <td className="py-2 px-4 border-b text-center">
                      {transaction.payments?.payment_method === 'credit_card' ? '신용카드' : 
                       transaction.payments?.payment_method === 'bank_transfer' ? '계좌이체' : '-'}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.payments?.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.payments?.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.payments?.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.payments?.payment_status === 'completed' ? '완료됨' :
                         transaction.payments?.payment_status === 'pending' ? '대기 중' :
                         transaction.payments?.payment_status === 'failed' ? '실패' : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReportPage;
