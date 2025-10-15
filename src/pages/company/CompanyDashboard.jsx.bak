import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const CompanyDashboard = () => {
  const [companyData, setCompanyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    company_name: '',
    representative_name: '',
    phone_number: '',
    address: '',
    business_registration_number: ''
  })
  
  const { user } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname
  
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        
        // 사용자 ID로 기업 정보 조회
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (error) throw error
        
        setCompanyData(data)
        setFormData({
          company_name: data.company_name || '',
          representative_name: data.representative_name || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          business_registration_number: data.business_registration_number || ''
        })
      } catch (err) {
        console.error('기업 정보 조회 중 오류 발생:', err)
        setError('기업 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCompanyData()
  }, [user])
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!companyData) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: formData.company_name,
          representative_name: formData.representative_name,
          phone_number: formData.phone_number,
          address: formData.address
        })
        .eq('id', companyData.id)
      
      if (error) throw error
      
      alert('기업 정보가 성공적으로 업데이트되었습니다.')
    } catch (err) {
      console.error('기업 정보 업데이트 중 오류 발생:', err)
      setError('기업 정보를 업데이트하는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  const renderDashboard = () => (
    <div className="company-overview">
      <h2 className="section-title">기업 대시보드</h2>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !companyData ? (
        <p>기업 정보를 찾을 수 없습니다.</p>
      ) : (
        <>
          <div className="company-info-card">
            <h3>기업 정보</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">기업명</span>
                <span className="info-value">{companyData.company_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">사업자등록번호</span>
                <span className="info-value">{companyData.business_registration_number}</span>
              </div>
              <div className="info-item">
                <span className="info-label">대표자명</span>
                <span className="info-value">{companyData.representative_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">연락처</span>
                <span className="info-value">{companyData.phone_number}</span>
              </div>
              <div className="info-item">
                <span className="info-label">주소</span>
                <span className="info-value">{companyData.address}</span>
              </div>
              <div className="info-item">
                <span className="info-label">가입일</span>
                <span className="info-value">{new Date(companyData.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="welcome-message">
            <h3>환영합니다, {companyData.company_name}님!</h3>
            <p>CNEC 기업 관리 시스템에서 기업 정보를 관리하고 다양한 서비스를 이용하세요.</p>
          </div>
        </>
      )}
    </div>
  )
  
  const renderProfile = () => (
    <div className="company-profile">
      <h2 className="section-title">기업 정보 관리</h2>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !companyData ? (
        <p>기업 정보를 찾을 수 없습니다.</p>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="company_name">기업명</label>
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
            <label htmlFor="business_registration_number">사업자등록번호</label>
            <input
              type="text"
              id="business_registration_number"
              className="form-control"
              value={formData.business_registration_number}
              disabled
            />
            <small>사업자등록번호는 변경할 수 없습니다.</small>
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
              type="tel"
              id="phone_number"
              name="phone_number"
              className="form-control"
              value={formData.phone_number}
              onChange={handleInputChange}
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
            className="btn-primary"
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </form>
      )}
    </div>
  )
  
  return (
    <div className="company-dashboard">
      {currentPath === '/company' && renderDashboard()}
      {currentPath === '/company/profile' && renderProfile()}
    </div>
  )
}

export default CompanyDashboard
