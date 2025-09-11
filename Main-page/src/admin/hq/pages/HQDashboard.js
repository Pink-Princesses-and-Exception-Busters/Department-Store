import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Package, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  DollarSign,
  CheckCircle,
  Users,
  RefreshCw,
  Loader
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { supabase } from '../../shared/lib/supabase';

const HQDashboard = () => {
  const navigate = useNavigate();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // 실시간 통계 데이터
  const [dashboardStats, setDashboardStats] = useState({
    totalTenants: 0,
    hiddenProducts: 0,
    monthlyRevenue: 0,
    todayOrders: 0,
    yesterdayOrders: 0
  });
  
  const [recentProducts, setRecentProducts] = useState([]);
  const [topBrands, setTopBrands] = useState([]);

  // 데이터 로드
  useEffect(() => {
    loadDashboardData();
  }, []);

  // 대시보드 데이터 로드
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 병렬로 모든 데이터 조회
      const [statsResult, productsResult, brandsResult] = await Promise.all([
        getDashboardStats(),
        getRecentProducts(),
        getTopBrands()
      ]);

      setDashboardStats(statsResult);
      setRecentProducts(productsResult);
      setTopBrands(brandsResult);

      console.log('HQ 대시보드 데이터 로드 완료');
    } catch (err) {
      console.error('대시보드 데이터 로드 오류:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // 통계 데이터 조회
  const getDashboardStats = async () => {
    const { data, error } = await supabase.rpc('get_hq_dashboard_stats');
    
    if (error) {
      // RPC가 없으면 개별 쿼리로 대체
      const [tenantsData, productsData, ordersData, revenueData] = await Promise.all([
        supabase.from('brand_admins').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('products').select('id', { count: 'exact' }).eq('status', 'hidden'),
        supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('orders').select('total_amount').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      const yesterdayOrders = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0])
        .lt('created_at', new Date().toISOString().split('T')[0]);

      const totalRevenue = revenueData.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      return {
        totalTenants: tenantsData.count || 0,
        hiddenProducts: productsData.count || 0,
        monthlyRevenue: totalRevenue,
        todayOrders: ordersData.count || 0,
        yesterdayOrders: yesterdayOrders.count || 0
      };
    }
    
    return data;
  };

  // 최근 상품 조회
  const getRecentProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        status,
        created_at,
        categories (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return data?.map(product => ({
      id: `PRD-${String(product.id).padStart(3, '0')}`,
      tenant: product.brand,
      product: product.name,
      category: product.categories?.name || '기타',
      status: getStatusText(product.status),
      submittedAt: new Date(product.created_at).toLocaleDateString('ko-KR')
    })) || [];
  };

  // 상위 브랜드 조회
  const getTopBrands = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('items');

    if (error) throw error;

    // 브랜드별 매출 계산
    const brandRevenue = {};
    data?.forEach(order => {
      order.items?.forEach(item => {
        const brand = item.brand;
        const revenue = item.price * item.quantity;
        brandRevenue[brand] = (brandRevenue[brand] || 0) + revenue;
      });
    });

    // 상위 5개 브랜드 정렬
    const sortedBrands = Object.entries(brandRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([brand, revenue]) => ({
        name: brand,
        category: getCategoryForBrand(brand),
        revenue: `₩${(revenue / 10000).toFixed(1)}만`,
        growth: '+0%' // 성장률은 별도 계산 필요
      }));

    return sortedBrands;
  };

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    const statusMap = {
      'forsale': '판매중',
      'soldout': '품절',
      'hidden': '승인대기'
    };
    return statusMap[status] || '알 수 없음';
  };

  // 브랜드별 카테고리 추정
  const getCategoryForBrand = (brand) => {
    const categoryMap = {
      'Apple': '전자제품',
      'Samsung': '전자제품',
      'Chanel': '뷰티',
      'Dior': '뷰티',
      'Calvin Klein': '패션',
      'Gucci': '패션'
    };
    return categoryMap[brand] || '기타';
  };

  // 백화점 본사 통계 데이터 (실시간 데이터)
  const stats = [
    {
      title: '총 입점사',
      value: dashboardStats.totalTenants.toString(),
      icon: Building2,
      color: '#007bff',
      change: '+0개'
    },
    {
      title: '승인 대기 상품',
      value: dashboardStats.hiddenProducts.toString(),
      icon: Package,
      color: '#ffc107',
      change: '+0개'
    },
    {
      title: '이번 달 매출',
      value: `₩${(dashboardStats.monthlyRevenue / 10000).toFixed(1)}만`,
      icon: DollarSign,
      color: '#28a745',
      change: '+0%'
    },
    {
      title: '오늘 주문',
      value: dashboardStats.todayOrders.toString(),
      icon: MessageSquare,
      color: '#dc3545',
      change: dashboardStats.todayOrders > dashboardStats.yesterdayOrders ? 
        `+${dashboardStats.todayOrders - dashboardStats.yesterdayOrders}개` : 
        `${dashboardStats.todayOrders - dashboardStats.yesterdayOrders}개`
    }
  ];


  const getStatusBadge = (status) => {
    const statusMap = {
      '판매중': 'badge-success',
      '품절': 'badge-warning',
      '승인대기': 'badge-info'
    };
    return statusMap[status] || 'badge-info';
  };

  const handleViewApproval = (approval) => {
    setSelectedOrder(approval);
    setShowOrderModal(true);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'tenants':
        navigate('/admin/tenants');
        break;
      case 'product-approval':
        navigate('/admin/product-management');
        break;
      case 'customer-service':
        navigate('/admin/customer-service');
        break;
      case 'statistics':
        navigate('/admin/statistics');
        break;
      default:
        break;
    }
  };

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={32} className="animate-spin" />
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          대시보드 데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>본사 관리자 대시보드</h1>
          <p style={{ color: '#666', margin: 0 }}>
            실시간 입점사 및 매출 현황을 확인하세요
          </p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div style={{ 
          padding: '1rem', 
          margin: '1rem 0', 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px',
          color: '#c33'
        }}>
          <strong>오류:</strong> {error}
          <button 
            onClick={loadDashboardData}
            style={{ 
              marginLeft: '1rem', 
              padding: '0.25rem 0.5rem', 
              background: '#c33', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div 
                className="stat-icon" 
                style={{ backgroundColor: stat.color }}
              >
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <small style={{ color: '#28a745', fontSize: '0.75rem' }}>
                  <TrendingUp size={12} style={{ marginRight: '4px' }} />
                  {stat.change}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* 최근 상품 승인 현황 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">최근 상품 승인 현황</h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin/product-management')}
            >
              <ArrowRight size={16} />
              전체보기
            </button>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>상품코드</th>
                  <th>입점사</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <p>최근 등록된 상품이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewApproval(product)}
                    >
                      <td style={{ fontWeight: '600', color: '#007bff' }}>{product.id}</td>
                      <td>{product.tenant}</td>
                      <td>{product.product}</td>
                      <td>{product.category}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP 입점사 매출 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">TOP 입점사 매출</h2>
          </div>
          
          <div>
            {topBrands.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#666' 
              }}>
                <Building2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>매출 데이터가 없습니다.</p>
              </div>
            ) : (
              topBrands.map((brand, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: index < topBrands.length - 1 ? '1px solid #eee' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {brand.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {brand.category}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#28a745' }}>
                      {brand.revenue}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#28a745' }}>
                      {brand.growth}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">빠른 작업</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => handleQuickAction('tenants')}
          >
            <Building2 size={16} />
            입점사 관리
          </button>
          <button 
            className="btn btn-success"
            onClick={() => handleQuickAction('product-approval')}
          >
            <Package size={16} />
            상품 승인
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => handleQuickAction('customer-service')}
          >
            <MessageSquare size={16} />
            고객 서비스
          </button>
          <button 
            className="btn" 
            style={{ background: '#6f42c1', color: 'white' }}
            onClick={() => handleQuickAction('statistics')}
          >
            <TrendingUp size={16} />
            통계 분석
          </button>
        </div>
      </div>

      {/* 상품 승인 상세 모달 */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="상품 승인 상세 정보"
        size="medium"
      >
        {selectedOrder && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  상품코드
                </label>
                <p style={{ margin: 0, color: '#007bff', fontWeight: '600' }}>
                  {selectedOrder.id}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  승인상태
                </label>
                <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                입점사명
              </label>
              <p style={{ margin: 0 }}>{selectedOrder.tenant}</p>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                상품명
              </label>
              <p style={{ margin: 0 }}>{selectedOrder.product}</p>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                카테고리
              </label>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '1.125rem' }}>
                {selectedOrder.category}
              </p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                신청일
              </label>
              <p style={{ margin: 0 }}>{selectedOrder.submittedAt}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowOrderModal(false);
                  navigate('/admin/product-management');
                }}
              >
                상품 관리로 이동
              </button>
              <button 
                className="btn" 
                style={{ background: '#6c757d', color: 'white' }}
                onClick={() => setShowOrderModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HQDashboard;
