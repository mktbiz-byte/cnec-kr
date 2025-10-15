import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const HomePage = () => {
  const { user, userRole } = useAuth()
  
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>CNEC 기업 관리 시스템</h1>
          <p>한국 사업자등록정보 인증 시스템을 통해 안전하고 신뢰할 수 있는 기업 관리 플랫폼입니다.</p>
          
          {!user ? (
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary">회원가입</Link>
              <Link to="/login" className="btn-secondary">로그인</Link>
            </div>
          ) : (
            <div className="hero-buttons">
              {userRole === 'admin' && (
                <Link to="/admin" className="btn-primary">관리자 대시보드</Link>
              )}
              {userRole === 'company' && (
                <Link to="/company" className="btn-primary">기업 대시보드</Link>
              )}
            </div>
          )}
        </div>
      </section>
      
      <section className="features-section">
        <h2 className="section-title">주요 기능</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <h3>사업자등록정보 인증</h3>
            <p>국세청 API를 통해 사업자등록번호의 유효성을 실시간으로 검증합니다.</p>
          </div>
          
          <div className="feature-card">
            <h3>안전한 회원가입</h3>
            <p>인증된 사업자만 회원가입이 가능하여 신뢰할 수 있는 환경을 제공합니다.</p>
          </div>
          
          <div className="feature-card">
            <h3>기업 관리 대시보드</h3>
            <p>기업 정보를 효율적으로 관리할 수 있는 직관적인 대시보드를 제공합니다.</p>
          </div>
        </div>
      </section>
      
      <section className="cta-section">
        <h2>지금 바로 시작하세요</h2>
        <p>CNEC 기업 관리 시스템으로 효율적인 기업 관리를 경험해보세요.</p>
        
        {!user && (
          <Link to="/register" className="btn-accent">회원가입</Link>
        )}
      </section>
    </div>
  )
}

export default HomePage
