import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. 전체 회사 수 통계
      const { data: allCompanies, error: allError } = await supabase
        .from('corporate_accounts')
        .select('id, is_approved', { count: 'exact' })
        .eq('is_admin', false);

      if (allError) throw allError;

      const total = allCompanies.length;
      const approved = allCompanies.filter(c => c.is_approved).length;
      const pending = total - approved;
      setStats({ total, approved, pending });

      // 2. 승인된 회사 목록
      const { data: approvedCompanies, error: approvedError } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('is_approved', true)
        .eq('is_admin', false)
        .order('created_at', { ascending: false });

      if (approvedError) throw approvedError;
      setCompanies(approvedCompanies);

    } catch (err) {
      setError('데이터를 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="page-title">관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="stats-grid mb-8">
        <div className="stat-card">
          <h3>총 등록 기업</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>승인 완료</h3>
          <p className="stat-value text-green-600">{stats.approved}</p>
        </div>
        <div className="stat-card">
          <h3>승인 대기</h3>
          <p className="stat-value text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* 승인된 회사 목록 */}
      <div className="card">
        <h2 className="section-title">승인된 기업 목록</h2>
        <div className="overflow-x-auto">
          {companies.length === 0 ? (
            <p className="text-center text-gray-500 py-8">승인된 기업이 없습니다.</p>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>회사명</th>
                  <th>사업자등록번호</th>
                  <th>대표자명</th>
                  <th>가입일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.company_name}</td>
                    <td>{company.business_registration_number}</td>
                    <td>{company.representative_name}</td>
                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success">승인 완료</span>
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

export default AdminDashboard;
