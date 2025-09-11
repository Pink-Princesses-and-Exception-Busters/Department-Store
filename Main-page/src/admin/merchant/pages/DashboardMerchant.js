import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  Eye,
  RefreshCw
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { 
  getMerchantDashboardStats, 
  getMerchantRecentOrders, 
  getMerchantTopProducts,
  getCurrentMerchantBrand,
  formatCurrency,
  formatNumber
} from '../../../services/dashboardService';

const DashboardMerchant = () => {
  const navigate = useNavigate();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 데이터베이스에서 가져온 실제 데이터
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [merchantBrand, setMerchantBrand] = useState(null);

  // 통계 카드 구성
  const stats = dashboardStats ? [
    {
      title: '오늘 주문',
      value: formatNumber(dashboardStats.todayOrders),
      icon: ShoppingCart,
      color: '#007bff',
      change: dashboardStats.todayOrdersChange
    },
    {
      title: '총 상품',
      value: formatNumber(dashboardStats.totalProducts),
      icon: Package,
      color: '#28a745',
      change: dashboardStats.totalProductsChange
    },
    {
      title: '총 고객',
      value: formatNumber(dashboardStats.totalCustomers),
      icon: Users,
      color: '#ffc107',
      change: dashboardStats.totalCustomersChange
    },
    {
      title: '오늘 매출',
      value: formatCurrency(dashboardStats.todayRevenue),
      icon: DollarSign,
      color: '#dc3545',
      change: dashboardStats.todayRevenueChange
    }
  ] : [];

  // 데이터 로드 함수
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. 현재 브랜드 정보 가져오기
      const brand = await getCurrentMerchantBrand();
      if (!brand) {
        console.error('브랜드 정보를 가져올 수 없습니다.');
        return;
      }
      setMerchantBrand(brand);

      // 2. 병렬로 모든 데이터 가져오기
      const [statsData, ordersData, productsData] = await Promise.all([
        getMerchantDashboardStats(brand),
        getMerchantRecentOrders(brand, 5),
        getMerchantTopProducts(brand, 5)
      ]);

      setDashboardStats(statsData);
      setRecentOrders(ordersData);
      setTopProducts(productsData);

      console.log('대시보드 데이터 로드 완료:', {
        brand,
        stats: statsData,
        orders: ordersData.length,
        products: productsData.length
      });

    } catch (error) {
      console.error('대시보드 데이터 로드 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 새로고침 함수
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      '주문접수': 'badge-info',
      '결제완료': 'badge-success',
      '상품준비': 'badge-warning',
      '배송중': 'badge-warning',
      '배송완료': 'badge-success',
      '주문취소': 'badge-danger',
      '반품신청': 'badge-secondary',
      '반품완료': 'badge-secondary'
    };
    return statusMap[status] || 'badge-info';
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'products':
        navigate('/admin/products');
        break;
      case 'orders':
        navigate('/admin/orders');
        break;
      case 'customers':
        navigate('/admin/customers');
        break;
      case 'statistics':
        navigate('/admin/statistics');
        break;
      default:
        break;
    }
  };

  // 로딩 중일 때 표시할 컴포넌트
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
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          {merchantBrand ? `${merchantBrand} 대시보드 데이터를 불러오는 중...` : '대시보드 데이터를 불러오는 중...'}
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
          <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>대시보드</h1>
          {merchantBrand && (
            <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>
              {merchantBrand} 브랜드 관리
            </p>
          )}
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          {refreshing ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositiveChange = stat.change.startsWith('+');
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
                <small style={{ 
                  color: isPositiveChange ? '#28a745' : '#dc3545', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  <TrendingUp size={12} />
                  {stat.change}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* 최근 주문 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">최근 주문</h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin/orders')}
            >
              <Eye size={16} />
              전체보기
            </button>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>고객명</th>
                  <th>상품명</th>
                  <th>금액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewOrder(order)}
                    >
                      <td style={{ fontWeight: '600', color: '#007bff' }}>
                        #{order.id.slice(-8)}
                      </td>
                      <td>{order.customer_name}</td>
                      <td>{order.product_name}</td>
                      <td style={{ fontWeight: '600' }}>
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      최근 주문이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 인기 상품 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">인기 상품</h2>
          </div>
          
          <div>
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: index < topProducts.length - 1 ? '1px solid #eee' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      판매: {formatNumber(product.sales)}개
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#28a745' }}>
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#666' 
              }}>
                인기 상품 데이터가 없습니다.
              </div>
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
            onClick={() => handleQuickAction('products')}
          >
            <Package size={16} />
            새 상품 등록
          </button>
          <button 
            className="btn btn-success"
            onClick={() => handleQuickAction('orders')}
          >
            <ShoppingCart size={16} />
            주문 처리
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => handleQuickAction('customers')}
          >
            <Users size={16} />
            고객 관리
          </button>
          <button 
            className="btn" 
            style={{ background: '#6f42c1', color: 'white' }}
            onClick={() => handleQuickAction('statistics')}
          >
            <TrendingUp size={16} />
            매출 분석
          </button>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="주문 상세 정보"
        size="medium"
      >
        {selectedOrder && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  주문번호
                </label>
                <p style={{ margin: 0, color: '#007bff', fontWeight: '600' }}>
                  {selectedOrder.id}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  주문상태
                </label>
                <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>
            
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  고객명
                </label>
                <p style={{ margin: 0 }}>{selectedOrder.customer_name || selectedOrder.customer}</p>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  상품명
                </label>
                <p style={{ margin: 0 }}>{selectedOrder.product_name || selectedOrder.product}</p>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  주문금액
                </label>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '1.125rem' }}>
                  {selectedOrder.total_amount ? formatCurrency(selectedOrder.total_amount) : selectedOrder.amount}
                </p>
              </div>
              
              {selectedOrder.order_date && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    주문일시
                  </label>
                  <p style={{ margin: 0, color: '#666' }}>
                    {new Date(selectedOrder.order_date).toLocaleString('ko-KR')}
                  </p>
                </div>
              )}
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowOrderModal(false);
                  navigate('/admin/orders');
                }}
              >
                주문 관리로 이동
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

export default DashboardMerchant;