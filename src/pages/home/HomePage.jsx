import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const HomePage = () => {
  const { user, userRole } = useAuth();
  
  return (
    <div className="home-page">
      {/* 메인 배너 */}
      <section className="home-banner">
        <div className="container">
          <h1>CNEC 기업 관리 시스템</h1>
          <p>한국 사업자등록정보 인증 시스템을 통해 안전하고 신뢰할 수 있는 기업 관리 플랫폼입니다.</p>
          
          {!user ? (
            <div className="hero-buttons">
              <Link to="/auth/register" className="btn-primary">회원가입</Link>
              <Link to="/auth/login" className="btn-secondary">로그인</Link>
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

      {/* 주요 기능 섹션 */}
      <section className="home-section">
        <div className="container">
          <div className="home-section-title">
            <h2>주요 기능</h2>
            <p>CNEC 기업 관리 시스템의 핵심 기능을 소개합니다.</p>
          </div>
          <div className="home-features">
            <div className="home-feature-card">
              <div className="home-feature-icon">🔍</div>
              <h3>사업자등록정보 인증</h3>
              <p>국세청 API를 통해 사업자등록번호의 유효성을 실시간으로 검증합니다.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">🔒</div>
              <h3>안전한 회원가입</h3>
              <p>인증된 사업자만 가입하여 신뢰할 수 있는 환경을 제공합니다.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">📊</div>
              <h3>기업 관리 대시보드</h3>
              <p>기업 정보를 효율적으로 관리할 수 있는 직관적인 대시보드를 제공합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="home-cta">
        <div className="container">
          <h2>지금 바로 시작하세요</h2>
          <p>CNEC 기업 관리 시스템으로 효율적인 기업 관리를 경험해보세요.</p>
          {!user && (
            <Link to="/auth/register" className="btn-primary">회원가입</Link>
          )}
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section className="home-steps">
        <div className="container">
          <div className="home-section-title">
            <h2>이용 방법</h2>
            <p>간단한 3단계로 CNEC 기업 관리 시스템을 시작하세요.</p>
          </div>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>회원가입</h3>
              <p>사업자등록번호, 개업일자, 대표자명을 입력하여 인증을 진행합니다.</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>정보 등록</h3>
              <p>기업 정보와 담당자 정보를 등록합니다.</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>시스템 이용</h3>
              <p>대시보드를 통해 기업 정보를 관리하고 서비스를 이용합니다.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
