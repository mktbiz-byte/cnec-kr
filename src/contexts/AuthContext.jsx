import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { database } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          setUser(null);
        } else {
          console.log("Session loaded:", session?.user?.email);
          setUser(session?.user ?? null);
          
          // 사용자 프로필 로드
          if (session?.user) {
            loadUserProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error("Error in getSession catch:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        // 사용자 프로필 확인/생성 (비동기로 처리하여 로딩 차단 방지)
        setTimeout(async () => {
          try {
            await loadUserProfile(session.user.id);
            
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // 프로필이 없으면 생성
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.email,
                });
              
              if (insertError) {
                console.error("Error creating profile:", insertError);
              } else {
                console.log("Profile created successfully");
                // 새로 생성된 프로필 로드
                loadUserProfile(session.user.id);
              }
            }
          } catch (error) {
            console.error("Error handling user profile:", error);
          }
        }, 0);
        
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        // 로그아웃 시 모든 쿠키 정리
        clearAllCookies();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
        setUser(session?.user ?? null);
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 사용자 프로필 로드 함수
  const loadUserProfile = async (userId) => {
    try {
      const profile = await database.userProfiles.get(userId);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  };

  // 프로필 업데이트 함수
  const updateProfile = async (profileData) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const updatedProfile = await database.userProfiles.update(user.id, profileData);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // 모든 쿠키 정리 함수
  const clearAllCookies = () => {
    try {
      // 현재 도메인의 모든 쿠키 삭제
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          // 현재 도메인과 경로에서 삭제
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          // 상위 도메인에서도 삭제 시도
          const domain = window.location.hostname.split('.').slice(-2).join('.');
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
        }
      });
      
      // localStorage와 sessionStorage도 정리
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("All cookies and storage cleared");
    } catch (error) {
      console.error("Error clearing cookies:", error);
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Email sign in error:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });
      
      if (error) {
        console.error("Email sign up error:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error("Google sign in error:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // 먼저 쿠키와 스토리지 정리
      clearAllCookies();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
      setUser(null);
      setUserProfile(null);
      
      // 로그아웃 후 페이지 새로고침으로 완전한 상태 초기화
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error("Sign out error:", error);
      // 오류가 발생해도 쿠키는 정리
      clearAllCookies();
      setUser(null);
      setUserProfile(null);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
    loadUserProfile
  };

  // 로딩 상태와 관계없이 children을 렌더링
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
