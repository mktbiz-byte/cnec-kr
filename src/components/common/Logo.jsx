import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 한국식 디자인의 로고 컴포넌트
 * @param {Object} props - 컴포넌트 속성
 * @param {string} props.type - 로고 타입 ('light' 또는 'dark')
 * @param {boolean} props.isAdmin - 관리자 로고 여부
 * @returns {JSX.Element} 로고 컴포넌트
 */
const Logo = ({ type = 'dark', isAdmin = false }) => {
  const textColor = type === 'light' ? 'text-white' : 'text-primary';
  const subTextColor = type === 'light' ? 'text-gray-200' : 'text-gray-600';
  
  return (
    <Link to="/" className="logo-container">
      <div className="logo">
        <div className={`logo-text ${textColor}`}>
          <span className="logo-main">CNEC</span>
          <span className="logo-kr">KR</span>
        </div>
        <div className={`logo-subtext ${subTextColor}`}>
          {isAdmin ? '관리자 시스템' : '기업 인증 시스템'}
        </div>
      </div>
    </Link>
  );
};

export default Logo;
