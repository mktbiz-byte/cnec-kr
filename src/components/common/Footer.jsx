import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-logo">
          <Logo type="light" />
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h3>회사 정보</h3>
            <ul>
              <li><Link to="/about">회사 소개</Link></li>
              <li><Link to="/contact">문의하기</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>서비스</h3>
            <ul>
              <li><Link to="/features">주요 기능</Link></li>
              <li><Link to="/faq">자주 묻는 질문</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>이용 안내</h3>
            <ul>
              <li><Link to="/terms">이용약관</Link></li>
              <li><Link to="/privacy">개인정보처리방침</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>계정</h3>
            <ul>
              <li><Link to="/auth/login">로그인</Link></li>
              <li><Link to="/auth/register">회원가입</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} CNEC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
