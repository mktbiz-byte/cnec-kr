import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaFileInvoice, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { usePayment } from '../../contexts/PaymentContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { formatCurrency } from '../../utils/formatters';

const InvoiceRequestPage = () => {
  const { t } = useTranslation();
  const { id: paymentId } = useParams();
  const navigate = useNavigate();
  const { user, userCompany } = useAuth();
  const { getCampaignPayment } = usePayment();
  const { requestInvoice, getInvoiceByPayment, loading } = useInvoice();
  
  const [payment, setPayment] = useState(null);
  const [existingInvoice, setExistingInvoice] = useState(null);
  const [taxInfo, setTaxInfo] = useState({
    taxRegistrationNumber: userCompany?.tax_registration_number || '',
    taxOffice: userCompany?.tax_office || '',
    taxType: userCompany?.tax_type || 'corporate',
    invoiceEmail: userCompany?.default_invoice_email || userCompany?.email || '',
  });
  const [notes, setNotes] = useState('');
  const [requestComplete, setRequestComplete] = useState(false);

  // 결제 정보 및 기존 세금계산서 로드
  useEffect(() => {
    const loadPaymentAndInvoice = async () => {
      try {
        // 결제 정보 로드
        const paymentData = await getCampaignPayment(paymentId);
        if (!paymentData) {
          toast.error(t('invoice.paymentNotFound'));
          navigate('/company/campaigns');
          return;
        }
        setPayment(paymentData);
        
        // 기존 세금계산서 확인
        const invoiceData = await getInvoiceByPayment(paymentId);
        if (invoiceData) {
          setExistingInvoice(invoiceData);
          setRequestComplete(true);
        }
      } catch (err) {
        console.error('정보 로드 오류:', err);
        toast.error(t('invoice.loadFailed'));
      }
    };
    
    if (paymentId) {
      loadPaymentAndInvoice();
    }
  }, [paymentId, getCampaignPayment, getInvoiceByPayment, navigate, t]);

  // 입력 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaxInfo(prev => ({ ...prev, [name]: value }));
  };

  // 세금계산서 요청 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!payment || !userCompany) {
      toast.error(t('invoice.invalidData'));
      return;
    }
    
    try {
      // 세금계산서 요청 데이터
      const requestData = {
        payment_id: payment.id,
        company_id: userCompany.id,
        requested_by: user.id,
        notes: notes
      };
      
      // 기업 정보 업데이트 (세금 관련 정보)
      await supabase
        .from('corporate_accounts')
        .update({
          tax_registration_number: taxInfo.taxRegistrationNumber,
          tax_office: taxInfo.taxOffice,
          tax_type: taxInfo.taxType,
          default_invoice_email: taxInfo.invoiceEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', userCompany.id);
      
      // 세금계산서 요청
      await requestInvoice(requestData);
      
      setRequestComplete(true);
      toast.success(t('invoice.requestSuccess'));
    } catch (err) {
      console.error('세금계산서 요청 오류:', err);
      toast.error(t('invoice.requestFailed'));
    }
  };

  // 로딩 중이거나 결제 정보가 없는 경우
  if (loading || !payment) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // 이미 세금계산서가 요청되었거나 발행된 경우
  if (requestComplete) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center flex-col text-center py-8">
            <FaCheckCircle className="text-green-500 text-5xl mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('invoice.alreadyRequested')}</h2>
            <p className="text-gray-600 mb-6">{t('invoice.alreadyRequestedDesc')}</p>
            <button
              onClick={() => navigate(`/company/campaigns/${payment.campaign_id}`)}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              {t('invoice.viewCampaign')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(`/company/campaigns/${payment.campaign_id}`)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold">{t('invoice.requestTitle')}</h1>
        </div>

        {/* 결제 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('payment.info')}</h2>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{t('payment.amount')}</span>
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{t('payment.tax')}</span>
              <span>{formatCurrency(payment.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200">
              <span>{t('payment.total')}</span>
              <span>{formatCurrency(payment.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* 세금계산서 요청 폼 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaFileInvoice className="mr-2" />
            {t('invoice.requestForm')}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="taxRegistrationNumber">
                {t('invoice.taxRegistrationNumber')}
              </label>
              <input
                type="text"
                id="taxRegistrationNumber"
                name="taxRegistrationNumber"
                value={taxInfo.taxRegistrationNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={t('invoice.enterTaxRegistrationNumber')}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="taxOffice">
                {t('invoice.taxOffice')}
              </label>
              <input
                type="text"
                id="taxOffice"
                name="taxOffice"
                value={taxInfo.taxOffice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={t('invoice.enterTaxOffice')}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="taxType">
                {t('invoice.taxType')}
              </label>
              <select
                id="taxType"
                name="taxType"
                value={taxInfo.taxType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="corporate">{t('invoice.corporate')}</option>
                <option value="individual">{t('invoice.individual')}</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="invoiceEmail">
                {t('invoice.invoiceEmail')}
              </label>
              <input
                type="email"
                id="invoiceEmail"
                name="invoiceEmail"
                value={taxInfo.invoiceEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={t('invoice.enterInvoiceEmail')}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="notes">
                {t('invoice.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={t('invoice.enterNotes')}
                rows="3"
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                disabled={loading}
              >
                {loading ? t('common.processing') : t('invoice.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceRequestPage;
