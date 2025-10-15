import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    
    if (!email) {
      setError('이메일을 입력해주세요.');
      setLoading(false);
      return;
    }
    
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.');
      console.error('비밀번호 재설정 오류:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="page-title">비밀번호 찾기</h2>
          <p className="text-gray-600 mb-6">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>
          
          {message && <div className="success-message mb-4">{message}</div>}
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
                placeholder="가입하신 이메일 주소"
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? '처리 중...' : '비밀번호 재설정 링크 받기'}
            </button>
          </form>
          
          <div className="auth-links mt-4">
            <p>
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                로그인 페이지로 돌아가기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
