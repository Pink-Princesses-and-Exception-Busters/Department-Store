import React, { useState, useEffect } from 'react';
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
import { supabase } from '../../../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const Orders = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 주문 데이터를 UI 형식으로 변환하는 함수
  const transformOrderData = (order) => {
    const products = order.items ? order.items.map(item => item.name) : ['상품 정보 없음'];
    
    return {
      id: `#${order.id.slice(0, 8)}`, // UUID의 앞 8자리만 표시
      originalId: order.id, // 전체 UUID 보관
      customer: order.recipient_name || '고객 정보 없음',
      customerEmail: '이메일 정보 없음', // users 테이블과 조인 필요
      products: products,
      amount: order.total_amount,
      status: order.status,
      date: new Date(order.order_date).toISOString().split('T')[0],
      paymentMethod: order.payment_method,
      address: order.shipping_address,
      phone: order.recipient_phone,
      paymentKey: order.payment_key,
      trackingNumber: order.tracking_number,
      estimatedDelivery: order.estimated_delivery ? new Date(order.estimated_delivery).toISOString().split('T')[0] : null,
      items: order.items || [],
      cancelReason: order.cancel_reason || null // 취소 사유 추가
    };
  };

  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📊 주문 데이터 조회 시작')
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // 사용자 역할에 따른 필터링
      if (user?.user_metadata?.role === 'merchant') {
        console.log('🏪 입점사 관리자 모드')
        // 입점사 관리자: 해당 브랜드의 주문만 조회
        // items 배열에서 특정 브랜드의 상품이 포함된 주문을 찾아야 함
        // 일단 모든 주문을 가져온 후 클라이언트에서 필터링
        const { data, error } = await query;
        
        if (error) {
          console.error('❌ 주문 데이터 조회 오류:', error);
          return;
        }

        console.log('📦 조회된 전체 주문 수:', data?.length || 0);

        // 입점사 관리자의 브랜드명 추출 - brand_admins 테이블에서 조회
        let merchantBrand = user?.user_metadata?.brand;
        
        if (!merchantBrand) {
          // user_metadata에 브랜드 정보가 없으면 brand_admins 테이블에서 조회
          const { data: brandAdmin, error: brandError } = await supabase
            .from('brand_admins')
            .select('name')
            .eq('email', user?.email)
            .single();
          
          if (brandError) {
            console.error('❌ brand_admins 조회 오류:', brandError);
          }
          
          merchantBrand = brandAdmin?.name || 'Unknown';
        }
        
        console.log('🏷️ 입점사 브랜드:', merchantBrand);
        
        // 해당 브랜드의 상품이 포함된 주문만 필터링
        const filteredOrders = data.filter(order => {
          if (!order.items || !Array.isArray(order.items)) {
            console.log('❌ 주문에 items 데이터 없음:', order.id);
            return false;
          }
          
          // 각 주문의 브랜드 정보 상세 로그
          console.log('🔍 주문 검사:', order.id);
          console.log('📦 주문 상품들:', order.items.map(item => ({
            name: item.name,
            brand: item.brand,
            brandType: typeof item.brand
          })));
          console.log('🎯 찾는 브랜드:', merchantBrand, typeof merchantBrand);
          
          const hasBrandItem = order.items.some(item => {
            // "Unknown" 브랜드는 제외하고 정확한 브랜드 매칭만
            const match = item.brand === merchantBrand && merchantBrand !== 'Unknown';
            console.log(`   ${item.name}: "${item.brand}" === "${merchantBrand}" (브랜드가 Unknown이 아님: ${merchantBrand !== 'Unknown'}) ? ${match}`);
            return match;
          });
          
          console.log(`${hasBrandItem ? '✅' : '❌'} 주문 ${order.id} 매칭 결과: ${hasBrandItem}`);
          return hasBrandItem;
        });

        console.log('🔍 필터링된 주문 수:', filteredOrders.length);

        // 사용자 이메일 정보를 별도로 조회
        const userIds = [...new Set(filteredOrders.map(order => order.user_id))];
        console.log('👥 사용자 ID 목록:', userIds);
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, name')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ 사용자 데이터 조회 오류:', usersError);
        }

        console.log('👤 조회된 사용자 수:', usersData?.length || 0);

        const usersMap = {};
        if (usersData) {
          usersData.forEach(user => {
            usersMap[user.id] = user;
          });
        }

        const transformedOrders = filteredOrders.map(order => ({
          ...transformOrderData(order),
          customerEmail: usersMap[order.user_id]?.email || '이메일 정보 없음'
        }));
        
        console.log('✅ 최종 주문 목록:', transformedOrders.length, '건');
        setOrders(transformedOrders);
      } else {
        // HQ 관리자: 모든 주문 조회
        const { data, error } = await query;
        
        if (error) {
          console.error('주문 데이터 조회 오류:', error);
          return;
        }

        // 사용자 이메일 정보를 별도로 조회
        const userIds = [...new Set(data.map(order => order.user_id))];
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, name')
          .in('id', userIds);

        const usersMap = {};
        if (usersData) {
          usersData.forEach(user => {
            usersMap[user.id] = user;
          });
        }

        const transformedOrders = data.map(order => ({
          ...transformOrderData(order),
          customerEmail: usersMap[order.user_id]?.email || '이메일 정보 없음'
        }));
        
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('주문 데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // 주문 관리 함수들
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      // orderId는 '#12345678' 형태이므로 원본 UUID를 찾아야 함
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        alert('주문을 찾을 수 없습니다.');
        return;
      }

      // Supabase에서 주문 상태 업데이트
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.originalId);

      if (error) {
        console.error('주문 상태 업데이트 오류:', error);
        alert('주문 상태 변경에 실패했습니다.');
        return;
      }

      // UI 상태 업데이트
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      alert(`주문 상태가 '${newStatus}'로 변경되었습니다.`);
    } catch (error) {
      console.error('주문 상태 변경 실패:', error);
      alert('주문 상태 변경에 실패했습니다.');
    }
  };

  const handleBulkStatusUpdate = async (status) => {
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
      try {
        // 선택된 주문들의 원본 ID 추출
        const orderIds = eligibleOrders.map(order => order.originalId);
        
        // Supabase에서 벌크 업데이트
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: status,
            updated_at: new Date().toISOString()
          })
          .in('id', orderIds);

        if (error) {
          console.error('벌크 주문 상태 업데이트 오류:', error);
          alert('주문 상태 변경에 실패했습니다.');
          return;
        }

        // UI 상태 업데이트
        setOrders(orders.map(order => 
          eligibleOrders.some(eligible => eligible.id === order.id) 
            ? { ...order, status } 
            : order
        ));
        alert(`${eligibleOrders.length}개 주문이 '${status}' 상태로 변경되었습니다.`);
      } catch (error) {
        console.error('벌크 주문 상태 변경 실패:', error);
        alert('주문 상태 변경에 실패했습니다.');
      }
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
      '상품준비': { class: 'badge-info', icon: Package },
      '배송중': { class: 'badge-warning', icon: Truck },
      '배송완료': { class: 'badge-success', icon: Package },
      '주문취소': { class: 'badge-secondary', icon: X },
      '취소요청': { class: 'badge-danger', icon: AlertCircle },
      '반품신청': { class: 'badge-warning', icon: AlertCircle },
      '반품완료': { class: 'badge-secondary', icon: CheckCircle }
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <div style={{ marginBottom: '10px', textAlign: 'center' }}>📦</div>
          주문 데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 상단 통계 */}
      <div className="stats-grid">
        {/* 전체 버튼 */}
        <div 
          className={`stat-card ${selectedStatus === 'all' ? 'stat-card-selected' : ''}`}
          onClick={() => setSelectedStatus('all')}
          style={{ 
            cursor: 'pointer',
            transform: selectedStatus === 'all' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: selectedStatus === 'all' ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          <div 
            className="stat-icon" 
            style={{ backgroundColor: '#6c757d' }}
          >
            <Filter size={20} />
          </div>
          <div className="stat-content">
            <h3>{orders.length}</h3>
            <p>전체</p>
          </div>
          {selectedStatus === 'all' && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              backgroundColor: '#007bff',
              borderRadius: '50%'
            }} />
          )}
        </div>
        
        {getStatusStats().map((stat) => {
          const statusInfo = getStatusBadge(stat.value);
          const Icon = statusInfo.icon;
          const isSelected = selectedStatus === stat.value;
          
          return (
            <div 
              key={stat.value} 
              className={`stat-card ${isSelected ? 'stat-card-selected' : ''}`}
              onClick={() => setSelectedStatus(stat.value)}
              style={{ 
                cursor: 'pointer',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              <div 
                className="stat-icon" 
                style={{ 
                  backgroundColor: stat.value === '결제완료' || stat.value === '배송완료' ? '#28a745' :
                                   stat.value === '배송중' || stat.value === '반품신청' ? '#ffc107' :
                                   stat.value === '취소요청' ? '#dc3545' :
                                   stat.value === '주문취소' || stat.value === '반품완료' ? '#6c757d' : '#007bff'
                }}
              >
                <Icon size={20} />
              </div>
              <div className="stat-content">
                <h3>{stat.count}</h3>
                <p>{stat.label}</p>
              </div>
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#007bff',
                  borderRadius: '50%'
                }} />
              )}
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
                {selectedOrder.status === '취소요청' && selectedOrder.cancelReason && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#dc3545' }}>
                      취소 사유
                    </label>
                    <p style={{ 
                      margin: 0, 
                      padding: '0.75rem', 
                      backgroundColor: '#fff5f5', 
                      border: '1px solid #fed7d7', 
                      borderRadius: '4px',
                      color: '#c53030'
                    }}>
                      {selectedOrder.cancelReason}
                    </p>
                  </div>
                )}
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
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#666', 
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    ※ 총 결제금액에는 상품가격과 배송비가 포함되어 있습니다.
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
              {selectedOrder.status === '취소요청' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      if (window.confirm('주문 취소를 승인하시겠습니까?')) {
                        handleUpdateOrderStatus(selectedOrder.id, '주문취소');
                        setShowDetailModal(false);
                      }
                    }}
                  >
                    <CheckCircle size={16} />
                    취소 승인
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      if (window.confirm('주문 취소를 거부하시겠습니까? 주문이 결제완료 상태로 돌아갑니다.')) {
                        handleUpdateOrderStatus(selectedOrder.id, '결제완료');
                        setShowDetailModal(false);
                      }
                    }}
                  >
                    <X size={16} />
                    취소 거부
                  </button>
                </>
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