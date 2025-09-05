import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// 인증이 필요한 라우트를 보호하는 컴포넌트
const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 로딩 중일 때 스피너 표시
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#666' }}>로딩 중...</p>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 관리자 권한이 필요한 페이지인데 관리자가 아닌 경우
  const isAdmin = (): boolean => {
    const role = user?.user_metadata?.role;
    
    // role이 없으면 일반 고객으로 간주
    if (!role) {
      return false;
    }
    
    // admin, hq는 항상 허용
    if (role === 'admin' || role === 'hq') {
      return true;
    }
    
    // merchant인 경우에만 허용 (추후 brand_admins 테이블 검증 가능)
    if (role === 'merchant') {
      return true;
    }
    
    // 기타 모든 경우는 거부
    return false;
  };

  console.log('🔍 권한 검사:', {
    requireAdmin,
    userEmail: user?.email,
    userRole: user?.user_metadata?.role,
    isAdminResult: isAdmin(),
    userMetadata: user?.user_metadata
  });

  if (requireAdmin && !isAdmin()) {
    console.log('❌ 관리자 권한 부족:', {
      requireAdmin,
      isAdminResult: isAdmin(),
      userEmail: user?.email,
      userMetadata: user?.user_metadata
    });
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>접근 권한 없음</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            이 페이지에 접근하려면 관리자 권한이 필요합니다.
          </p>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#999', 
            marginBottom: '1.5rem',
            padding: '0.75rem',
            background: '#f8f9fa',
            borderRadius: '4px'
          }}>
            현재 사용자: {user?.email}<br/>
            권한: {user?.user_metadata?.role || '일반 사용자'}
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => window.history.back()}
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 모든 조건을 만족하면 자식 컴포넌트 렌더링
  return <>{children}</>;
};

export default ProtectedRoute;
