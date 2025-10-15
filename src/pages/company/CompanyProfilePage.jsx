import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatPhoneNumber, formatBusinessNumber } from '../../utils/formatters';

const CompanyProfilePage = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    representative_name: '',
    phone_number: '',
    address: '',
    tax_email: '', // 세금계산서 수신용 이메일
    bank_name: '',
    bank_account: '',
    account_holder: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCompanyInfo = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;
      
      setCompanyInfo(data);
      setFormData({
        company_name: data.company_name || '',
        representative_name: data.representative_name || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
        tax_email: data.tax_email || '',
        bank_name: data.bank_name || '',
        bank_account: data.bank_account || '',
        account_holder: data.account_holder || ''
      });
    } catch (err) {
      setError('회사 정보를 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('corporate_accounts')
        .update({
          company_name: formData.company_name,
          representative_name: formData.representative_name,
          phone_number: formData.phone_number,
          address: formData.address,
          tax_email: formData.tax_email,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          account_holder: formData.account_holder,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;
      
      setSuccess('회사 정보가 성공적으로 업데이트되었습니다.');
      fetchCompanyInfo(); // 최신 정보로 갱신
    } catch (err) {
      setError('회사 정보 업데이트에 실패했습니다.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (!companyInfo) {
    return <div className="text-center p-4">회사 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="page-title">회사 정보 관리</h1>
      <p className="text-gray-600 mb-4">세금계산서 발급에 필요한 정보를 입력해주세요.</p>
      
      <div className="card">
        {error && <div className="error-message mb-4">{error}</div>}
        {success && <div className="success-message mb-4">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
            
            <div className="form-group">
              <label htmlFor="business_number">사업자등록번호</label>
              <input
                type="text"
                id="business_number"
                className="form-control"
                value={formatBusinessNumber(companyInfo.business_registration_number)}
                disabled
              />
              <small className="text-gray-500">사업자등록번호는 변경할 수 없습니다.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="company_name">회사명 <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                className="form-control"
                value={formData.company_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">세금계산서 정보</h2>
            
            <div className="form-group">
              <label htmlFor="representative_name">대표자명</label>
              <input
                type="text"
                id="representative_name"
                name="representative_name"
                className="form-control"
                value={formData.representative_name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address">사업장 주소</label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone_number">연락처</label>
              <input
                type="text"
                id="phone_number"
                name="phone_number"
                className="form-control"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="000-0000-0000"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tax_email">세금계산서 수신 이메일</label>
              <input
                type="email"
                id="tax_email"
                name="tax_email"
                className="form-control"
                value={formData.tax_email}
                onChange={handleInputChange}
                placeholder="세금계산서를 받을 이메일"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">정산 계좌 정보</h2>
            
            <div className="form-group">
              <label htmlFor="bank_name">은행명</label>
              <input
                type="text"
                id="bank_name"
                name="bank_name"
                className="form-control"
                value={formData.bank_name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bank_account">계좌번호</label>
              <input
                type="text"
                id="bank_account"
                name="bank_account"
                className="form-control"
                value={formData.bank_account}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="account_holder">예금주</label>
              <input
                type="text"
                id="account_holder"
                name="account_holder"
                className="form-control"
                value={formData.account_holder}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={saving}
          >
            {saving ? '저장 중...' : '정보 저장'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
