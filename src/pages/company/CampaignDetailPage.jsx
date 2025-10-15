import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency } from '../../utils/formatters';

const CampaignDetailPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData();
      loadApplications();
      loadPaymentStatus();
    }
  }, [user, campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          brands (id, name, logo_url),
          corporate_accounts (id, company_name)
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      // 권한 확인 (자신의 캠페인인지)
      const { data: companyData } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (data.corporate_account_id !== companyData.id) {
        navigate('/company/campaigns');
        return;
      }

      setCampaign(data);
    } catch (err) {
      console.error('캠페인 정보 로드 오류:', err);
      setError('캠페인 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('campaign_id', campaignId)
        .order('application_date', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('신청 정보 로드 오류:', err);
    }
  };

  const loadPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setPaymentStatus(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error('결제 정보 로드 오류:', err);
    }
  };

  const handleActivateCampaign = async () => {
    if (!campaign) return;

    // 결제가 필요한 경우 결제 페이지로 이동
    if (!paymentStatus || paymentStatus.payment_status !== 'completed') {
      navigate(`/company/campaigns/${campaignId}/payment`);
      return;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId);

      if (error) throw error;

      // 성공 시 캠페인 정보 새로고침
      loadCampaignData();
    } catch (err) {
      console.error('캠페인 활성화 오류:', err);
      setError('캠페인 활성화에 실패했습니다.');
    }
  };

  const handleCancelCampaign = async () => {
    if (!campaign) return;

    if (!window.confirm('정말로 이 캠페인을 취소하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'cancelled' })
        .eq('id', campaignId);

      if (error) throw error;

      // 성공 시 캠페인 정보 새로고침
      loadCampaignData();
    } catch (err) {
      console.error('캠페인 취소 오류:', err);
      setError('캠페인 취소에 실패했습니다.');
    }
  };

  const handleCompleteCampaign = async () => {
    if (!campaign) return;

    if (!window.confirm('캠페인을 완료 처리하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'completed' })
        .eq('id', campaignId);

      if (error) throw error;

      // 성공 시 캠페인 정보 새로고침
      loadCampaignData();
    } catch (err) {
      console.error('캠페인 완료 처리 오류:', err);
      setError('캠페인 완료 처리에 실패했습니다.');
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

  const getApplicationStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '거절됨';
      case 'completed':
        return '완료됨';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (!campaign) {
    return <div className="text-center p-4">캠페인 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          className="mr-4"
          onClick={() => navigate('/company/campaigns')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="page-title">{campaign.title}</h1>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center mb-2">
                  {campaign.brands?.logo_url && (
                    <img
                      src={campaign.brands.logo_url}
                      alt={campaign.brands.name}
                      className="w-8 h-8 mr-2 object-contain"
                    />
                  )}
                  <h2 className="text-xl font-semibold">{campaign.brands?.name}</h2>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded text-xs ${getCampaignStatusClass(campaign.status)}`}>
                    {getCampaignStatusText(campaign.status)}
                  </span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(campaign.start_date)} ~ {formatDate(campaign.end_date)}
                  </span>
                </div>
              </div>
              <div className="flex">
                {campaign.status === 'draft' && (
                  <button
                    className="btn-success mr-2"
                    onClick={handleActivateCampaign}
                  >
                    캠페인 활성화
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    className="btn-secondary mr-2"
                    onClick={handleCompleteCampaign}
                  >
                    완료 처리
                  </button>
                )}
                {(campaign.status === 'draft' || campaign.status === 'active') && (
                  <button
                    className="btn-danger"
                    onClick={handleCancelCampaign}
                  >
                    취소
                  </button>
                )}
                {campaign.status === 'draft' && (
                  <Link
                    to={`/company/campaigns/${campaignId}/edit`}
                    className="btn-primary ml-2"
                  >
                    수정
                  </Link>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">캠페인 설명</h3>
              <p className="whitespace-pre-line">{campaign.description || '설명이 없습니다.'}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">참여 요구사항</h3>
              <p className="whitespace-pre-line">{campaign.requirements || '요구사항이 없습니다.'}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">대상 플랫폼</h3>
              <div className="flex flex-wrap gap-2">
                {campaign.target_platforms?.instagram && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">Instagram</span>
                )}
                {campaign.target_platforms?.tiktok && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-sm">TikTok</span>
                )}
                {campaign.target_platforms?.youtube && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">YouTube</span>
                )}
                {campaign.target_platforms?.blog && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Blog</span>
                )}
                {(!campaign.target_platforms || Object.values(campaign.target_platforms).every(v => !v)) && (
                  <span className="text-gray-500">지정된 플랫폼이 없습니다.</span>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">신청 현황</h3>
            {applications.length === 0 ? (
              <p className="text-gray-500">아직 신청한 크리에이터가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-4 border-b text-left">크리에이터</th>
                      <th className="py-2 px-4 border-b text-center">상태</th>
                      <th className="py-2 px-4 border-b text-center">신청일</th>
                      <th className="py-2 px-4 border-b text-center">SNS 게시물</th>
                      <th className="py-2 px-4 border-b text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          <div className="flex items-center">
                            {app.profiles?.avatar_url && (
                              <img
                                src={app.profiles.avatar_url}
                                alt={app.profiles.username}
                                className="w-8 h-8 rounded-full mr-2 object-cover"
                              />
                            )}
                            <span>{app.profiles?.username || '알 수 없음'}</span>
                          </div>
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getApplicationStatusClass(app.status)}`}>
                            {getApplicationStatusText(app.status)}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {formatDate(app.application_date)}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {app.sns_post_url ? (
                            <a
                              href={app.sns_post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              보기
                            </a>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <Link
                            to={`/company/applications/${app.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            상세보기
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">캠페인 정보</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">보상 금액</div>
                <div className="font-semibold">{formatCurrency(campaign.reward_amount)} JPY</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">최대 참여 크리에이터</div>
                <div className="font-semibold">{campaign.max_creators || '제한 없음'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">현재 신청 수</div>
                <div className="font-semibold">{applications.length}명</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">생성일</div>
                <div>{formatDate(campaign.created_at)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">결제 정보</h3>
            {!paymentStatus ? (
              <div>
                <p className="text-gray-500 mb-4">아직 결제 정보가 없습니다.</p>
                {campaign.status === 'draft' && (
                  <Link
                    to={`/company/campaigns/${campaignId}/payment`}
                    className="btn-primary w-full text-center"
                  >
                    결제하기
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">결제 상태</div>
                  <div className="font-semibold">
                    {paymentStatus.payment_status === 'completed' ? (
                      <span className="text-green-600">결제 완료</span>
                    ) : paymentStatus.payment_status === 'pending' ? (
                      <span className="text-yellow-600">결제 대기 중</span>
                    ) : (
                      <span className="text-red-600">결제 실패</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">결제 금액</div>
                  <div className="font-semibold">{formatCurrency(paymentStatus.amount)} JPY</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">결제 방법</div>
                  <div>{paymentStatus.payment_method}</div>
                </div>
                {paymentStatus.payment_date && (
                  <div>
                    <div className="text-sm text-gray-500">결제일</div>
                    <div>{formatDate(paymentStatus.payment_date)}</div>
                  </div>
                )}
                {paymentStatus.receipt_url && (
                  <div>
                    <a
                      href={paymentStatus.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full text-center"
                    >
                      영수증 보기
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;
