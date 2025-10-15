import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CompanyLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // 회원가입 성공 메시지 표시
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // 메시지 표시 후 location state를 초기화하여 새로고침 시 메시지가 다시 표시되지 않도록 함
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // 기업 사용자 로그인 시도
      const result = await signInWithEmail(email, password, false); // false는 일반 기업 로그인임을 나타냄
      
      if (result.success) {
        // 로그인 성공 시 기업 대시보드로 이동
        navigate('/company');
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      console.error('기업 로그인 오류:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="page-title">기업 회원 로그인</h2>
          
          {successMessage && (
            <div className="success-message mb-4">{successMessage}</div>
          )}
          
          {error && <div className="error-message mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="기업 이메일"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          
          <div className="auth-links mt-4">
            <p>
              아직 계정이 없으신가요? <Link to="/auth/register">회원가입</Link>
            </p>
            <p className="mt-2">
              <Link to="/auth/forgot-password" className="text-sm text-gray-600 hover:underline">
                비밀번호를 잊으셨나요?
              </Link>
            </p>
            <p className="mt-4 text-sm">
              <Link to="/auth/admin-login" className="text-gray-500 hover:underline">
                관리자 로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLoginPage;
