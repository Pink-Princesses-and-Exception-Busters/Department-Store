// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    role?: 'admin' | 'hq' | 'merchant';
    name?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
}

// 레이아웃 프롭스
export interface LayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'hq' | 'merchant';
}

// 보호된 라우트 프롭스
export interface ProtectedRouteProps {
  children: React.ReactNode;
}

// 메뉴 아이템 타입
export interface MenuItem {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
}

// 상품 관련 타입
export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  image_url?: string;
  status?: 'active' | 'inactive' | 'pending';
  created_at?: string;
  updated_at?: string;
}

// 주문 관련 타입
export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

// 통계 데이터 타입
export interface StatisticsData {
  [key: string]: number | string;
}
