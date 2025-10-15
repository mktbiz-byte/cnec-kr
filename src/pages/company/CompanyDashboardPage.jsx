import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlus, FaChartLine, FaBullhorn, FaTags, FaCalendarAlt } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const CompanyDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBrands: 0,
    totalSpent: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // 기업 계정 정보 가져오기
        const { data: companyData, error: companyError } = await supabase
          .from('corporate_accounts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (companyError) throw companyError;
        const companyId = companyData.id;

        // 캠페인 통계
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('id, status, payment_amount')
          .eq('company_id', companyId);

        if (campaignsError) throw campaignsError;

        // 브랜드 통계
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id')
          .eq('company_id', companyId);

        if (brandsError) throw brandsError;

        // 최근 캠페인
        const { data: recentCampaignsData, error: recentCampaignsError } = await supabase
          .from('campaigns')
          .select(`
            id, 
            title, 
            status, 
            created_at, 
            start_date, 
            end_date, 
            payment_amount,
            brands(name, logo_url)
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentCampaignsError) throw recentCampaignsError;

        // 통계 계산
        const activeCampaigns = campaignsData.filter(c => c.status === 'active').length;
        const totalSpent = campaignsData.reduce((sum, campaign) => sum + (campaign.payment_amount || 0), 0);

        setStats({
          totalCampaigns: campaignsData.length,
          activeCampaigns,
          totalBrands: brandsData.length,
          totalSpent,
        });

        setRecentCampaigns(recentCampaignsData);
      } catch (error) {
        console.error('대시보드 데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <Link
          to="/company/campaigns/create"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          새 캠페인 생성
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaBullhorn className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 캠페인</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaChartLine className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">진행 중인 캠페인</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaTags className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">등록된 브랜드</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBrands}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaCalendarAlt className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 지출</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 캠페인 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  브랜드
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
                      <Link to={`/company/campaigns/${campaign.id}`} className="text-blue-600 hover:underline">
                        {campaign.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {campaign.brands?.logo_url && (
                          <img
                            src={campaign.brands.logo_url}
                            alt={campaign.brands?.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        )}
                        <span>{campaign.brands?.name || '-'}</span>
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
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    캠페인이 없습니다. 새 캠페인을 생성해보세요!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {recentCampaigns.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/company/campaigns"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              모든 캠페인 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboardPage;
