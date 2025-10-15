import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatPhoneNumber } from '../../utils/formatters';

const CompanyProfilePage = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    representative_name: '',
    phone_number: '',
    address: '',
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
      
      <div className="card">
        {error && <div className="error-message mb-4">{error}</div>}
        {success && <div className="success-message mb-4">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="business_number">사업자등록번호</label>
            <input
              type="text"
              id="business_number"
              className="form-control"
              value={companyInfo.business_registration_number}
              disabled
            />
            <small className="text-gray-500">사업자등록번호는 변경할 수 없습니다.</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="company_name">회사명</label>
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
          
          <div className="form-group">
            <label htmlFor="representative_name">대표자명</label>
            <input
              type="text"
              id="representative_name"
              name="representative_name"
              className="form-control"
              value={formData.representative_name}
              onChange={handleInputChange}
              required
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
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">주소</label>
            <input
              type="text"
              id="address"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
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
