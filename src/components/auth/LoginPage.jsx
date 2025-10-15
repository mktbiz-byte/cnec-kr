import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatBusinessNumber } from '../../utils/formatters';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('company'); // 'company' 또는 'admin'
  const [successMessage, setSuccessMessage] = useState('');
  
  const { signInWithBusinessNumber, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 테스트 계정 정보
  const testAccounts = {
    admin: { username: 'admin', password: 'admin1234' },
    company: { username: '123-45-67890', password: 'company1234' }
  };
  
  useEffect(() => {
    // 회원가입 성공 메시지 표시
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // 메시지 표시 후 location state를 초기화하여 새로고침 시 메시지가 다시 표시되지 않도록 함
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  const handleUsernameChange = (e) => {
    // 기업 관리자 로그인일 경우 사업자등록번호 형식 변환 적용
    if (loginType === 'company') {
      setUsername(formatBusinessNumber(e.target.value));
    } else {
      setUsername(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let result;
      
      if (loginType === 'company') {
        // 기업 관리자 로그인 (사업자등록번호 사용)
        result = await signInWithBusinessNumber(username, password);
      } else {
        // 관리자 로그인 (이메일 대신 아이디 사용)
        result = await signInWithEmail(username, password);
      }
      
      if (result.success) {
        // 로그인 성공 시 적절한 대시보드로 이동
        if (result.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/company');
        }
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
      console.error('로그인 오류:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <div className="login-type-tabs">
            <button 
              className={`login-tab ${loginType === 'company' ? 'active' : ''}`}
              onClick={() => setLoginType('company')}
            >
              기업 회원 로그인
            </button>
            <button 
              className={`login-tab ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => setLoginType('admin')}
            >
              관리자 로그인
            </button>
          </div>
          
          <h2 className="page-title">
            {loginType === 'company' ? '기업 회원 로그인' : '관리자 로그인'}
          </h2>
          
          {successMessage && (
            <div className="success-message mb-4">{successMessage}</div>
          )}
          
          {error && <div className="error-message mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">
                {loginType === 'company' ? '사업자등록번호' : '아이디'}
              </label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={handleUsernameChange}
                placeholder={loginType === 'company' ? '000-00-00000' : '관리자 아이디'}
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
          
          {loginType === 'company' && (
            <div className="auth-links mt-4">
              <p>
                아직 계정이 없으신가요? <Link to="/auth/register">회원가입</Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
