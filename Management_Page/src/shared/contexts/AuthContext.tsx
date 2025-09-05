import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Supabase 인증 상태 초기화
  useEffect(() => {
    // 현재 세션 확인
    const getCurrentSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('세션 확인 오류:', error);
        } else if (session) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('세션 확인 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentSession();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변경:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      console.log('로그인 시도:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('로그인 오류:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('로그인 성공:', data.user.email, 'Role:', data.user.user_metadata?.role);
        setUser(data.user);
        return { success: true, data };
      } else {
        return { success: false, error: '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('로그인 처리 중 오류:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('회원가입 처리 중 오류:', error);
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('로그아웃 오류:', error);
        return { success: false, error: error.message };
      }
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
    }
  };

  const isAdmin = () => {
    return user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'hq';
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
