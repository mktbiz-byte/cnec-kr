import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const CompanyListPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'suspended'

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('corporate_accounts')
        .select('*')
        .eq('is_admin', false)
        .eq('is_approved', true);

      // 상태 필터 적용
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'suspended') {
        query = query.eq('is_active', false);
      }

      // 정렬
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setCompanies(data);
    } catch (err) {
      setError('기업 목록을 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? '활성화' : '정지';
    
    if (!window.confirm(`이 기업 계정을 ${action}하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('corporate_accounts')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // 상태 업데이트 성공 시 목록 새로고침
      fetchCompanies();
      alert(`기업 계정이 ${action}되었습니다.`);
    } catch (err) {
      alert(`기업 계정 ${action} 중 오류가 발생했습니다.`);
      console.error(err);
    }
  };

  // 검색어로 필터링
  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.company_name.toLowerCase().includes(searchLower) ||
      company.business_registration_number.toLowerCase().includes(searchLower) ||
      company.representative_name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="page-title">기업 관리</h1>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="search-box">
            <input
              type="text"
              placeholder="기업명, 사업자번호, 대표자명 검색..."
              className="form-control"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="filter-box">
            <select
              className="form-control"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">모든 기업</option>
              <option value="active">활성 기업</option>
              <option value="suspended">정지된 기업</option>
            </select>
          </div>
        </div>
        
        {error && <div className="error-message mb-4">{error}</div>}
        
        {loading ? (
          <div className="text-center p-4">로딩 중...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center p-4">등록된 기업이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>회사명</th>
                  <th>사업자등록번호</th>
                  <th>대표자명</th>
                  <th>연락처</th>
                  <th>가입일</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.company_name}</td>
                    <td>{company.business_registration_number}</td>
                    <td>{company.representative_name}</td>
                    <td>{company.phone_number}</td>
                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${company.is_active !== false ? 'badge-success' : 'badge-danger'}`}>
                        {company.is_active !== false ? '활성' : '정지'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn-sm ${company.is_active !== false ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleToggleStatus(company.id, company.is_active !== false)}
                      >
                        {company.is_active !== false ? '정지' : '활성화'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyListPage;
