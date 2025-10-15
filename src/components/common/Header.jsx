import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from './Logo';

const Header = ({ minimal = false, isAdmin = false, isCompany = false }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 오류:', error.message);
    }
  };

  return (
    <header className="header">
      <div className="container header-container">
        <Logo type="dark" isAdmin={isAdmin} />

        {!minimal && (
          <nav className="main-nav">
            <ul>
              <li>
                <Link to="/">홈</Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin">관리자 대시보드</Link>
                </li>
              )}
              {isCompany && (
                <li>
                  <Link to="/company">기업 대시보드</Link>
                </li>
              )}
              {!isAdmin && !isCompany && (
                <>
                  <li>
                    <a href="#features">주요 기능</a>
                  </li>
                  <li>
                    <a href="#about">회사 소개</a>
                  </li>
                  <li>
                    <a href="#contact">문의하기</a>
                  </li>
                </>
              )}
            </ul>
          </nav>
        )}

        <div className="auth-nav">
          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.email}</span>
              {!isAdmin && !isCompany && (
                <>
                  {user.user_metadata?.role === 'admin' && (
                    <Link to="/admin" className="btn-primary">관리자</Link>
                  )}
                  {user.user_metadata?.role === 'company' && (
                    <Link to="/company" className="btn-primary">기업 관리</Link>
                  )}
                </>
              )}
              <button onClick={handleLogout} className="btn-logout">
                로그아웃
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth/login" className="btn-login">
                로그인
              </Link>
              <Link to="/auth/register" className="btn-register">
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
