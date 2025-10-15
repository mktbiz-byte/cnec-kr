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
      setUser(session?.user ?? null);
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
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

  // 회원가입
  async function signUpWithBusinessNumber(businessNumber, password, businessInfo) {
    try {
      const { data: existing } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('business_registration_number', businessNumber)
        .single();

      if (existing) {
        return { success: false, message: '이미 등록된 사업자등록번호입니다.' };
      }

      const email = `${businessNumber}@cnecbiz.com`;
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;

      const { error: profileError } = await supabase.from('corporate_accounts').insert([{
        auth_user_id: data.user.id,
        business_registration_number: businessNumber,
        company_name: businessInfo.companyName,
        representative_name: businessInfo.representativeName,
        start_date: businessInfo.startDate,
        phone_number: businessInfo.phoneNumber,
        address: businessInfo.address,
        is_approved: false,
        is_admin: false,
      }]);

      if (profileError) throw profileError;

      return { success: true, message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.' };
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { success: false, message: error.message || '회원가입 중 오류가 발생했습니다.' };
    }
  }

  // 사업자등록번호로 로그인
  async function signInWithBusinessNumber(businessNumber, password) {
    try {
      const formattedBusinessNumber = businessNumber.replace(/-/g, '');
      const email = `${formattedBusinessNumber}@cnecbiz.com`;

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, message: '사업자등록번호 또는 비밀번호가 올바르지 않습니다.' };
      }

      const role = await fetchUserRole(data.user.id);

      if (role === 'pending_approval') {
        await supabase.auth.signOut();
        return { success: false, message: '관리자 승인 대기 중입니다.' };
      }

      if (role === 'company' || role === 'admin') {
        return { success: true, user: data.user, role };
      } else {
        await supabase.auth.signOut();
        return { success: false, message: '로그인 권한이 없습니다.' };
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  }

  // 관리자 아이디로 로그인
  async function signInWithEmail(username, password) {
    try {
        // 관리자용 아이디를 특정 이메일 주소로 매핑
        const email = username;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
        }

        const role = await fetchUserRole(data.user.id);

        if (role === 'admin') {
            return { success: true, user: data.user, role };
        } else {
            await supabase.auth.signOut();
            return { success: false, message: '관리자 계정이 아닙니다.' };
        }
    } catch (error) {
        console.error('관리자 로그인 오류:', error);
        return { success: false, message: '로그인 중 오류가 발생했습니다.' };
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

  const value = {
    user,
    userRole,
    loading,
    verifyBusinessNumber,
    signUpWithBusinessNumber,
    signInWithBusinessNumber,
    signInWithEmail,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
