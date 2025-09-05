import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Package, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  DollarSign,
  CheckCircle,
  Users
} from 'lucide-react';
import Modal from '../../shared/components/Modal';

const HQDashboard = () => {
  const navigate = useNavigate();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 백화점 본사 통계 데이터
  const stats = [
    {
      title: '총 입점사',
      value: '156',
      icon: Building2,
      color: '#007bff',
      change: '+3개'
    },
    {
      title: '승인 대기 상품',
      value: '23',
      icon: Package,
      color: '#ffc107',
      change: '+5개'
    },
    {
      title: '이번 달 매출',
      value: '₩45.6억',
      icon: DollarSign,
      color: '#28a745',
      change: '+12.5%'
    },
    {
      title: '오늘 고객 문의',
      value: '18',
      icon: MessageSquare,
      color: '#dc3545',
      change: '+6개'
    }
  ];

  const recentApprovals = [
    { id: 'PRD-001', tenant: '삼성전자', product: '갤럭시 S24 케이스', category: '전자제품', status: '승인완료', submittedAt: '2024-01-15' },
    { id: 'PRD-002', tenant: 'LG전자', product: '울트라 기어 모니터', category: '전자제품', status: '검토중', submittedAt: '2024-01-15' },
    { id: 'PRD-003', tenant: '나이키', product: '에어맥스 270', category: '신발', status: '승인완료', submittedAt: '2024-01-14' },
    { id: 'PRD-004', tenant: '아디다스', product: '울트라부스트 22', category: '신발', status: '반려', submittedAt: '2024-01-14' },
    { id: 'PRD-005', tenant: '애플', product: 'iPhone 15 Pro', category: '전자제품', status: '검토중', submittedAt: '2024-01-13' }
  ];

  const topTenants = [
    { name: '삼성전자', category: '전자제품', revenue: '₩12.3억', growth: '+15.2%' },
    { name: 'LG전자', category: '전자제품', revenue: '₩8.9억', growth: '+8.7%' },
    { name: '애플코리아', category: '전자제품', revenue: '₩7.2억', growth: '+22.1%' },
    { name: '나이키', category: '스포츠용품', revenue: '₩5.8억', growth: '+12.5%' },
    { name: '아디다스', category: '스포츠용품', revenue: '₩4.6억', growth: '+9.3%' }
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      '승인완료': 'badge-success',
      '검토중': 'badge-warning',
      '반려': 'badge-danger',
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
        navigate('/tenants');
        break;
      case 'product-approval':
        navigate('/product-management');
        break;
      case 'customer-service':
        navigate('/customer-service');
        break;
      case 'statistics':
        navigate('/statistics');
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
        {/* 최근 상품 승인 현황 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">최근 상품 승인 현황</h2>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/product-management')}
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
                {recentApprovals.map((approval) => (
                  <tr 
                    key={approval.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewApproval(approval)}
                  >
                    <td style={{ fontWeight: '600', color: '#007bff' }}>{approval.id}</td>
                    <td>{approval.tenant}</td>
                    <td>{approval.product}</td>
                    <td>{approval.category}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(approval.status)}`}>
                        {approval.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
            {topTenants.map((tenant, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < topTenants.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {tenant.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {tenant.category}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#28a745' }}>
                    {tenant.revenue}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#28a745' }}>
                    {tenant.growth}
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
                  navigate('/product-management');
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
