import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency } from '../../utils/formatters';

const CampaignListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, draft, completed, cancelled
  const [brandFilter, setBrandFilter] = useState('all');
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    if (user) {
      loadBrands();
      loadCampaigns();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [filter, brandFilter]);

  const loadBrands = async () => {
    try {
      // 회사 ID 조회
      const { data: companyData, error: companyError } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // 브랜드 목록 조회
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('corporate_account_id', companyData.id)
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('브랜드 목록 로드 오류:', err);
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError('');

      // 회사 ID 조회
      const { data: companyData, error: companyError } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // 캠페인 목록 조회 쿼리 구성
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          brands (id, name, logo_url)
        `)
        .eq('corporate_account_id', companyData.id);

      // 상태 필터 적용
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // 브랜드 필터 적용
      if (brandFilter !== 'all') {
        query = query.eq('brand_id', brandFilter);
      }

      // 정렬 (최신순)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('캠페인 목록 로드 오류:', err);
      setError('캠페인 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCampaignStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignStatusText = (status) => {
    switch (status) {
      case 'active':
        return '진행 중';
      case 'draft':
        return '임시 저장';
      case 'completed':
        return '완료됨';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  if (loading && campaigns.length === 0) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">캠페인 관리</h1>
        <button
          className="btn-primary"
          onClick={() => navigate('/company/campaigns/create')}
        >
          새 캠페인 생성
        </button>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="form-group mb-0">
            <label htmlFor="filter" className="mr-2">상태 필터:</label>
            <select
              id="filter"
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">모든 상태</option>
              <option value="draft">임시 저장</option>
              <option value="active">진행 중</option>
              <option value="completed">완료됨</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>

          {brands.length > 0 && (
            <div className="form-group mb-0">
              <label htmlFor="brandFilter" className="mr-2">브랜드 필터:</label>
              <select
                id="brandFilter"
                className="form-select"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="all">모든 브랜드</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-500">등록된 캠페인이 없습니다.</p>
          <p className="mt-2">
            <button
              className="text-blue-600 hover:underline"
              onClick={() => navigate('/company/campaigns/create')}
            >
              첫 캠페인을 생성해보세요!
            </button>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">캠페인명</th>
                <th className="py-2 px-4 border-b text-left">브랜드</th>
                <th className="py-2 px-4 border-b text-center">상태</th>
                <th className="py-2 px-4 border-b text-right">보상 금액</th>
                <th className="py-2 px-4 border-b text-center">기간</th>
                <th className="py-2 px-4 border-b text-center">신청 현황</th>
                <th className="py-2 px-4 border-b text-center">결제 상태</th>
                <th className="py-2 px-4 border-b text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    <Link
                      to={`/company/campaigns/${campaign.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {campaign.title}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center">
                      {campaign.brands?.logo_url && (
                        <img
                          src={campaign.brands.logo_url}
                          alt={campaign.brands.name}
                          className="w-6 h-6 mr-2 object-contain"
                        />
                      )}
                      {campaign.brands?.name}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <span className={`px-2 py-1 rounded text-xs ${getCampaignStatusClass(campaign.status)}`}>
                      {getCampaignStatusText(campaign.status)}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {formatCurrency(campaign.reward_amount)} JPY
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <div className="text-xs">
                      <div>{formatDate(campaign.start_date)}</div>
                      <div>~</div>
                      <div>{formatDate(campaign.end_date)}</div>
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {/* 신청 현황은 추후 구현 */}
                    <span className="text-gray-500">-</span>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {/* 결제 상태는 추후 구현 */}
                    <span className="text-gray-500">-</span>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        to={`/company/campaigns/${campaign.id}/edit`}
                        className="text-blue-600 hover:text-blue-800"
                        title="수정"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      {campaign.status === 'draft' && (
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="활성화"
                          onClick={() => {/* 활성화 로직 추후 구현 */}}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CampaignListPage;
