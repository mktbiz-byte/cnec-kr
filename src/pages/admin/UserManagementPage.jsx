import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 관리자 계정 정보 조회
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      setError('관리자 목록을 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색어로 필터링
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.company_name.toLowerCase().includes(searchLower) ||
      user.representative_name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="page-title">관리자 계정 관리</h1>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="search-box">
            <input
              type="text"
              placeholder="이름 또는 회사명으로 검색..."
              className="form-control"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {error && <div className="error-message mb-4">{error}</div>}
        
        {loading ? (
          <div className="text-center p-4">로딩 중...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-4">등록된 관리자가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>회사명</th>
                  <th>연락처</th>
                  <th>가입일</th>
                  <th>마지막 로그인</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.representative_name}</td>
                    <td>{user.company_name}</td>
                    <td>{user.phone_number || '-'}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '-'}</td>
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

export default UserManagementPage;
