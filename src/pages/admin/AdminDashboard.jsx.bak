import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const location = useLocation()
  const currentPath = location.pathname
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        if (currentPath === '/admin' || currentPath === '/admin/companies') {
          // 기업 목록 조회
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (companiesError) throw companiesError
          setCompanies(companiesData || [])
        }
        
        if (currentPath === '/admin/users') {
          // 사용자 목록 조회
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (usersError) throw usersError
          setUsers(usersData || [])
        }
      } catch (err) {
        console.error('데이터 조회 중 오류 발생:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [currentPath])
  
  const renderCompanies = () => (
    <div className="companies-list">
      <h2 className="section-title">기업 목록</h2>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : companies.length === 0 ? (
        <p>등록된 기업이 없습니다.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>기업명</th>
              <th>사업자등록번호</th>
              <th>대표자명</th>
              <th>등록일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.company_name}</td>
                <td>{company.business_registration_number}</td>
                <td>{company.representative_name}</td>
                <td>{new Date(company.created_at).toLocaleDateString()}</td>
                <td>{company.status || '활성'}</td>
                <td>
                  <button className="btn-small">상세</button>
                  <button className="btn-small btn-warning">정지</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
  
  const renderUsers = () => (
    <div className="users-list">
      <h2 className="section-title">사용자 목록</h2>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : users.length === 0 ? (
        <p>등록된 사용자가 없습니다.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>역할</th>
              <th>등록일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.full_name || '-'}</td>
                <td>{user.role || '일반'}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.status || '활성'}</td>
                <td>
                  <button className="btn-small">상세</button>
                  <button className="btn-small btn-warning">정지</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
  
  const renderDashboard = () => (
    <div className="admin-overview">
      <h2 className="section-title">관리자 대시보드</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>총 기업 수</h3>
          <p className="stat-value">{companies.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>이번 달 신규 기업</h3>
          <p className="stat-value">
            {companies.filter(c => {
              const createdDate = new Date(c.created_at)
              const now = new Date()
              return createdDate.getMonth() === now.getMonth() && 
                     createdDate.getFullYear() === now.getFullYear()
            }).length}
          </p>
        </div>
        
        <div className="stat-card">
          <h3>활성 기업</h3>
          <p className="stat-value">
            {companies.filter(c => c.status === '활성' || !c.status).length}
          </p>
        </div>
      </div>
      
      <div className="recent-section">
        <h3>최근 등록된 기업</h3>
        {companies.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>기업명</th>
                <th>사업자등록번호</th>
                <th>대표자명</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {companies.slice(0, 5).map((company) => (
                <tr key={company.id}>
                  <td>{company.company_name}</td>
                  <td>{company.business_registration_number}</td>
                  <td>{company.representative_name}</td>
                  <td>{new Date(company.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>등록된 기업이 없습니다.</p>
        )}
      </div>
    </div>
  )
  
  return (
    <div className="admin-dashboard">
      {currentPath === '/admin' && renderDashboard()}
      {currentPath === '/admin/companies' && renderCompanies()}
      {currentPath === '/admin/users' && renderUsers()}
    </div>
  )
}

export default AdminDashboard
