import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  XCircle,
  Building2,
  AlertCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import Modal from '../../shared/components/Modal';

const ProductApproval = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [products, setProducts] = useState([
    {
      id: 1,
      name: '갤럭시 S24 울트라',
      tenant: '삼성전자',
      category: '전자제품',
      price: 1598000,
      status: '승인대기',
      submittedDate: '2024-01-15',
      description: '최신 스마트폰 모델',
      imageUrl: 'https://via.placeholder.com/100x100?text=Phone',
      stock: 50,
      commission: 5.0
    },
    {
      id: 2,
      name: 'LG OLED TV 65인치',
      tenant: 'LG전자',
      category: '전자제품',
      price: 2500000,
      status: '승인됨',
      submittedDate: '2024-01-14',
      description: '프리미엄 OLED TV',
      imageUrl: 'https://via.placeholder.com/100x100?text=TV',
      stock: 20,
      commission: 4.5
    },
    {
      id: 3,
      name: '나이키 에어맥스',
      tenant: '신세계인터내셔날',
      category: '패션',
      price: 89000,
      status: '승인됨',
      submittedDate: '2024-01-13',
      description: '스포츠 신발',
      imageUrl: 'https://via.placeholder.com/100x100?text=Shoes',
      stock: 100,
      commission: 6.0
    },
    {
      id: 4,
      name: '유기농 과일 세트',
      tenant: '신규입점업체',
      category: '식품',
      price: 25000,
      status: '승인거부',
      submittedDate: '2024-01-12',
      description: '신선한 유기농 과일',
      imageUrl: 'https://via.placeholder.com/100x100?text=Fruit',
      stock: 30,
      commission: 5.0,
      rejectionReason: '식품 안전 인증서 누락'
    },
    {
      id: 5,
      name: '디자인 의자',
      tenant: '가구업체',
      category: '가구',
      price: 450000,
      status: '승인대기',
      submittedDate: '2024-01-11',
      description: '모던 디자인 의자',
      imageUrl: 'https://via.placeholder.com/100x100?text=Chair',
      stock: 15,
      commission: 5.5
    }
  ]);

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: '승인대기', label: '승인대기' },
    { value: '승인됨', label: '승인됨' },
    { value: '승인거부', label: '승인거부' }
  ];

  const categoryOptions = [
    '전자제품', '패션', '식품', '가구', '뷰티', '스포츠', '도서', '완구', '기타'
  ];

  // 필터링된 상품 목록
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tenant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 상품 상태 변경
  const handleStatusChange = (productId, newStatus, rejectionReason = '') => {
    setProducts(products.map(product => 
      product.id === productId ? { 
        ...product, 
        status: newStatus,
        ...(rejectionReason && { rejectionReason })
      } : product
    ));
    
    const statusText = newStatus === '승인됨' ? '승인' : '반려';
    alert(`상품이 ${statusText}되었습니다.`);
  };

  // 상품 상세 정보 보기
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      '승인대기': 'badge-warning',
      '승인됨': 'badge-success',
      '승인거부': 'badge-danger'
    };
    return statusMap[status] || 'badge-info';
  };

  // 승인 대기 중인 상품 수
  const pendingCount = products.filter(p => p.status === '승인대기').length;
  const approvedCount = products.filter(p => p.status === '승인됨').length;
  const rejectedCount = products.filter(p => p.status === '승인거부').length;

  // 최근 승인 활동
  const recentActivities = [
    {
      id: 1,
      product: '갤럭시 S24 울트라',
      tenant: '삼성전자',
      action: '승인됨',
      timestamp: '2024-01-15 14:30',
      status: 'success'
    },
    {
      id: 2,
      product: 'LG OLED TV 65인치',
      tenant: 'LG전자',
      action: '승인됨',
      timestamp: '2024-01-15 13:45',
      status: 'success'
    },
    {
      id: 3,
      product: '나이키 에어맥스',
      tenant: '신세계인터내셔날',
      action: '반려됨',
      timestamp: '2024-01-15 12:20',
      status: 'danger'
    },
    {
      id: 4,
      product: '애플 아이폰 15 Pro',
      tenant: '애플코리아',
      action: '승인 대기',
      timestamp: '2024-01-15 11:15',
      status: 'warning'
    }
  ];

  const getActivityStatusBadge = (status) => {
    const statusMap = {
      'success': 'badge-success',
      'danger': 'badge-danger',
      'warning': 'badge-warning'
    };
    return statusMap[status] || 'badge-info';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>상품 승인 관리</h1>
        {pendingCount > 0 && (
          <div className="alert alert-warning">
            <AlertCircle size={16} />
            승인 대기 중인 상품이 {pendingCount}개 있습니다.
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffc107' }}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <h3>승인 대기</h3>
            <p className="stat-value">{pendingCount}건</p>
            <p className="stat-change">+5건</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#28a745' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>승인 완료</h3>
            <p className="stat-value">{approvedCount}건</p>
            <p className="stat-change">+12건</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dc3545' }}>
            <XCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>반려 건수</h3>
            <p className="stat-value">{rejectedCount}건</p>
            <p className="stat-change">-2건</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#007bff' }}>
            <BarChart3 size={20} />
          </div>
          <div className="stat-content">
            <h3>평균 처리시간</h3>
            <p className="stat-value">2.3일</p>
            <p className="stat-change">-0.5일</p>
          </div>
        </div>
      </div>

      {/* 최근 승인 활동 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">최근 승인 활동</h2>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>상품명</th>
                <th>입점사</th>
                <th>처리내용</th>
                <th>처리시간</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id}>
                  <td style={{ fontWeight: '600' }}>{activity.product}</td>
                  <td>{activity.tenant}</td>
                  <td>{activity.action}</td>
                  <td>{activity.timestamp}</td>
                  <td>
                    <span className={`badge ${getActivityStatusBadge(activity.status)}`}>
                      {activity.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="상품명, 입점사명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">전체 카테고리</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>상품 이미지</th>
              <th>상품명</th>
              <th>입점사</th>
              <th>카테고리</th>
              <th>가격</th>
              <th>재고</th>
              <th>상태</th>
              <th>등록일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </td>
                <td>
                  <div className="product-info">
                    <strong>{product.name}</strong>
                    <small style={{ color: '#666', display: 'block' }}>
                      {product.description}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="tenant-info">
                    <Building2 size={14} />
                    <span>{product.tenant}</span>
                  </div>
                </td>
                <td>{product.category}</td>
                <td>₩{product.price.toLocaleString()}</td>
                <td>{product.stock}개</td>
                <td>
                  <span className={`badge ${getStatusBadge(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td>{product.submittedDate}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleViewProduct(product)}
                    >
                      <Eye size={14} />
                    </button>
                    {product.status === '승인대기' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleStatusChange(product.id, '승인됨')}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            const reason = prompt('반려 사유를 입력하세요:');
                            if (reason) {
                              handleStatusChange(product.id, '승인거부', reason);
                            }
                          }}
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상품 상세 정보 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="상품 상세 정보"
      >
        {selectedProduct && (
          <div className="product-details">
            <div className="product-image-section">
              <img 
                src={selectedProduct.imageUrl} 
                alt={selectedProduct.name}
                style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
            
            <div className="detail-section">
              <h3>기본 정보</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>상품명</label>
                  <span>{selectedProduct.name}</span>
                </div>
                <div className="detail-item">
                  <label>입점사</label>
                  <span>{selectedProduct.tenant}</span>
                </div>
                <div className="detail-item">
                  <label>카테고리</label>
                  <span>{selectedProduct.category}</span>
                </div>
                <div className="detail-item">
                  <label>가격</label>
                  <span>₩{selectedProduct.price.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>재고</label>
                  <span>{selectedProduct.stock}개</span>
                </div>
                <div className="detail-item">
                  <label>수수료율</label>
                  <span>{selectedProduct.commission}%</span>
                </div>
                <div className="detail-item">
                  <label>상태</label>
                  <span className={`badge ${getStatusBadge(selectedProduct.status)}`}>
                    {selectedProduct.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>등록일</label>
                  <span>{selectedProduct.submittedDate}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>상품 설명</h3>
              <p>{selectedProduct.description}</p>
            </div>

            {selectedProduct.rejectionReason && (
              <div className="detail-section">
                <h3>반려 사유</h3>
                <div className="alert alert-danger">
                  {selectedProduct.rejectionReason}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="modal-actions">
          {selectedProduct && selectedProduct.status === '승인대기' && (
            <>
              <button 
                className="btn btn-success"
                onClick={() => {
                  handleStatusChange(selectedProduct.id, '승인됨');
                  setShowDetailModal(false);
                }}
              >
                <CheckCircle size={16} />
                승인
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  const reason = prompt('반려 사유를 입력하세요:');
                  if (reason) {
                    handleStatusChange(selectedProduct.id, '승인거부', reason);
                    setShowDetailModal(false);
                  }
                }}
              >
                <XCircle size={16} />
                반려
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
            닫기
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductApproval;
