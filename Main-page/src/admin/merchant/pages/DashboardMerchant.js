import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  Eye
} from 'lucide-react';
import Modal from '../../shared/components/Modal';

const DashboardMerchant = () => {
  const navigate = useNavigate();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 샘플 데이터
  const stats = [
    {
      title: '오늘 주문',
      value: '24',
      icon: ShoppingCart,
      color: '#007bff',
      change: '+12%'
    },
    {
      title: '총 상품',
      value: '1,234',
      icon: Package,
      color: '#28a745',
      change: '+5%'
    },
    {
      title: '총 고객',
      value: '5,678',
      icon: Users,
      color: '#ffc107',
      change: '+8%'
    },
    {
      title: '오늘 매출',
      value: '₩2,450,000',
      icon: DollarSign,
      color: '#dc3545',
      change: '+15%'
    }
  ];

  const recentOrders = [
    { id: '#12345', customer: '김철수', product: '스마트폰 케이스', amount: '₩25,000', status: '배송중' },
    { id: '#12346', customer: '이영희', product: '무선 이어폰', amount: '₩89,000', status: '결제완료' },
    { id: '#12347', customer: '박민수', product: '노트북 스탠드', amount: '₩45,000', status: '배송완료' },
    { id: '#12348', customer: '정수진', product: '블루투스 스피커', amount: '₩120,000', status: '주문접수' },
    { id: '#12349', customer: '최동현', product: '휴대폰 충전기', amount: '₩15,000', status: '배송중' }
  ];

  const topProducts = [
    { name: '스마트폰 케이스', sales: 156, revenue: '₩3,900,000' },
    { name: '무선 이어폰', sales: 89, revenue: '₩7,921,000' },
    { name: '노트북 스탠드', sales: 67, revenue: '₩3,015,000' },
    { name: '블루투스 스피커', sales: 45, revenue: '₩5,400,000' },
    { name: '휴대폰 충전기', sales: 234, revenue: '₩3,510,000' }
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      '주문접수': 'badge-info',
      '결제완료': 'badge-success',
      '배송중': 'badge-warning',
      '배송완료': 'badge-success'
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

  return (
    <div>
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
                {recentOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewOrder(order)}
                  >
                    <td style={{ fontWeight: '600', color: '#007bff' }}>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td style={{ fontWeight: '600' }}>{order.amount}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
            {topProducts.map((product, index) => (
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
                    판매: {product.sales}개
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#28a745' }}>
                    {product.revenue}
                  </div>
                </div>
              </div>
            ))}
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
              <p style={{ margin: 0 }}>{selectedOrder.customer}</p>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                상품명
              </label>
              <p style={{ margin: 0 }}>{selectedOrder.product}</p>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                주문금액
              </label>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '1.125rem' }}>
                {selectedOrder.amount}
              </p>
            </div>
            
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