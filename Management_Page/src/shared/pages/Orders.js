import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  X
} from 'lucide-react';
import Modal from '../components/Modal';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([
    {
      id: '#12345',
      customer: '김철수',
      customerEmail: 'kim@email.com',
      products: ['스마트폰 케이스', '무선 충전기'],
      amount: 45000,
      status: '배송중',
      date: '2024-01-15',
      paymentMethod: '카드결제',
      address: '서울특별시 강남구 테헤란로 123',
      phone: '010-1234-5678'
    },
    {
      id: '#12346',
      customer: '이영희',
      customerEmail: 'lee@email.com',
      products: ['무선 이어폰'],
      amount: 89000,
      status: '결제완료',
      date: '2024-01-15',
      paymentMethod: '계좌이체',
      address: '서울특별시 서초구 서초대로 456',
      phone: '010-2345-6789'
    },
    {
      id: '#12347',
      customer: '박민수',
      customerEmail: 'park@email.com',
      products: ['노트북 스탠드', '마우스 패드'],
      amount: 65000,
      status: '배송완료',
      date: '2024-01-14',
      paymentMethod: '카드결제',
      address: '부산광역시 해운대구 해운대로 789',
      phone: '010-3456-7890'
    },
    {
      id: '#12348',
      customer: '정수진',
      customerEmail: 'jung@email.com',
      products: ['블루투스 스피커'],
      amount: 120000,
      status: '주문접수',
      date: '2024-01-15',
      paymentMethod: '무통장입금',
      address: '대구광역시 중구 중앙대로 321',
      phone: '010-4567-8901'
    },
    {
      id: '#12349',
      customer: '최동현',
      customerEmail: 'choi@email.com',
      products: ['휴대폰 충전기', '케이블'],
      amount: 25000,
      status: '취소요청',
      date: '2024-01-13',
      paymentMethod: '카드결제',
      address: '인천광역시 남동구 구월로 654',
      phone: '010-5678-9012'
    }
  ]);

  // 주문 관리 함수들
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    alert(`주문 상태가 '${newStatus}'로 변경되었습니다.`);
  };

  const handleBulkStatusUpdate = (status) => {
    const eligibleOrders = orders.filter(order => {
      if (status === '결제완료') return order.status === '주문접수';
      if (status === '배송중') return order.status === '결제완료';
      return false;
    });

    if (eligibleOrders.length === 0) {
      alert(`${status}로 변경할 수 있는 주문이 없습니다.`);
      return;
    }

    if (window.confirm(`${eligibleOrders.length}개 주문을 '${status}' 상태로 변경하시겠습니까?`)) {
      setOrders(orders.map(order => 
        eligibleOrders.some(eligible => eligible.id === order.id) 
          ? { ...order, status } 
          : order
      ));
      alert(`${eligibleOrders.length}개 주문이 '${status}' 상태로 변경되었습니다.`);
    }
  };

  const handleExportOrders = () => {
    const csvContent = [
      ['주문번호', '고객명', '이메일', '상품', '금액', '상태', '주문일시', '결제방법'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        order.customer,
        order.customerEmail,
        order.products.join(';'),
        order.amount,
        order.status,
        order.date,
        order.paymentMethod
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `주문내역_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusOptions = [
    { value: 'all', label: '전체 상태' },
    { value: '주문접수', label: '주문접수' },
    { value: '결제완료', label: '결제완료' },
    { value: '배송중', label: '배송중' },
    { value: '배송완료', label: '배송완료' },
    { value: '취소요청', label: '취소요청' }
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      '주문접수': { class: 'badge-info', icon: Clock },
      '결제완료': { class: 'badge-success', icon: CheckCircle },
      '배송중': { class: 'badge-warning', icon: Truck },
      '배송완료': { class: 'badge-success', icon: Package },
      '취소요청': { class: 'badge-danger', icon: AlertCircle }
    };
    return statusMap[status] || { class: 'badge-info', icon: Clock };
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusStats = () => {
    return statusOptions.slice(1).map(status => ({
      ...status,
      count: orders.filter(order => order.status === status.value).length
    }));
  };

  return (
    <div>
      {/* 상단 통계 */}
      <div className="stats-grid">
        {getStatusStats().map((stat) => {
          const statusInfo = getStatusBadge(stat.value);
          const Icon = statusInfo.icon;
          
          return (
            <div key={stat.value} className="stat-card">
              <div 
                className="stat-icon" 
                style={{ 
                  backgroundColor: stat.value === '결제완료' || stat.value === '배송완료' ? '#28a745' :
                                   stat.value === '배송중' ? '#ffc107' :
                                   stat.value === '취소요청' ? '#dc3545' : '#007bff'
                }}
              >
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <h3>{stat.count}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 검색 및 필터 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title">주문 관리</h2>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#666'
              }} 
            />
            <input
              type="text"
              placeholder="주문번호 또는 고객명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.875rem',
              minWidth: '140px'
            }}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button className="btn" style={{ background: '#6c757d', color: 'white' }}>
            <Filter size={16} />
            필터
          </button>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            주문 목록 ({filteredOrders.length}개)
          </h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>고객 정보</th>
                <th>상품</th>
                <th>결제금액</th>
                <th>결제방법</th>
                <th>주문일시</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = getStatusBadge(order.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '600', color: '#007bff' }}>
                      {order.id}
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {order.customer}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {order.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        {order.products.map((product, index) => (
                          <div key={index} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            {product}
                          </div>
                        ))}
                        <small style={{ color: '#666' }}>
                          {order.products.length}개 상품
                        </small>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ₩{order.amount.toLocaleString()}
                    </td>
                    <td>{order.paymentMethod}</td>
                    <td>{order.date}</td>
                    <td>
                      <span className={`badge ${statusInfo.class}`}>
                        <StatusIcon size={12} style={{ marginRight: '4px' }} />
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn" 
                          style={{ 
                            background: 'transparent', 
                            border: '1px solid #ddd',
                            padding: '0.25rem 0.5rem'
                          }}
                          title="상세보기"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye size={14} />
                        </button>
                        {order.status === '주문접수' && (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '0.25rem 0.5rem' }}
                            title="결제확인"
                            onClick={() => handleUpdateOrderStatus(order.id, '결제완료')}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {order.status === '결제완료' && (
                          <button 
                            className="btn btn-warning" 
                            style={{ padding: '0.25rem 0.5rem' }}
                            title="배송처리"
                            onClick={() => handleUpdateOrderStatus(order.id, '배송중')}
                          >
                            <Truck size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#666' 
          }}>
            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>검색 조건에 맞는 주문이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">빠른 작업</h3>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-success"
            onClick={() => handleBulkStatusUpdate('결제완료')}
          >
            <CheckCircle size={16} />
            일괄 결제확인
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => handleBulkStatusUpdate('배송중')}
          >
            <Truck size={16} />
            일괄 배송처리
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleExportOrders}
          >
            <Eye size={16} />
            주문 내역 내보내기
          </button>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="주문 상세 정보"
        size="large"
      >
        {selectedOrder && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* 주문 기본 정보 */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h4 style={{ margin: 0 }}>주문 정보</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    주문번호
                  </label>
                  <p style={{ margin: 0, color: '#007bff', fontWeight: '600', fontSize: '1.125rem' }}>
                    {selectedOrder.id}
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    주문상태
                  </label>
                  <span className={`badge ${getStatusBadge(selectedOrder.status).class}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    주문일시
                  </label>
                  <p style={{ margin: 0 }}>{selectedOrder.date}</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    결제방법
                  </label>
                  <p style={{ margin: 0 }}>{selectedOrder.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* 고객 정보 */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h4 style={{ margin: 0 }}>고객 정보</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    고객명
                  </label>
                  <p style={{ margin: 0, fontWeight: '600' }}>{selectedOrder.customer}</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    이메일
                  </label>
                  <p style={{ margin: 0 }}>{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    연락처
                  </label>
                  <p style={{ margin: 0 }}>{selectedOrder.phone}</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    배송주소
                  </label>
                  <p style={{ margin: 0 }}>{selectedOrder.address}</p>
                </div>
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h4 style={{ margin: 0 }}>주문 상품</h4>
              </div>
              <div>
                {selectedOrder.products.map((product, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: index < selectedOrder.products.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        style={{
                          width: '40px',
                          height: '40px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Package size={20} color="#666" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{product}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>수량: 1개</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div style={{ 
                  marginTop: '1rem', 
                  paddingTop: '1rem', 
                  borderTop: '2px solid #eee',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#007bff' }}>
                    총 결제금액: ₩{selectedOrder.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {selectedOrder.status === '주문접수' && (
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, '결제완료');
                    setShowDetailModal(false);
                  }}
                >
                  <CheckCircle size={16} />
                  결제 확인
                </button>
              )}
              {selectedOrder.status === '결제완료' && (
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, '배송중');
                    setShowDetailModal(false);
                  }}
                >
                  <Truck size={16} />
                  배송 처리
                </button>
              )}
              <button 
                className="btn" 
                style={{ background: '#6c757d', color: 'white' }}
                onClick={() => setShowDetailModal(false)}
              >
                <X size={16} />
                닫기
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;