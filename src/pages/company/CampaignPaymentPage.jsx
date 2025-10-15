import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';

const CampaignPaymentPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData();
      loadCompanyInfo();
      checkExistingPayment();
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

  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;
      setCompanyInfo(data);
    } catch (err) {
      console.error('회사 정보 로드 오류:', err);
    }
  };

  const checkExistingPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setExistingPayment(data[0]);
        
        // 이미 결제가 완료된 경우 캠페인 상세 페이지로 리디렉션
        if (data[0].payment_status === 'completed') {
          navigate(`/company/campaigns/${campaignId}`);
        }
      }
    } catch (err) {
      console.error('결제 정보 확인 오류:', err);
    }
  };

  const handleInputChange = (e, type) => {
    const { name, value } = e.target;
    
    if (type === 'card') {
      setCardInfo(prev => ({ ...prev, [name]: value }));
    } else if (type === 'bank') {
      setBankInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateTotalAmount = () => {
    if (!campaign) return 0;
    
    // 기본 금액 (보상 금액)
    const baseAmount = campaign.reward_amount || 0;
    
    // 수수료 (10%)
    const fee = Math.round(baseAmount * 0.1);
    
    // 소비세 (10%)
    const tax = Math.round((baseAmount + fee) * 0.1);
    
    // 총 금액
    return baseAmount + fee + tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // 결제 방법에 따른 유효성 검사
      if (paymentMethod === 'credit_card') {
        if (!cardInfo.cardNumber || !cardInfo.cardName || !cardInfo.expiryDate || !cardInfo.cvv) {
          setError('모든 카드 정보를 입력해주세요.');
          setProcessing(false);
          return;
        }
      } else if (paymentMethod === 'bank_transfer') {
        if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
          setError('모든 계좌 정보를 입력해주세요.');
          setProcessing(false);
          return;
        }
      }

      // 결제 정보 저장
      const totalAmount = calculateTotalAmount();
      const paymentData = {
        corporate_account_id: companyInfo.id,
        campaign_id: parseInt(campaignId),
        amount: totalAmount,
        currency: 'JPY',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'credit_card' ? 'completed' : 'pending',
        payment_date: paymentMethod === 'credit_card' ? new Date().toISOString() : null,
        payment_reference: paymentMethod === 'credit_card' ? `CARD-${Date.now()}` : `BANK-${Date.now()}`,
        invoice_number: `INV-${Date.now()}`,
        notes: paymentMethod === 'bank_transfer' ? '계좌이체 확인 후 캠페인이 활성화됩니다.' : '',
      };

      // 기존 결제 정보가 있으면 업데이트, 없으면 새로 생성
      let result;
      if (existingPayment) {
        const { data, error } = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', existingPayment.id)
          .select();
        
        if (error) throw error;
        result = data[0];
      } else {
        const { data, error } = await supabase
          .from('payments')
          .insert([paymentData])
          .select();
        
        if (error) throw error;
        result = data[0];
      }

      // 거래 내역 기록
      await supabase
        .from('transactions')
        .insert([{
          transaction_type: 'payment_in',
          amount: totalAmount,
          currency: 'JPY',
          corporate_account_id: companyInfo.id,
          campaign_id: parseInt(campaignId),
          payment_id: result.id,
          transaction_date: new Date().toISOString(),
          description: `캠페인 "${campaign.title}" 결제`,
          status: paymentMethod === 'credit_card' ? 'completed' : 'pending',
        }]);

      // 신용카드 결제인 경우 캠페인 상태 활성화
      if (paymentMethod === 'credit_card') {
        await supabase
          .from('campaigns')
          .update({ status: 'active' })
          .eq('id', campaignId);
      }

      setSuccess('결제가 성공적으로 처리되었습니다.');
      
      // 3초 후 캠페인 상세 페이지로 이동
      setTimeout(() => {
        navigate(`/company/campaigns/${campaignId}`);
      }, 3000);
    } catch (err) {
      console.error('결제 처리 오류:', err);
      setError('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (!campaign) {
    return <div className="text-center p-4">캠페인 정보를 찾을 수 없습니다.</div>;
  }

  const totalAmount = calculateTotalAmount();

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          className="mr-4"
          onClick={() => navigate(`/company/campaigns/${campaignId}`)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="page-title">캠페인 결제</h1>
      </div>

      {error && <div className="error-message mb-4">{error}</div>}
      {success && <div className="success-message mb-4">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">결제 방법 선택</h2>
            <div className="flex flex-wrap gap-4 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={() => setPaymentMethod('credit_card')}
                  className="form-radio"
                />
                <span className="ml-2">신용카드</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="form-radio"
                />
                <span className="ml-2">계좌이체</span>
              </label>
            </div>

            <form onSubmit={handleSubmit}>
              {paymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="cardNumber">카드 번호</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      className="form-control"
                      value={cardInfo.cardNumber}
                      onChange={(e) => handleInputChange(e, 'card')}
                      placeholder="0000 0000 0000 0000"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardName">카드 소유자 이름</label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      className="form-control"
                      value={cardInfo.cardName}
                      onChange={(e) => handleInputChange(e, 'card')}
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="expiryDate">유효기간</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        className="form-control"
                        value={cardInfo.expiryDate}
                        onChange={(e) => handleInputChange(e, 'card')}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        className="form-control"
                        value={cardInfo.cvv}
                        onChange={(e) => handleInputChange(e, 'card')}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-yellow-700">
                      계좌이체를 선택하신 경우, 아래 계좌로 입금 후 관리자 확인이 필요합니다.
                      확인 후 캠페인이 활성화됩니다.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">입금 계좌 정보</h3>
                    <p>은행명: CNEC 은행</p>
                    <p>계좌번호: 123-456-789012</p>
                    <p>예금주: CNEC Japan</p>
                    <p>입금액: {formatCurrency(totalAmount)} JPY</p>
                    <p className="text-sm text-gray-500 mt-2">
                      * 입금자명은 회사명으로 해주세요.
                    </p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="bankName">입금 은행</label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      className="form-control"
                      value={bankInfo.bankName}
                      onChange={(e) => handleInputChange(e, 'bank')}
                      placeholder="입금하신 은행명"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="accountNumber">입금자 계좌번호</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      className="form-control"
                      value={bankInfo.accountNumber}
                      onChange={(e) => handleInputChange(e, 'bank')}
                      placeholder="입금하신 계좌번호"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="accountHolder">입금자명</label>
                    <input
                      type="text"
                      id="accountHolder"
                      name="accountHolder"
                      className="form-control"
                      value={bankInfo.accountHolder}
                      onChange={(e) => handleInputChange(e, 'bank')}
                      placeholder="입금자명"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="btn-secondary mr-2"
                  onClick={() => navigate(`/company/campaigns/${campaignId}`)}
                  disabled={processing}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={processing}
                >
                  {processing ? '처리 중...' : '결제하기'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-semibold mb-4">결제 정보</h2>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                {campaign.brands?.logo_url && (
                  <img
                    src={campaign.brands.logo_url}
                    alt={campaign.brands.name}
                    className="w-6 h-6 mr-2 object-contain"
                  />
                )}
                <h3 className="font-semibold">{campaign.title}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {campaign.brands?.name}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span>기본 금액</span>
                <span>{formatCurrency(campaign.reward_amount)} JPY</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>수수료 (10%)</span>
                <span>{formatCurrency(Math.round(campaign.reward_amount * 0.1))} JPY</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>소비세 (10%)</span>
                <span>{formatCurrency(Math.round((campaign.reward_amount + Math.round(campaign.reward_amount * 0.1)) * 0.1))} JPY</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                <span>총 결제 금액</span>
                <span>{formatCurrency(totalAmount)} JPY</span>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <p>* 결제 완료 후 캠페인이 활성화됩니다.</p>
              <p>* 계좌이체의 경우 입금 확인 후 활성화됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPaymentPage;
