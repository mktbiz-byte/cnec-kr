import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const { verifyBusinessNumber, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [businessInfo, setBusinessInfo] = useState({
    b_no: '',
    start_dt: '',
    p_nm: '',
  });
  const [verificationResult, setVerificationResult] = useState(null);

  const handleBusinessInfoChange = (e) => {
    setBusinessInfo({
      ...businessInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleVerification = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await verifyBusinessNumber(businessInfo);
      setVerificationResult(result);
      if (!result.valid) {
        setError(result.message);
      }
    } catch (error) {
      setError('사업자등록정보 확인 중 오류가 발생했습니다.');
      console.error(error);
    }
    setLoading(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (verificationResult?.valid !== true) {
      setError('유효한 사업자 정보가 아닙니다.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUpWithEmail(email, password, { 
        businessRegistrationNumber: businessInfo.b_no,
        companyName: 'temp-name', // 임시로 하드코딩, 실제로는 입력받아야 함
        representativeName: businessInfo.p_nm,
        phoneNumber: '010-0000-0000', // 임시
        address: 'temp-address' // 임시
      });
      if (error) {
        throw error;
      }
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>회원가입</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <hr />
        <h3>사업자 정보 입력</h3>
        <div>
          <label>사업자등록번호</label>
          <input
            type="text"
            name="b_no"
            value={businessInfo.b_no}
            onChange={handleBusinessInfoChange}
            required
          />
        </div>
        <div>
          <label>개업일자 (YYYYMMDD)</label>
          <input
            type="text"
            name="start_dt"
            value={businessInfo.start_dt}
            onChange={handleBusinessInfoChange}
            required
          />
        </div>
        <div>
          <label>대표자명</label>
          <input
            type="text"
            name="p_nm"
            value={businessInfo.p_nm}
            onChange={handleBusinessInfoChange}
            required
          />
        </div>
        <button type="button" onClick={handleVerification} disabled={loading}>
          {loading ? '확인 중...' : '사업자 정보 확인'}
        </button>
        {verificationResult && (
          <div>
            <p>{verificationResult.message}</p>
          </div>
        )}
        <hr />
        <button type="submit" disabled={loading || verificationResult?.valid !== true}>
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;

