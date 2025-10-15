import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'admin' 또는 'company'

  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from('corporate_accounts')
      .select('is_admin, is_approved')
      .eq('auth_user_id', userId)
      .single();
    
    if (error) {
      console.error('사용자 역할 조회 오류:', error);
      return null;
    }

    if (!data.is_approved) {
      return 'pending_approval';
    }

    return data.is_admin ? 'admin' : 'company';
  };

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setUser(session?.user ?? null);
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        console.log('User role:', role);
        if (role && role !== 'pending_approval') {
          setUserRole(role);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 이메일 기반 로그인 (관리자 또는 기업 사용자)
  async function signInWithEmail(email, password, isAdmin = false) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      }

      const role = await fetchUserRole(data.user.id);

      // 관리자 로그인 시도인데 관리자가 아닌 경우
      if (isAdmin && role !== 'admin') {
        await supabase.auth.signOut();
        return { success: false, message: '관리자 계정이 아닙니다.' };
      }

      // 기업 사용자 로그인 시도인데 기업 사용자가 아닌 경우
      if (!isAdmin && role !== 'company') {
        await supabase.auth.signOut();
        return { success: false, message: '기업 계정이 아닙니다.' };
      }

      // 승인 대기 중인 계정
      if (role === 'pending_approval') {
        await supabase.auth.signOut();
        return { success: false, message: '관리자 승인 대기 중입니다.' };
      }

      return { success: true, user: data.user, role };
    } catch (error) {
      console.error('로그인 오류:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  }

  // 사업자등록번호 진위확인 API
  async function verifyBusinessNumber({ b_no, start_dt, p_nm }) {
    try {
      const response = await fetch('/.netlify/functions/verify-business-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ b_no, start_dt, p_nm }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'API 요청 실패');

      if (data.data?.[0]?.valid === '01') {
        return { valid: true, message: '사업자등록번호가 확인되었습니다.' };
      } else {
        return { valid: false, message: data.data?.[0]?.valid_msg || '유효하지 않은 사업자등록번호입니다.' };
      }
    } catch (error) {
      console.error('사업자등록번호 확인 오류:', error);
      return { valid: false, message: '사업자등록정보 확인 중 오류가 발생했습니다.' };
    }
  }

  // 이메일 기반 회원가입
  async function signUpWithEmail(email, password, businessInfo) {
    try {
      // 이메일 중복 확인
      const { data: existingEmail } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        return { success: false, message: '이미 등록된 이메일입니다.' };
      }

      // 사업자등록번호 중복 확인 (unique 제약은 없지만 같은 사업자번호로 여러 계정을 만들 때 확인 필요)
      const { data: existingBusinesses } = await supabase
        .from('corporate_accounts')
        .select('id, email')
        .eq('business_registration_number', businessInfo.businessNumber);

      // 회원가입 진행
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;

      const { error: profileError } = await supabase.from('corporate_accounts').insert([{
        auth_user_id: data.user.id,
        email: email,
        business_registration_number: businessInfo.businessNumber,
        company_name: businessInfo.companyName,
        representative_name: businessInfo.representativeName,
        start_date: businessInfo.startDate,
        phone_number: businessInfo.phoneNumber,
        address: businessInfo.address,
        brand_name: businessInfo.brandName || businessInfo.companyName, // 브랜드명이 없으면 회사명 사용
        is_approved: false,
        is_admin: false,
      }]);

      if (profileError) throw profileError;

      return { 
        success: true, 
        message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.',
        existingAccounts: existingBusinesses 
      };
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { success: false, message: error.message || '회원가입 중 오류가 발생했습니다.' };
    }
  }

  // 로그아웃
  async function signOut() {
    await supabase.auth.signOut();
    // 상태를 초기화하고 페이지를 새로고침하여 모든 관련 상태를 확실히 초기화합니다.
    setUser(null);
    setUserRole(null);
    window.location.href = '/auth/login'; // 로그인 페이지로 리디렉션
  }

  // 비밀번호 재설정 이메일 발송
  async function resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/password-reset`,
      });
      
      if (error) throw error;
      
      return { success: true, message: '비밀번호 재설정 이메일이 발송되었습니다.' };
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      return { success: false, message: '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.' };
    }
  }

  // 비밀번호 변경
  async function updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' };
    }
  }

  const value = {
    user,
    userRole,
    loading,
    verifyBusinessNumber,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
