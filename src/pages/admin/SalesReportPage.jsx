import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaDownload, FaFilter, FaCalendarAlt, FaGlobe } from 'react-icons/fa';

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
    countryCode: 'all',
  });
  const [companies, setCompanies] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filter.dateRange, filter.paymentStatus, filter.companyId, filter.countryCode]);

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
          campaigns (id, title, country_code),
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
      
      // 국가 필터 적용 (클라이언트 측에서)
      let filteredData = data || [];
      if (filter.countryCode !== 'all') {
        filteredData = filteredData.filter(transaction => 
          transaction.campaigns?.country_code === filter.countryCode
        );
      }
      
      setTransactions(filteredData);

      // 요약 정보 계산
      calculateSummary(filteredData);
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
      '국가',
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
      getCountryName(transaction.campaigns?.country_code || 'unknown'),
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

  // 국가 코드에 따른 국가명 반환
  const getCountryName = (code) => {
    const countries = {
      'jp': '일본',
      'kr': '한국',
      'us': '미국',
      'tw': '대만',
      'unknown': '미지정'
    };
    return countries[code] || code;
  };

  // 국가 코드에 따른 국기 이미지 URL 반환
  const getFlagUrl = (code) => {
    if (code === 'unknown') return null;
    return `https://flagcdn.com/48x36/${code.toLowerCase()}.png`;
  };

  // 결제 상태에 따른 배지 색상
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'failed':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // 결제 상태 텍스트 반환
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'completed':
        return '완료됨';
      case 'failed':
        return '실패';
      default:
        return status;
    }
  };

  // 결제 방법 텍스트 반환
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'bank_transfer':
        return '계좌이체';
      case 'credit_card':
        return '신용카드';
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">매출 보고서</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          disabled={transactions.length === 0}
        >
          <FaDownload className="mr-2" />
          CSV 다운로드
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">총 매출</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">총 거래 건수</p>
          <p className="text-2xl font-semibold text-gray-900">{summary.totalPayments}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">대기 중인 결제</p>
          <p className="text-2xl font-semibold text-gray-900">{summary.pendingPayments}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">완료된 결제</p>
          <p className="text-2xl font-semibold text-gray-900">{summary.completedPayments}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <FaFilter className="text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">필터</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaCalendarAlt className="inline mr-1" /> 기간
            </label>
            <select
              name="dateRange"
              value={filter.dateRange}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘</option>
              <option value="this_week">이번 주</option>
              <option value="this_month">이번 달</option>
              <option value="custom">직접 지정</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              결제 상태
            </label>
            <select
              name="paymentStatus"
              value={filter.paymentStatus}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기 중</option>
              <option value="completed">완료됨</option>
              <option value="failed">실패</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaGlobe className="inline mr-1" /> 국가
            </label>
            <select
              name="countryCode"
              value={filter.countryCode}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">모든 국가</option>
              <option value="jp">일본</option>
              <option value="kr">한국</option>
              <option value="us">미국</option>
              <option value="tw">대만</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기업
            </label>
            <select
              name="companyId"
              value={filter.companyId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">모든 기업</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작일
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filter.startDate}
                  onChange={handleDateChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료일
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filter.endDate}
                  onChange={handleDateChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleApplyCustomDate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 거래 내역 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">거래 내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래 ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래 일시
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기업
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  국가
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제 방법
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.corporate_accounts?.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.campaigns?.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {transaction.campaigns?.country_code && transaction.campaigns.country_code !== 'unknown' && (
                          <img
                            src={getFlagUrl(transaction.campaigns.country_code)}
                            alt={getCountryName(transaction.campaigns.country_code)}
                            className="w-6 h-4 mr-2"
                          />
                        )}
                        <span>{getCountryName(transaction.campaigns?.country_code || 'unknown')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentMethodText(transaction.payments?.payment_method || '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(transaction.payments?.payment_status)}`}>
                        {getStatusText(transaction.payments?.payment_status || '-')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    거래 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReportPage;
