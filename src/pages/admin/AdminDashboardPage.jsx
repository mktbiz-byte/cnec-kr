import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FaChartBar, FaUsers, FaGlobe, FaFileInvoiceDollar, FaCalendarAlt } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [countryStats, setCountryStats] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 기업 수 통계
        const { data: companiesData, error: companiesError } = await supabase
          .from('corporate_accounts')
          .select('id, country_code');

        if (companiesError) throw companiesError;

        // 캠페인 통계
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select(`
            id, 
            title, 
            status, 
            created_at, 
            start_date, 
            end_date, 
            payment_amount,
            payment_status,
            country_code,
            corporate_accounts(company_name),
            brands(name, logo_url)
          `)
          .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;

        // 세금계산서 통계
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('tax_invoices')
          .select('id, status')
          .eq('status', 'pending');

        if (invoicesError) throw invoicesError;

        // 국가별 통계 계산
        const countryData = {};
        companiesData.forEach(company => {
          const country = company.country_code || 'unknown';
          if (!countryData[country]) {
            countryData[country] = { 
              companies: 0, 
              campaigns: 0, 
              revenue: 0,
              activeCampaigns: 0
            };
          }
          countryData[country].companies++;
        });

        campaignsData.forEach(campaign => {
          const country = campaign.country_code || 'unknown';
          if (!countryData[country]) {
            countryData[country] = { 
              companies: 0, 
              campaigns: 0, 
              revenue: 0,
              activeCampaigns: 0
            };
          }
          countryData[country].campaigns++;
          countryData[country].revenue += campaign.payment_amount || 0;
          if (campaign.status === 'active') {
            countryData[country].activeCampaigns++;
          }
        });

        const countryStatsArray = Object.entries(countryData).map(([code, data]) => ({
          countryCode: code,
          countryName: getCountryName(code),
          ...data
        }));

        // 통계 계산
        const activeCampaigns = campaignsData.filter(c => c.status === 'active').length;
        const totalRevenue = campaignsData.reduce((sum, campaign) => sum + (campaign.payment_amount || 0), 0);

        setStats({
          totalCompanies: companiesData.length,
          totalCampaigns: campaignsData.length,
          activeCampaigns,
          totalRevenue,
          pendingInvoices: invoicesData.length,
        });

        setRecentCampaigns(campaignsData.slice(0, 10));
        setCountryStats(countryStatsArray);
      } catch (error) {
        console.error('대시보드 데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  // 캠페인 상태에 따른 배지 색상
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'pending_payment':
        return 'bg-yellow-200 text-yellow-800';
      case 'active':
        return 'bg-green-200 text-green-800';
      case 'completed':
        return 'bg-blue-200 text-blue-800';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // 캠페인 상태 한글 표시
  const getStatusText = (status) => {
    switch (status) {
      case 'draft':
        return '임시 저장';
      case 'pending_payment':
        return '결제 대기';
      case 'active':
        return '진행 중';
      case 'completed':
        return '완료됨';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">통합 관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaUsers className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 기업 수</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCompanies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaGlobe className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 캠페인</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaChartBar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">진행 중 캠페인</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaFileInvoiceDollar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">대기 중 세금계산서</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FaCalendarAlt className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 매출</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 국가별 통계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">국가별 통계</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  국가
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기업 수
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  총 캠페인
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  진행 중 캠페인
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매출
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {countryStats.map((country) => (
                <tr key={country.countryCode} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {country.countryCode !== 'unknown' && (
                        <img
                          src={getFlagUrl(country.countryCode)}
                          alt={country.countryName}
                          className="w-6 h-4 mr-2"
                        />
                      )}
                      <span>{country.countryName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {country.companies}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {country.campaigns}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {country.activeCampaigns}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(country.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최근 캠페인 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">최근 캠페인</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인명
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기업
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  국가
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentCampaigns.length > 0 ? (
                recentCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/admin/campaigns/${campaign.id}`} className="text-purple-600 hover:underline">
                        {campaign.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.corporate_accounts?.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {campaign.country_code && campaign.country_code !== 'unknown' && (
                          <img
                            src={getFlagUrl(campaign.country_code)}
                            alt={getCountryName(campaign.country_code)}
                            className="w-6 h-4 mr-2"
                          />
                        )}
                        <span>{getCountryName(campaign.country_code || 'unknown')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.start_date && campaign.end_date ? (
                        <span>
                          {formatDate(campaign.start_date)} ~ {formatDate(campaign.end_date)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.payment_amount ? formatCurrency(campaign.payment_amount) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    캠페인이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentCampaigns.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/admin/campaigns"
              className="text-purple-600 hover:underline text-sm font-medium"
            >
              모든 캠페인 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
