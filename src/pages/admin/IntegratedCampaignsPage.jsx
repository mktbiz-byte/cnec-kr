import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { 
  FaGlobe, 
  FaFilter, 
  FaSearch, 
  FaDownload, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaSpinner
} from 'react-icons/fa';
import { useCountry } from '../../contexts/CountryContext';

const IntegratedCampaignsPage = () => {
  const { t } = useTranslation();
  const { 
    activeCountries, 
    countryStats, 
    getIntegratedCampaigns, 
    formatCurrency,
    loading: countryLoading 
  } = useCountry();
  
  const [campaigns, setCampaigns] = useState([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [filters, setFilters] = useState({
    countryCode: '',
    status: '',
    companyId: '',
    startDate: '',
    endDate: '',
    paymentStatus: '',
    search: '',
    page: 1,
    pageSize: 10
  });

  // 캠페인 목록 로드
  useEffect(() => {
    loadCampaigns();
  }, [filters, currentPage]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { data, count } = await getIntegratedCampaigns({
        ...filters,
        page: currentPage,
        pageSize
      });
      
      setCampaigns(data);
      setTotalCampaigns(count);
    } catch (err) {
      console.error('캠페인 목록 로드 오류:', err);
      toast.error(t('campaign.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 필터 변경 처리
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // 검색 처리
  const handleSearch = (e) => {
    e.preventDefault();
    loadCampaigns();
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      countryCode: '',
      status: '',
      companyId: '',
      startDate: '',
      endDate: '',
      paymentStatus: '',
      search: '',
      page: 1,
      pageSize: 10
    });
    setCurrentPage(1);
  };

  // 페이지 변경 처리
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    // CSV 내보내기 로직 구현
    toast.success(t('common.exportSuccess'));
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalCampaigns / pageSize);

  // 국가별 통계 카드
  const renderCountryStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {countryStats.map((stat) => (
          <div key={stat.country_id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <FaGlobe className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">{stat.country_name}</h3>
                <p className="text-xs text-gray-500">{stat.country_code.toUpperCase()}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">{t('campaign.totalCampaigns')}</span>
                <span className="font-medium">{stat.total_campaigns}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">{t('campaign.activeCampaigns')}</span>
                <span className="font-medium">{stat.active_campaigns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{t('campaign.totalRevenue')}</span>
                <span className="font-medium">{formatCurrency(stat.total_revenue, stat.country_code)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <FaGlobe className="mr-2" />
          {t('campaign.integratedCampaigns')}
        </h1>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          disabled={campaigns.length === 0}
        >
          <FaDownload className="mr-2" />
          {t('common.exportCSV')}
        </button>
      </div>

      {/* 국가별 통계 */}
      {countryLoading ? (
        <div className="flex justify-center items-center h-32">
          <FaSpinner className="animate-spin text-purple-600 text-2xl" />
        </div>
      ) : (
        renderCountryStats()
      )}

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
              {activeCountries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1" htmlFor="status">
              {t('campaign.status')}
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">{t('common.all')}</option>
              <option value="draft">{t('campaign.draft')}</option>
              <option value="pending">{t('campaign.pending')}</option>
              <option value="active">{t('campaign.active')}</option>
              <option value="completed">{t('campaign.completed')}</option>
              <option value="cancelled">{t('campaign.cancelled')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1" htmlFor="paymentStatus">
              {t('payment.status')}
            </label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">{t('common.all')}</option>
              <option value="pending">{t('payment.pending')}</option>
              <option value="completed">{t('payment.completed')}</option>
              <option value="failed">{t('payment.failed')}</option>
              <option value="refunded">{t('payment.refunded')}</option>
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
          <form onSubmit={handleSearch} className="relative flex-1">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder={t('common.search')}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <button type="submit" className="hidden">Search</button>
          </form>
          
          <button
            onClick={resetFilters}
            className="ml-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('common.reset')}
          </button>
        </div>
      </div>

      {/* 캠페인 목록 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('campaign.title')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.country')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('campaign.company')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('campaign.brand')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('campaign.budget')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('campaign.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payment.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <FaSpinner className="animate-spin inline mr-2" />
                    {t('common.loading')}
                  </td>
                </tr>
              ) : campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {campaign.country_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {campaign.country_code.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.brand_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(campaign.budget, campaign.country_code)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : campaign.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : campaign.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`campaign.${campaign.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.payment_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : campaign.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : campaign.payment_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.payment_status ? t(`payment.${campaign.payment_status}`) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <FaEye />
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <FaEdit />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    {t('campaign.noCampaigns')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

export default IntegratedCampaignsPage;
