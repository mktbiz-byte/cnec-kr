import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // 관리자 로그인 시도
      const result = await signInWithEmail(email, password, true); // true는 관리자 로그인임을 나타냄
      
      if (result.success) {
        // 로그인 성공 시 관리자 대시보드로 이동
        navigate('/admin');
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      console.error('관리자 로그인 오류:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="page-title">관리자 로그인</h2>
          
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
                placeholder="관리자 이메일"
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
              <a href="/" className="text-blue-600 hover:underline">
                메인 페이지로 돌아가기
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
