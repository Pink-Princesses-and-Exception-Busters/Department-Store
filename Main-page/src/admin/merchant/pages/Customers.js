import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Mail, 
  Phone,
  User,
  Calendar,
  ShoppingBag,
  X,
  Loader
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { getBrandCustomers, getCurrentBrandName } from '../../../services/brandCustomerService';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: ''
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');

  // 브랜드 고객 데이터 로드
  useEffect(() => {
    const loadBrandCustomers = async () => {
      try {
        setLoading(true);
        
        // 현재 브랜드명 조회
        const currentBrand = await getCurrentBrandName();
        if (!currentBrand) {
          console.error('브랜드 정보를 찾을 수 없습니다.');
          return;
        }
        
        setBrandName(currentBrand);
        console.log('🏷️ 현재 브랜드:', currentBrand);
        
        // 브랜드별 고객 데이터 조회
        const brandCustomers = await getBrandCustomers(currentBrand);
        setCustomers(brandCustomers);
        
        console.log('👥 로드된 고객 수:', brandCustomers.length);
        
      } catch (error) {
        console.error('고객 데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBrandCustomers();
  }, []);

  // 필터링된 고객 목록
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerGrade = (totalSpent) => {
    if (totalSpent >= 500000) return { grade: 'VIP', color: '#dc3545' };
    if (totalSpent >= 300000) return { grade: '골드', color: '#ffc107' };
    if (totalSpent >= 100000) return { grade: '실버', color: '#6c757d' };
    return { grade: '브론즈', color: '#28a745' };
  };

  // 고객 관리 함수들
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleSendEmail = (customer) => {
    setSelectedCustomer(customer);
    setEmailContent({
      subject: `${customer.name}님께 드리는 안내`,
      message: `안녕하세요 ${customer.name}님,\n\n항상 저희 쇼핑몰을 이용해 주셔서 감사합니다.\n\n감사합니다.`
    });
    setShowEmailModal(true);
  };

  const handleSendEmailSubmit = () => {
    if (!emailContent.subject || !emailContent.message) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    // 실제로는 이메일 발송 API를 호출
    alert(`${selectedCustomer.name}님께 이메일이 발송되었습니다.`);
    setShowEmailModal(false);
    setEmailContent({ subject: '', message: '' });
  };

  const handleCallCustomer = (customer) => {
    if (window.confirm(`${customer.name}님(${customer.phone})에게 전화를 걸까요?`)) {
      // 실제로는 전화 시스템과 연동
      window.open(`tel:${customer.phone}`);
    }
  };

  const stats = [
    {
      title: '총 고객 수',
      value: customers.length,
      icon: User,
      color: '#007bff'
    },
    {
      title: '활성 고객',
      value: customers.filter(c => c.status === '활성').length,
      icon: User,
      color: '#28a745'
    },
    {
      title: '이번 달 신규',
      value: customers.filter(c => c.joinDate.startsWith('2024-01')).length,
      icon: Calendar,
      color: '#ffc107'
    },
    {
      title: '평균 주문액',
      value: `₩${Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toLocaleString()}`,
      icon: ShoppingBag,
      color: '#6f42c1'
    }
  ];

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#666' }}>브랜드 고객 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 브랜드 정보 표시 */}
      {brandName && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f8f9fa' }}>
          <h2 style={{ margin: 0, color: '#007bff' }}>
            🏷️ {brandName} 브랜드 고객 관리
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            {brandName} 상품을 구매한 고객들의 정보입니다.
          </p>
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
              </div>
            </div>
          );
        })}
      </div>

      {/* 검색 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title">고객 관리</h2>
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
              placeholder="고객명 또는 이메일로 검색..."
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

          <button className="btn" style={{ background: '#6c757d', color: 'white' }}>
            <Filter size={16} />
            필터
          </button>
        </div>
      </div>

      {/* 고객 목록 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            고객 목록 ({filteredCustomers.length}명)
          </h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>고객 정보</th>
                <th>연락처</th>
                <th>가입일</th>
                <th>주문 횟수</th>
                <th>총 구매액</th>
                <th>등급</th>
                <th>최근 주문</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const gradeInfo = getCustomerGrade(customer.totalSpent);
                
                return (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div 
                          style={{
                            width: '40px',
                            height: '40px',
                            background: '#007bff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {customer.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{customer.phone}</td>
                    <td>{customer.joinDate}</td>
                    <td style={{ fontWeight: '600' }}>{customer.totalOrders}회</td>
                    <td style={{ fontWeight: '600' }}>
                      ₩{customer.totalSpent.toLocaleString()}
                    </td>
                    <td>
                      <span 
                        className="badge"
                        style={{ 
                          backgroundColor: gradeInfo.color + '20',
                          color: gradeInfo.color,
                          border: `1px solid ${gradeInfo.color}`
                        }}
                      >
                        {gradeInfo.grade}
                      </span>
                    </td>
                    <td>{customer.lastOrder}</td>
                    <td>
                      <span className={`badge ${customer.status === '활성' ? 'badge-success' : 'badge-warning'}`}>
                        {customer.status}
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
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="이메일 발송"
                          onClick={() => handleSendEmail(customer)}
                        >
                          <Mail size={14} />
                        </button>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="전화걸기"
                          onClick={() => handleCallCustomer(customer)}
                        >
                          <Phone size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#666' 
          }}>
            <User size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>검색 조건에 맞는 고객이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 고객 등급별 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {['VIP', '골드', '실버', '브론즈'].map(grade => {
          const count = customers.filter(c => getCustomerGrade(c.totalSpent).grade === grade).length;
          const gradeInfo = getCustomerGrade(grade === 'VIP' ? 500000 : grade === '골드' ? 300000 : grade === '실버' ? 100000 : 50000);
          
          return (
            <div key={grade} className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ color: gradeInfo.color, fontSize: '2rem', marginBottom: '0.5rem' }}>
                {count}
              </h3>
              <p style={{ color: '#666' }}>{grade} 고객</p>
            </div>
          );
        })}
      </div>

      {/* 고객 상세 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="고객 상세 정보"
        size="large"
      >
        {selectedCustomer && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* 고객 기본 정보 */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h4 style={{ margin: 0 }}>기본 정보</h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div 
                  style={{
                    width: '60px',
                    height: '60px',
                    background: '#007bff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                  }}
                >
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{selectedCustomer.name}</h3>
                  <span className={`badge ${getCustomerGrade(selectedCustomer.totalSpent).color === '#dc3545' ? 'badge-danger' : 
                    getCustomerGrade(selectedCustomer.totalSpent).color === '#ffc107' ? 'badge-warning' :
                    getCustomerGrade(selectedCustomer.totalSpent).color === '#6c757d' ? 'badge-info' : 'badge-success'}`}>
                    {getCustomerGrade(selectedCustomer.totalSpent).grade} 고객
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    고객 ID
                  </label>
                  <p style={{ margin: 0 }}>{selectedCustomer.id}</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    가입일
                  </label>
                  <p style={{ margin: 0 }}>{selectedCustomer.joinDate}</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    이메일
                  </label>
                  <p style={{ margin: 0 }}>{selectedCustomer.email}</p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                    연락처
                  </label>
                  <p style={{ margin: 0 }}>{selectedCustomer.phone}</p>
                </div>
              </div>
            </div>

            {/* 구매 통계 */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <h4 style={{ margin: 0 }}>구매 통계</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h3 style={{ margin: 0, color: '#007bff', fontSize: '2rem' }}>
                    {selectedCustomer.totalOrders}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>총 주문 횟수</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h3 style={{ margin: 0, color: '#28a745', fontSize: '2rem' }}>
                    ₩{selectedCustomer.totalSpent.toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>총 구매 금액</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h3 style={{ margin: 0, color: '#ffc107', fontSize: '2rem' }}>
                    ₩{Math.round(selectedCustomer.totalSpent / selectedCustomer.totalOrders).toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>평균 주문 금액</p>
                </div>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                  최근 주문일
                </label>
                <p style={{ margin: 0, fontWeight: '600' }}>{selectedCustomer.lastOrder}</p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowDetailModal(false);
                  handleSendEmail(selectedCustomer);
                }}
              >
                <Mail size={16} />
                이메일 발송
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleCallCustomer(selectedCustomer)}
              >
                <Phone size={16} />
                전화 걸기
              </button>
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

      {/* 이메일 발송 모달 */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="이메일 발송"
        size="medium"
      >
        {selectedCustomer && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                받는 사람
              </label>
              <div style={{ 
                padding: '0.75rem', 
                background: '#f8f9fa', 
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <User size={16} />
                <span>{selectedCustomer.name} ({selectedCustomer.email})</span>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                제목 *
              </label>
              <input
                type="text"
                value={emailContent.subject}
                onChange={(e) => setEmailContent({...emailContent, subject: e.target.value})}
                placeholder="이메일 제목을 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                내용 *
              </label>
              <textarea
                value={emailContent.message}
                onChange={(e) => setEmailContent({...emailContent, message: e.target.value})}
                placeholder="이메일 내용을 입력하세요"
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-primary"
                onClick={handleSendEmailSubmit}
              >
                <Mail size={16} />
                발송
              </button>
              <button 
                className="btn" 
                style={{ background: '#6c757d', color: 'white' }}
                onClick={() => setShowEmailModal(false)}
              >
                <X size={16} />
                취소
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Customers;