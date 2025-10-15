import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message p-4">{error}</div>;
  }

  if (!companyInfo) {
    return <div className="text-center p-4">회사 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="page-title">기업 대시보드</h1>
      <div className="card">
        <h2 className="section-title">내 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="info-item">
            <span className="font-bold">회사명:</span>
            <span>{companyInfo.company_name}</span>
          </div>
          <div className="info-item">
            <span className="font-bold">사업자등록번호:</span>
            <span>{companyInfo.business_registration_number}</span>
          </div>
          <div className="info-item">
            <span className="font-bold">대표자명:</span>
            <span>{companyInfo.representative_name}</span>
          </div>
          <div className="info-item">
            <span className="font-bold">연락처:</span>
            <span>{companyInfo.phone_number}</span>
          </div>
          <div className="info-item col-span-2">
            <span className="font-bold">주소:</span>
            <span>{companyInfo.address}</span>
          </div>
          <div className="info-item">
            <span className="font-bold">가입일:</span>
            <span>{new Date(companyInfo.created_at).toLocaleDateString()}</span>
          </div>
           <div className="info-item">
            <span className="font-bold">계정 상태:</span>
            <span className={companyInfo.is_approved ? 'text-green-600' : 'text-yellow-600'}>
              {companyInfo.is_approved ? '승인 완료' : '승인 대기'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
