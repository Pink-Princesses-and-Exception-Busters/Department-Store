import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Building2, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Shield,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { LayoutProps, MenuItem } from '../../types';

const Layout = ({ children, userRole }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);

  // 더미 브랜드 데이터 설정
  useEffect(() => {
    setBrandName(user?.user_metadata?.name || '본사 관리자');
  }, [user?.user_metadata?.name]);

  // 읽지 않은 알림 개수 가져오기
  useEffect(() => {
    const getUnreadNoticesCount = () => {
      // 실제 구현에서는 API 호출로 대체
      // 현재는 Notice.js와 동일한 샘플 데이터를 기반으로 계산
      const sampleNotices = [
        { id: 1, isRead: false },
        { id: 2, isRead: false },
        { id: 3, isRead: false },
        { id: 5, isRead: false }
      ];
      
      const unreadCount = sampleNotices.filter(notice => !notice.isRead).length;
      setUnreadNoticesCount(unreadCount);
    };

    getUnreadNoticesCount();
    
    // 30초마다 알림 개수 업데이트
    const interval = setInterval(getUnreadNoticesCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Role에 따른 메뉴 항목 정의
  const getMenuItems = () => {
    const commonItems = [
      { path: '/admin', icon: Home, label: '대시보드' },
      { path: '/admin/orders', icon: ShoppingCart, label: '주문 관리' },
      { path: '/admin/settlements', icon: DollarSign, label: '정산 관리(미구현)' },
      { path: '/admin/statistics', icon: BarChart3, label: '통계 분석' },
      { path: '/admin/settings', icon: Settings, label: '시스템 설정(카테고리 설정 외 미구현)' },
    ];

    if (userRole === 'admin' || userRole === 'hq') {
      // HQ 전용 메뉴
      return [
        ...commonItems.slice(0, 1), // 대시보드
        { path: '/admin/tenants', icon: Building2, label: '입점사 관리' },
        { path: '/admin/product-management', icon: Package, label: '상품 관리' },
        { path: '/admin/customer-service', icon: MessageSquare, label: '고객 서비스' },
        ...commonItems.slice(1), // 나머지 공통 메뉴
      ];
    } else {
      // Merchant 전용 메뉴
      return [
        ...commonItems.slice(0, 1), // 대시보드
        { path: '/admin/products', icon: Package, label: '상품 관리' },
        { path: '/admin/customers', icon: Building2, label: '고객 관리' },
        { path: '/admin/customer-service', icon: MessageSquare, label: '고객 서비스' },
        ...commonItems.slice(1), // 나머지 공통 메뉴
      ];
    }
  };

  const menuItems = getMenuItems();

  // Role에 따른 제목 설정
  const getSystemTitle = () => {
    if (userRole === 'admin' || userRole === 'hq') {
      return '본사 관리 시스템';
    } else {
      return '가맹점 관리 시스템';
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      navigate('/admin/login');
    }
  };

  const isAdmin = () => {
    return user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'hq';
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">The Hyundai</h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.5rem' }}>
            {getSystemTitle()}
          </p>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                {item.label}
              </Link>
            );
          })}
          
          {/* 프로필 링크 */}
          <Link
            to="/admin/profile"
            className={`nav-item ${location.pathname === '/admin/profile' ? 'active' : ''}`}
          >
            <User className="nav-icon" />
            프로필
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-title">
            {menuItems.find(item => item.path === location.pathname)?.label || 
             (location.pathname === '/profile' ? '프로필' : 
              location.pathname === '/product-approval' ? '상품 승인' : 
              location.pathname === '/product-management' ? '상품 관리' : '대시보드')}
          </div>
          
          <div className="header-actions">
            <Link to="/admin/notice" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ 
                background: 'transparent', 
                border: 'none',
                position: 'relative',
                cursor: 'pointer'
              }}>
                <Bell size={20} />
                {/* 읽지 않은 알림 개수 표시 */}
                {unreadNoticesCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600'
                  }}>
                    {unreadNoticesCount > 9 ? '9+' : unreadNoticesCount}
                  </span>
                )}
              </button>
            </Link>
            
            {/* 사용자 드롭다운 메뉴 */}
            <div style={{ position: 'relative' }}>
              <button
                className="user-info"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  background: '#f8f9fa',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e9ecef'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#f8f9fa'}
              >
                <User size={20} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {brandName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    {isAdmin() ? '본사' : '입점사'}
                  </span>
                </div>
                <ChevronDown size={16} style={{ 
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} />
              </button>

              {/* 드롭다운 메뉴 */}
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  zIndex: 1000
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {user?.user_metadata?.name || '사용자'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {user?.email}
                    </div>
                  </div>
                  
                  <div style={{ padding: '0.5rem 0' }}>
                    <Link
                      to="/admin/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        color: '#333',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <User size={16} />
                      프로필 관리
                    </Link>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={16} />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
