import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  // 테스트 계정 정보
  const testAccounts = [
    { role: '관리자', email: 'admin@cnecbiz.com', password: 'admin1234' },
    { role: '기업 회원', email: 'company@cnecbiz.com', password: 'company1234' }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 로그인 성공 시 홈으로 이동
      navigate('/');
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestLogin = async (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    
    try {
      setError('');
      setLoading(true);
      
      const { error } = await signIn(testEmail, testPassword);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 로그인 성공 시 홈으로 이동
      navigate('/');
    } catch (err) {
      setError('테스트 계정 로그인에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="page-title">로그인</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              계정이 없으신가요? <Link to="/auth/register">회원가입</Link>
            </p>
          </div>

          <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>테스트 계정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {testAccounts.map((account, index) => (
                <div key={index} style={{ 
                  padding: '15px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>{account.role}</strong>
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                    이메일: {account.email}
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                    비밀번호: {account.password}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', padding: '8px' }}
                    onClick={() => handleTestLogin(account.email, account.password)}
                    disabled={loading}
                  >
                    이 계정으로 로그인
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
