import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 컨텍스트 제공자 컴포넌트
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [corporateAccount, setCorporateAccount] = useState(null);

  // 초기 로드 시 현재 세션 확인
  useEffect(() => {
    async function getInitialSession() {
      setLoading(true);
      
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // 기업 계정 정보 가져오기
        const { data: corporateData } = await supabase
          .from('corporate_accounts')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();
          
        if (corporateData) {
          setCorporateAccount(corporateData);
        }
      }
      
      setLoading(false);
    }
    
    getInitialSession();
    
    // 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          // 기업 계정 정보 가져오기
          const { data: corporateData } = await supabase
            .from('corporate_accounts')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();
            
          if (corporateData) {
            setCorporateAccount(corporateData);
          }
        } else {
          setUser(null);
          setCorporateAccount(null);
        }
        
        setLoading(false);
      }
    );
    
    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 사업자번호 검증
  async function verifyBusinessNumber(businessInfo) { // { b_no, start_dt, p_nm }
    try {
      // 사업자번호, 개업일자, 대표자명 필수 체크
      if (!businessInfo.b_no || !businessInfo.start_dt || !businessInfo.p_nm) {
        return {
          valid: false,
          message: '사업자등록번호, 개업일자, 대표자명은 필수입니다.'
        };
      }
      
      // 숫자만 추출
      const cleanedNumber = businessInfo.b_no.replace(/-/g, '');
      
      // 중복 확인
      const { data: existingBusiness, error: checkError } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('business_registration_number', cleanedNumber)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingBusiness) {
        return {
          valid: false,
          message: '이미 등록된 사업자번호입니다.'
        };
      }
      
      // Supabase Edge Function을 통한 국세청 API 검증
      const { data: result, error: functionError } = await supabase.functions.invoke('verify-business-number', {
        body: { ...businessInfo, b_no: cleanedNumber },
      });

      if (functionError) throw functionError;
      
      const verificationData = result.data[0];
      const isValid = verificationData.valid === '01';
      const message = verificationData.valid_msg;

      // 검증 결과 저장 (성공 여부와 관계없이)
      await supabase
        .from('business_registration_verifications')
        .insert([
          {
            business_registration_number: cleanedNumber,
            verification_result: isValid ? 'success' : 'failure',
            verification_method: 'api',
            verification_message: message,
            verification_data: verificationData || {}
          }
        ]);
      
      return { valid: isValid, message, data: verificationData };
    } catch (error) {
      console.error('사업자번호 검증 오류:', error);
      return {
        valid: false,
        message: error.message || '사업자번호 검증 중 오류가 발생했습니다.'
      };
    }
  }

  // 이메일로 회원가입
  async function signUpWithEmail(email, password, businessData) {
    try {
      // 사업자번호 검증
      if (!businessData.businessRegistrationNumber) {
        return { success: false, message: '사업자번호는 필수입니다.' };
      }
      
      // 숫자만 추출
      const cleanedNumber = businessData.businessRegistrationNumber.replace(/-/g, '');
      
      // 이메일로 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // 기업 계정 정보 저장
        const { error: profileError } = await supabase
          .from('corporate_accounts')
          .insert([
            {
              auth_user_id: authData.user.id,
              email,
              company_name: businessData.companyName,
              representative_name: businessData.representativeName,
              business_registration_number: cleanedNumber,
              phone_number: businessData.phoneNumber,
              address: businessData.address,
              is_approved: false, // 관리자 승인 필요
            }
          ]);
          
        if (profileError) throw profileError;
        
        return { success: true, user: authData.user };
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { success: false, message: error.message || '회원가입 중 오류가 발생했습니다.' };
    }
  }

  // 이메일로 로그인
  async function signInWithEmail(email, password) {
    try {
      // 테스트 계정 처리
      if (email === 'admin@cnecbiz.com' && password === 'admin1234') {
        // 관리자 테스트 계정
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'admin1234'
        });
        
        if (error) {
          // 계정이 없으면 생성
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: 'admin1234'
          });
          
          if (signUpError) throw signUpError;
          
          // 관리자 계정 정보 생성
          await supabase.from('corporate_accounts').insert([
            {
              auth_user_id: signUpData.user.id,
              email,
              company_name: 'CNEC 관리자',
              representative_name: '관리자',
              business_registration_number: '0000000000',
              is_approved: true,
              is_admin: true
            }
          ]);
          
          return { success: true, user: signUpData.user, isTestAccount: true };
        }
        
        return { success: true, user: data.user, isTestAccount: true };
      } 
      else if (email === 'company@cnecbiz.com' && password === 'company1234') {
        // 기업 테스트 계정
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'company1234'
        });
        
        if (error) {
          // 계정이 없으면 생성
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: 'company1234'
          });
          
          if (signUpError) throw signUpError;
          
          // 기업 계정 정보 생성
          await supabase.from('corporate_accounts').insert([
            {
              auth_user_id: signUpData.user.id,
              email,
              company_name: '하우파파',
              representative_name: '박현용',
              business_registration_number: '5758102253',
              phone_number: '02-1234-5678',
              address: '서울특별시 강남구',
              is_approved: true
            }
          ]);
          
          return { success: true, user: signUpData.user, isTestAccount: true };
        }
        
        return { success: true, user: data.user, isTestAccount: true };
      }
      else {
        // 일반 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
      
      // 테스트 계정이 아닌 경우에만 기업 계정 정보 확인
      const { data: corporateData, error: profileError } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();
        
      if (profileError) {
        // 기업 계정 정보가 없는 경우
        await supabase.auth.signOut();
        throw new Error('기업 계정 정보를 찾을 수 없습니다.');
      }
      
      // 승인 상태 확인
      if (!corporateData.is_approved) {
        // 미승인 계정인 경우 로그아웃
        await supabase.auth.signOut();
        throw new Error('아직 관리자 승인이 완료되지 않았습니다. 승인 후 로그인이 가능합니다.');
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('로그인 오류:', error);
      return { success: false, message: error.message || '로그인 중 오류가 발생했습니다.' };
    }
  }

  // 로그아웃
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('로그아웃 오류:', error);
      return { success: false, message: error.message || '로그아웃 중 오류가 발생했습니다.' };
    }
  }

  // 비밀번호 재설정 이메일 전송
  async function resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      return { success: false, message: error.message || '비밀번호 재설정 중 오류가 발생했습니다.' };
    }
  }

  // 사용자 역할 확인
  function hasRole(role) {
    if (!user) return false;
    
    // 관리자 역할 확인
    if (role === 'admin') {
      return corporateAccount?.is_admin === true;
    }
    
    // 매출 관리자 역할 확인
    if (role === 'sales_manager') {
      return corporateAccount?.is_sales_manager === true;
    }
    
    // 기업 사용자 역할 확인
    if (role === 'corporate_user') {
      return corporateAccount !== null;
    }
    
    return false;
  }

  // 컨텍스트 값
  const value = {
    user,
    corporateAccount,
    loading,
    verifyBusinessNumber,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    resetPassword,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 인증 컨텍스트 사용 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

