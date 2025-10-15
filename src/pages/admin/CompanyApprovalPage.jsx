import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const CompanyApprovalPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUnapprovedCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('is_approved', false)
        .eq('is_admin', false) // 관리자 계정은 제외
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCompanies(data);
    } catch (err) {
      setError('승인 대기 중인 회사 정보를 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnapprovedCompanies();
  }, [fetchUnapprovedCompanies]);

  const handleApprove = async (id) => {
    if (!window.confirm('이 계정을 승인하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('corporate_accounts')
        .update({ is_approved: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      alert('계정이 성공적으로 승인되었습니다.');
      fetchUnapprovedCompanies(); // 목록 새로고침
    } catch (err) {
      alert('계정 승인 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  const handleReject = async (id, auth_user_id) => {
    if (!window.confirm('이 가입 요청을 거절하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
        // 1. corporate_accounts 테이블에서 정보 삭제
        const { error: deleteAccountError } = await supabase
            .from('corporate_accounts')
            .delete()
            .eq('id', id);

        if (deleteAccountError) throw deleteAccountError;

        // 2. auth.users 테이블에서 사용자 삭제 (RPC 함수 호출 필요)
        // Supabase에서 auth.users를 직접 삭제하는 것은 보안상 위험하므로, 
        // 관리자 권한을 가진 서버 측 함수(RPC)를 만들어 호출하는 것이 안전합니다.
        // 여기서는 예시로 함수 이름을 'delete_auth_user'로 가정합니다.
        /*
        const { error: deleteAuthUserError } = await supabase.rpc('delete_auth_user', {
            user_id: auth_user_id
        });
        if (deleteAuthUserError) throw deleteAuthUserError;
        */
       // 참고: 위 RPC 함수는 직접 구현해야 합니다. 여기서는 corporate_accounts 삭제만 구현합니다.

        alert('가입 요청이 거절되었습니다.');
        fetchUnapprovedCompanies(); // 목록 새로고침

    } catch (err) {
        alert('요청 거절 중 오류가 발생했습니다.');
        console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="page-title">기업 회원 가입 승인</h1>
      <div className="card">
        <div className="overflow-x-auto">
          {companies.length === 0 ? (
            <p className="text-center text-gray-500 py-8">승인 대기 중인 회사가 없습니다.</p>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>회사명</th>
                  <th>사업자등록번호</th>
                  <th>대표자명</th>
                  <th>연락처</th>
                  <th>신청일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.company_name}</td>
                    <td>{company.business_registration_number}</td>
                    <td>{company.representative_name}</td>
                    <td>{company.phone_number}</td>
                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => handleApprove(company.id)} 
                        className="btn-primary btn-sm mr-2"
                      >
                        승인
                      </button>
                      <button 
                        onClick={() => handleReject(company.id, company.auth_user_id)} 
                        className="btn-danger btn-sm"
                      >
                        거절
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyApprovalPage;
