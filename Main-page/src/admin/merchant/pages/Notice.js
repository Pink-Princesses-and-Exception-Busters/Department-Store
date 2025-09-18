import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Package, AlertTriangle, CreditCard, MessageCircle, Clock, CheckCircle, X } from 'lucide-react';

/**
 * 알림 시스템 구현 가이드
 * 
 * 실제 이벤트 데이터 연동 방법:
 * 
 * 1. 데이터베이스 테이블 생성 (Supabase SQL Editor에서 실행):
 *    ```sql
 *    CREATE TABLE notices (
 *      id SERIAL PRIMARY KEY,
 *      user_id UUID REFERENCES auth.users(id),
 *      type VARCHAR(50) NOT NULL, -- 'new_order', 'low_stock', 'payment_complete', 'customer_inquiry'
 *      title VARCHAR(200) NOT NULL,
 *      message TEXT NOT NULL,
 *      is_read BOOLEAN DEFAULT FALSE,
 *      priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
 *      related_id VARCHAR(100), -- 주문번호, 상품ID, 문의ID 등
 *      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 *    );
 *    
 *    -- RLS 정책 설정
 *    ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
 *    
 *    CREATE POLICY "Users can view their own notices" ON notices
 *      FOR SELECT USING (auth.uid() = user_id);
 *    
 *    CREATE POLICY "Users can update their own notices" ON notices
 *      FOR UPDATE USING (auth.uid() = user_id);
 *    
 *    CREATE POLICY "Users can delete their own notices" ON notices
 *      FOR DELETE USING (auth.uid() = user_id);
 *    ```
 * 
 * 2. 알림 생성 함수 (각 페이지에서 호출):
 *    ```javascript
 *    // 새 주문 알림 생성
 *    const createNewOrderNotice = async (orderId, customerName) => {
 *      const { error } = await supabase
 *        .from('notices')
 *        .insert({
 *          user_id: user.id,
 *          type: 'new_order',
 *          title: '새 주문이 도착했습니다',
 *          message: `주문번호 #${orderId} - ${customerName}님의 주문이 접수되었습니다.`,
 *          priority: 'high',
 *          related_id: orderId
 *        });
 *    };
 *    
 *    // 재고 부족 알림 생성
 *    const createLowStockNotice = async (productId, productName, currentStock) => {
 *      const { error } = await supabase
 *        .from('notices')
 *        .insert({
 *          user_id: user.id,
 *          type: 'low_stock',
 *          title: '재고 부족 알림',
 *          message: `상품 "${productName}"의 재고가 ${currentStock}개 미만입니다.`,
 *          priority: 'medium',
 *          related_id: productId
 *        });
 *    };
 *    
 *    // 결제 완료 알림 생성
 *    const createPaymentCompleteNotice = async (orderId, customerName) => {
 *      const { error } = await supabase
 *        .from('notices')
 *        .insert({
 *          user_id: user.id,
 *          type: 'payment_complete',
 *          title: '결제 완료',
 *          message: `주문번호 #${orderId} - ${customerName}님의 결제가 완료되었습니다.`,
 *          priority: 'low',
 *          related_id: orderId
 *        });
 *    };
 *    
 *    // 고객 문의 알림 생성
 *    const createCustomerInquiryNotice = async (inquiryId, customerName, inquiryType) => {
 *      const { error } = await supabase
 *        .from('notices')
 *        .insert({
 *          user_id: user.id,
 *          type: 'customer_inquiry',
 *          title: '새로운 고객 문의',
 *          message: `${customerName}님이 "${inquiryType}"로 새로운 문의를 남겼습니다.`,
 *          priority: 'medium',
 *          related_id: inquiryId
 *        });
 *    };
 *    ```
 * 
 * 3. 실시간 알림 (Supabase Realtime 사용):
 *    ```javascript
 *    // 컴포넌트에서 실시간 구독
 *    useEffect(() => {
 *      const channel = supabase
 *        .channel('notices')
 *        .on('postgres_changes', 
 *          { 
 *            event: 'INSERT', 
 *            schema: 'public', 
 *            table: 'notices',
 *            filter: `user_id=eq.${user.id}`
 *          }, 
 *          (payload) => {
 *            // 새 알림이 생성되면 알림 목록에 추가
 *            setNotices(prev => [payload.new, ...prev]);
 *            // 브라우저 알림 표시
 *            if (Notification.permission === 'granted') {
 *              new Notification(payload.new.title, {
 *                body: payload.new.message,
 *                icon: '/favicon.ico'
 *              });
 *            }
 *          }
 *        )
 *        .subscribe();
 *      
 *      return () => {
 *        supabase.removeChannel(channel);
 *      };
 *    }, [user.id]);
 *    ```
 * 
 * 4. 현재 예시 데이터를 실제 API 호출로 교체:
 *    - 아래 useEffect 내의 generateSampleNotices 함수를 실제 API 호출로 교체
 *    - 알림 읽음 처리, 삭제 기능도 데이터베이스 연동 필요
 */

const Notice = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);

  // 예시 알림 데이터 생성
  useEffect(() => {
    const generateSampleNotices = () => {
      const sampleNotices = [
        {
          id: 1,
          type: 'new_order',
          title: '새 주문이 도착했습니다',
          message: '주문번호 #ORD-2024-001 - 김철수님의 주문이 접수되었습니다.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
          isRead: false,
          priority: 'high',
          orderId: 'ORD-2024-001'
        },
        {
          id: 2,
          type: 'low_stock',
          title: '재고 부족 알림',
          message: '상품 "프리미엄 커피 원두 500g"의 재고가 10개 미만입니다.',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15분 전
          isRead: false,
          priority: 'medium',
          productId: 'PROD-001'
        },
        {
          id: 3,
          type: 'payment_complete',
          title: '결제 완료',
          message: '주문번호 #ORD-2024-002 - 이영희님의 결제가 완료되었습니다.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30분 전
          isRead: true,
          priority: 'low',
          orderId: 'ORD-2024-002'
        },
        {
          id: 4,
          type: 'customer_inquiry',
          title: '새로운 고객 문의',
          message: '박민수님이 "배송 관련 문의"로 새로운 문의를 남겼습니다.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
          isRead: false,
          priority: 'medium',
          inquiryId: 'INQ-2024-001'
        },
        {
          id: 5,
          type: 'new_order',
          title: '새 주문이 도착했습니다',
          message: '주문번호 #ORD-2024-003 - 최지영님의 주문이 접수되었습니다.',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3시간 전
          isRead: true,
          priority: 'high',
          orderId: 'ORD-2024-003'
        },
        {
          id: 6,
          type: 'low_stock',
          title: '재고 부족 알림',
          message: '상품 "유기농 허브티 세트"의 재고가 5개 미만입니다.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4시간 전
          isRead: true,
          priority: 'medium',
          productId: 'PROD-002'
        },
        {
          id: 7,
          type: 'payment_complete',
          title: '결제 완료',
          message: '주문번호 #ORD-2024-004 - 정수진님의 결제가 완료되었습니다.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6시간 전
          isRead: true,
          priority: 'low',
          orderId: 'ORD-2024-004'
        },
        {
          id: 8,
          type: 'customer_inquiry',
          title: '새로운 고객 문의',
          message: '한소희님이 "상품 품질 문의"로 새로운 문의를 남겼습니다.',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8시간 전
          isRead: true,
          priority: 'medium',
          inquiryId: 'INQ-2024-002'
        }
      ];

      setNotices(sampleNotices);
      setLoading(false);
    };

    // 실제 구현에서는 API 호출로 대체
    setTimeout(generateSampleNotices, 1000);
  }, []);

  // 알림 타입별 아이콘과 색상
  const getNoticeIcon = (type) => {
    switch (type) {
      case 'new_order':
        return { icon: Package, color: '#3b82f6', bgColor: '#dbeafe' };
      case 'low_stock':
        return { icon: AlertTriangle, color: '#f59e0b', bgColor: '#fef3c7' };
      case 'payment_complete':
        return { icon: CreditCard, color: '#10b981', bgColor: '#d1fae5' };
      case 'customer_inquiry':
        return { icon: MessageCircle, color: '#8b5cf6', bgColor: '#ede9fe' };
      default:
        return { icon: Bell, color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  // 알림 클릭 처리
  const handleNoticeClick = (notice) => {
    // 알림을 읽음 상태로 변경
    setNotices(prev => 
      prev.map(n => 
        n.id === notice.id ? { ...n, isRead: true } : n
      )
    );

    // 알림 타입에 따라 관련 페이지로 이동
    switch (notice.type) {
      case 'new_order':
      case 'payment_complete':
        navigate('/orders', { state: { orderId: notice.orderId } });
        break;
      case 'low_stock':
        navigate('/products', { state: { productId: notice.productId } });
        break;
      case 'customer_inquiry':
        navigate('/customers', { state: { inquiryId: notice.inquiryId } });
        break;
      default:
        break;
    }
  };

  // 알림 삭제
  const handleDeleteNotice = (noticeId, e) => {
    e.stopPropagation();
    setNotices(prev => prev.filter(n => n.id !== noticeId));
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    setNotices(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // 필터링된 알림 목록
  const filteredNotices = notices.filter(notice => {
    if (filter === 'unread') return !notice.isRead;
    if (filter === 'read') return notice.isRead;
    return true;
  });

  // 읽지 않은 알림 개수
  const unreadCount = notices.filter(n => !n.isRead).length;

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return timestamp.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}>
            <Bell size={32} />
          </div>
          <p>알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '700', 
            color: '#111827',
            margin: '0 0 0.5rem 0'
          }}>
            알림(미구현)
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: '0.875rem'
          }}>
            {unreadCount}개의 읽지 않은 알림이 있습니다
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* 필터 */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem' 
      }}>
        {[
          { key: 'all', label: '전체', count: notices.length },
          { key: 'unread', label: '읽지 않음', count: unreadCount },
          { key: 'read', label: '읽음', count: notices.filter(n => n.isRead).length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              background: filter === key ? '#3b82f6' : '#f3f4f6',
              color: filter === key ? 'white' : '#374151',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredNotices.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem',
            color: '#6b7280'
          }}>
            <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>알림이 없습니다</p>
          </div>
        ) : (
          filteredNotices.map(notice => {
            const { icon: Icon, color, bgColor } = getNoticeIcon(notice.type);
            
            return (
              <div
                key={notice.id}
                onClick={() => handleNoticeClick(notice)}
                style={{
                  background: notice.isRead ? '#ffffff' : '#fef7ff',
                  border: `1px solid ${notice.isRead ? '#e5e7eb' : '#c084fc'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* 아이콘 */}
                  <div style={{
                    background: bgColor,
                    color: color,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: notice.isRead ? '500' : '600',
                        color: notice.isRead ? '#374151' : '#111827'
                      }}>
                        {notice.title}
                      </h3>
                      
                      <button
                        onClick={(e) => handleDeleteNotice(notice.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          marginLeft: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <p style={{ 
                      margin: '0 0 0.5rem 0',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      {notice.message}
                    </p>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}>
                      <Clock size={12} />
                      {formatTime(notice.timestamp)}
                      
                      {!notice.isRead && (
                        <>
                          <span>•</span>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#ef4444'
                          }} />
                          <span>읽지 않음</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notice;

