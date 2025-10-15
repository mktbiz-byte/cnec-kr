import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatBusinessNumber, formatStartDate } from '../../utils/formatters';

const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: 사업자번호 확인, 2: 정보 입력
  const [businessInfo, setBusinessInfo] = useState({
    b_no: '', // 사업자등록번호
    start_dt: '', // 개업일자 (YYYYMMDD)
    p_nm: '', // 대표자 성명
  });
  const [accountInfo, setAccountInfo] = useState({
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const { verifyBusinessNumber, signUpWithBusinessNumber } = useAuth();
  const navigate = useNavigate();

  const handleBusinessInfoChange = (e) => {
    const { name, value } = e.target;
    
    // 사업자등록번호와 개업일자는 형식 변환 적용
    if (name === 'b_no') {
      setBusinessInfo(prev => ({ ...prev, [name]: formatBusinessNumber(value) }));
    } else if (name === 'start_dt') {
      setBusinessInfo(prev => ({ ...prev, [name]: formatStartDate(value) }));
    } else {
      setBusinessInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAccountInfoChange = (e) => {
    const { name, value } = e.target;
    setAccountInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setVerificationResult(null);

    if (!businessInfo.b_no || !businessInfo.start_dt || !businessInfo.p_nm) {
      setError('사업자등록번호, 개업일자, 대표자 성명을 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyBusinessNumber(businessInfo);
      setVerificationResult(result);
      if (result.valid) {
        setStep(2); // 확인 성공 시 다음 단계로
      } else {
        setError(result.message || '사업자등록정보가 일치하지 않습니다.');
      }
    } catch (err) {
      setError('사업자등록정보 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (accountInfo.password !== accountInfo.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (accountInfo.password.length < 6) {
        setError('비밀번호는 6자리 이상이어야 합니다.');
        return;
    }

    setLoading(true);

    const fullBusinessInfo = {
      businessNumber: businessInfo.b_no.replace(/-/g, ''),
      representativeName: businessInfo.p_nm,
      startDate: businessInfo.start_dt,
      companyName: accountInfo.companyName,
      phoneNumber: accountInfo.phoneNumber,
      address: accountInfo.address,
    };

    try {
      const result = await signUpWithBusinessNumber(
        fullBusinessInfo.businessNumber,
        accountInfo.password,
        fullBusinessInfo
      );

      if (result.success) {
        navigate('/auth/login', { state: { message: result.message } });
      } else {
        setError(result.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <div className="auth-card">
        <div className="step-indicator">
            <div className="step active">1. 사업자 정보 확인</div>
            <div className="step">2. 계정 정보 입력</div>
        </div>
        <h2 className="page-title">기업 회원가입</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleVerification} className="mt-4">
            <div className="form-group">
                <label htmlFor="b_no">사업자등록번호</label>
                <input
                    type="text"
                    id="b_no"
                    name="b_no"
                    className="form-control"
                    placeholder="000-00-00000"
                    value={businessInfo.b_no}
                    onChange={handleBusinessInfoChange}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="start_dt">개업일자</label>
                <input
                    type="text"
                    id="start_dt"
                    name="start_dt"
                    className="form-control"
                    placeholder="YYYY-MM-DD"
                    value={businessInfo.start_dt}
                    onChange={handleBusinessInfoChange}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="p_nm">대표자 성명</label>
                <input
                    type="text"
                    id="p_nm"
                    name="p_nm"
                    className="form-control"
                    placeholder="홍길동"
                    value={businessInfo.p_nm}
                    onChange={handleBusinessInfoChange}
                    required
                />
            </div>
            <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
                {loading ? '확인 중...' : '사업자 정보 확인'}
            </button>
        </form>
        <div className="auth-links mt-4">
            <p>이미 계정이 있으신가요? <Link to="/auth/login">로그인</Link></p>
        </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="auth-card">
        <div className="step-indicator">
            <div className="step completed">1. 사업자 정보 확인</div>
            <div className="step active">2. 계정 정보 입력</div>
        </div>
        <h2 className="page-title">계정 정보 입력</h2>
        <div className="verification-success my-4">
            <p><strong>사업자등록번호:</strong> {businessInfo.b_no}</p>
            <p className="text-green-600">{verificationResult?.message}</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="companyName">회사명</label>
                <input type="text" id="companyName" name="companyName" className="form-control" value={accountInfo.companyName} onChange={handleAccountInfoChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="password">비밀번호 (6자리 이상)</label>
                <input type="password" id="password" name="password" className="form-control" value={accountInfo.password} onChange={handleAccountInfoChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="confirmPassword">비밀번호 확인</label>
                <input type="password" id="confirmPassword" name="confirmPassword" className="form-control" value={accountInfo.confirmPassword} onChange={handleAccountInfoChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="phoneNumber">연락처</label>
                <input type="text" id="phoneNumber" name="phoneNumber" className="form-control" value={accountInfo.phoneNumber} onChange={handleAccountInfoChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="address">주소</label>
                <input type="text" id="address" name="address" className="form-control" value={accountInfo.address} onChange={handleAccountInfoChange} required />
            </div>
            <div className="form-actions mt-4">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary" disabled={loading}>이전</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? '가입 처리 중...' : '회원가입 완료'}
                </button>
            </div>
        </form>
    </div>
  );

  return (
    <div className="auth-layout">
        <div className="auth-container">
            {step === 1 ? renderStepOne() : renderStepTwo()}
        </div>
    </div>
  );
};

export default RegisterPage;

