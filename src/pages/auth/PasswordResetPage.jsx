
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PasswordResetPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Supabase가 비밀번호 재설정 시 URL fragment에 access_token을 포함하여 리디렉션합니다.
  // 이 토큰은 세션에 자동으로 설정되므로, 바로 updateUser를 호출할 수 있습니다.
  useEffect(() => {
    const handleRecovery = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('유효하지 않은 접근입니다. 비밀번호 재설정 링크를 다시 확인해주세요.');
      }
    };
    handleRecovery();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      setSuccess('비밀번호가 성공적으로 변경되었습니다. 3초 후 로그인 페이지로 이동합니다.');
      
      // 로그아웃하여 이전 세션을 정리합니다.
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);

    } catch (err) {
      setError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="page-title">새 비밀번호 설정</h2>
          
          {error && <div className="error-message mb-4">{error}</div>}
          {success && <div className="success-message mb-4">{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">새 비밀번호</label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirm-password">비밀번호 확인</label>
                <input
                  type="password"
                  id="confirm-password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;

