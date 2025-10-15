import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { FaFileInvoice, FaSearch, FaFilter, FaDownload, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { useInvoice } from '../../contexts/InvoiceContext';
import { formatCurrency } from '../../utils/formatters';

const InvoiceManagementPage = () => {
  const { t } = useTranslation();
  const {
    invoiceStatuses,
    getAllInvoiceRequests,
    getAllInvoices,
    processInvoiceRequest,
    issueInvoice,
    exportInvoicesToCSV,
    loading
  } = useInvoice();
  
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    companyId: '',
    countryCode: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 10
  });
  
  const [countries] = useState([
    { code: 'kr', name: '한국' },
    { code: 'jp', name: '일본' },
    { code: 'us', name: '미국' },
    { code: 'tw', name: '대만' }
  ]);

  // 요청 및 세금계산서 로드
  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    try {
      if (activeTab === 'requests') {
        const { data, count } = await getAllInvoiceRequests({
          ...filters,
          page: currentPage
        });
        setRequests(data || []);
        setTotalRequests(count || 0);
      } else {
        const { data, count } = await getAllInvoices({
          ...filters,
          page: currentPage
        });
        setInvoices(data || []);
        setTotalInvoices(count || 0);
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      toast.error(t('invoice.loadFailed'));
    }
  };

  // 필터 변경 처리
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // 페이지 변경 처리
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  };

  // 요청 처리 (승인/거부)
  const handleProcessRequest = async (requestId, approve) => {
    try {
      setProcessingId(requestId);
      await processInvoiceRequest(
        requestId,
        approve,
        approve ? '요청이 승인되었습니다.' : '요청이 거부되었습니다.'
      );
      
      // 데이터 다시 로드
      loadData();
    } catch (err) {
      console.error('요청 처리 오류:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // 세금계산서 발행
  const handleIssueInvoice = async (invoiceId) => {
    try {
      setProcessingId(invoiceId);
      await issueInvoice(invoiceId);
      
      // 데이터 다시 로드
      loadData();
    } catch (err) {
      console.error('세금계산서 발행 오류:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    const csvContent = exportInvoicesToCSV(invoices);
    
    // CSV 파일 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 총 페이지 수 계산
  const totalPages = activeTab === 'requests'
    ? Math.ceil(totalRequests / filters.pageSize)
    : Math.ceil(totalInvoices / filters.pageSize);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <FaFileInvoice className="mr-2" />
          {t('invoice.management')}
        </h1>
        
        {activeTab === 'invoices' && (
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={invoices.length === 0}
          >
            <FaDownload className="mr-2" />
            {t('invoice.exportCSV')}
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'requests'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            {t('invoice.requests')}
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'invoices'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('invoices')}
          >
            {t('invoice.invoices')}
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center mb-2">
          <FaFilter className="text-gray-500 mr-2" />
          <h2 className="font-medium">{t('common.filters')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1" htmlFor="countryCode">
              {t('common.country')}
            </label>
            <select
              id="countryCode"
              name="countryCode"
              value={filters.countryCode}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">{t('common.all')}</option>
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1" htmlFor="status">
              {t('common.status')}
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">{t('common.all')}</option>
              {activeTab === 'requests' ? (
                <>
                  <option value="pending">{t('invoice.pending')}</option>
                  <option value="approved">{t('invoice.approved')}</option>
                  <option value="rejected">{t('invoice.rejected')}</option>
                  <option value="completed">{t('invoice.completed')}</option>
                </>
              ) : (
                invoiceStatuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="startDate">
                {t('common.startDate')}
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="endDate">
                {t('common.endDate')}
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex">
          <div className="relative flex-1">
            <input
              type="text"
              name="search"
              placeholder={t('common.search')}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button
            onClick={() => setFilters({
              status: '',
              companyId: '',
              countryCode: '',
              startDate: '',
              endDate: '',
              page: 1,
              pageSize: 10
            })}
            className="ml-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('common.reset')}
          </button>
        </div>
      </div>

      {/* 요청 목록 */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.requestDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.company')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.company?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.company?.business_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(request.payment?.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {request.status === 'pending'
                            ? t('invoice.pending')
                            : request.status === 'approved'
                            ? t('invoice.approved')
                            : request.status === 'rejected'
                            ? t('invoice.rejected')
                            : t('invoice.completed')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleProcessRequest(request.id, true)}
                              className="text-green-600 hover:text-green-900"
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaCheck />
                              )}
                            </button>
                            <button
                              onClick={() => handleProcessRequest(request.id, false)}
                              className="text-red-600 hover:text-red-900"
                              disabled={processingId === request.id}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? t('common.loading') : t('invoice.noRequests')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 세금계산서 목록 */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.number')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.company')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoice.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.company?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.company?.business_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status?.code === 'requested'
                            ? 'bg-yellow-100 text-yellow-800'
                            : invoice.status?.code === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : invoice.status?.code === 'issued'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status?.code === 'sent'
                            ? 'bg-purple-100 text-purple-800'
                            : invoice.status?.code === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {invoice.status?.code === 'requested' && (
                          <button
                            onClick={() => handleIssueInvoice(invoice.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={processingId === invoice.id}
                          >
                            {processingId === invoice.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              t('invoice.issue')
                            )}
                          </button>
                        )}
                        {invoice.pdf_url && (
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 ml-2"
                          >
                            {t('invoice.view')}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? t('common.loading') : t('invoice.noInvoices')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('common.previous')}
            </button>
            
            <div className="flex mx-2">
              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handlePageChange(page + 1)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page + 1
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('common.next')}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagementPage;
