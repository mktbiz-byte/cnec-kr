import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatBusinessNumber } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';

const RegisterPage = () => {
  const [accountInfo, setAccountInfo] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessNumber: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);

  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleAccountInfoChange = (e) => {
    const { name, value } = e.target;
    
    // 사업자등록번호는 형식 변환 적용
    if (name === 'businessNumber') {
      setAccountInfo(prev => ({ ...prev, [name]: formatBusinessNumber(value) }));
    } else {
      setAccountInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!accountInfo.email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (accountInfo.password !== accountInfo.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (accountInfo.password.length < 6) {
      setError('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }

    if (!accountInfo.businessNumber) {
      setError('사업자등록번호를 입력해주세요.');
      return;
    }

    if (!accountInfo.companyName) {
      setError('회사명을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 이 사업자등록번호로 등록된 계정이 있는지 확인
      const { data: existingAccounts } = await supabase
        .from('corporate_accounts')
        .select('id, email, brand_name')
        .eq('business_registration_number', accountInfo.businessNumber.replace(/-/g, ''));
      
      if (existingAccounts && existingAccounts.length > 0) {
        setExistingAccounts(existingAccounts);
      }

      const businessInfo = {
        businessNumber: accountInfo.businessNumber.replace(/-/g, ''),
        companyName: accountInfo.companyName,
        // 최소한의 필수 정보만 포함
        representativeName: '',
        startDate: '',
        phoneNumber: '',
        address: '',
      };

      const result = await signUpWithEmail(
        accountInfo.email,
        accountInfo.password,
        businessInfo
      );

      if (result.success) {
        navigate('/auth/login', { state: { message: result.message } });
      } else {
        setError(result.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
      console.error('회원가입 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="page-title">기업 회원가입</h2>
          <p className="text-gray-600 mb-4">
            세금계산서 발급에 필요한 기본 정보만 입력해주세요.
            추가 정보는 가입 후 마이페이지에서 입력하실 수 있습니다.
          </p>
          
          {existingAccounts.length > 0 && (
            <div className="warning-message my-4">
              <p><strong>알림:</strong> 이 사업자등록번호로 이미 {existingAccounts.length}개의 계정이 등록되어 있습니다.</p>
              <ul className="list-disc pl-5 mt-2">
                {existingAccounts.map((account, index) => (
                  <li key={index}>
                    {account.email} {account.brand_name ? `(${account.brand_name})` : ''}
                  </li>
                ))}
              </ul>
              <p className="mt-2">다른 브랜드로 추가 등록하시려면 계속 진행해주세요.</p>
            </div>
          )}
          
          {error && <div className="error-message mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">이메일 <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="form-control" 
                value={accountInfo.email} 
                onChange={handleAccountInfoChange} 
                placeholder="로그인에 사용할 이메일"
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">비밀번호 <span className="text-red-500">*</span></label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                className="form-control" 
                value={accountInfo.password} 
                onChange={handleAccountInfoChange}
                placeholder="6자리 이상"
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인 <span className="text-red-500">*</span></label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                className="form-control" 
                value={accountInfo.confirmPassword} 
                onChange={handleAccountInfoChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="businessNumber">사업자등록번호 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                id="businessNumber" 
                name="businessNumber" 
                className="form-control" 
                value={accountInfo.businessNumber} 
                onChange={handleAccountInfoChange}
                placeholder="000-00-00000"
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="companyName">회사명 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                id="companyName" 
                name="companyName" 
                className="form-control" 
                value={accountInfo.companyName} 
                onChange={handleAccountInfoChange} 
                required 
              />
            </div>
            
            <button
              type="submit"
              className="btn-primary w-full mt-6"
              disabled={loading}
            >
              {loading ? '가입 처리 중...' : '회원가입'}
            </button>
          </form>
          
          <div className="auth-links mt-4">
            <p>
              이미 계정이 있으신가요? <Link to="/auth/login">로그인</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
