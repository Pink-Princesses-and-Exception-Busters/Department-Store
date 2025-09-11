import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  CheckCircle, 
  Settings,
  ArrowRight,
  Clock,
  AlertCircle,
  Eye,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Plus,
  Loader,
  Image
} from 'lucide-react';
import { supabase, getProducts } from '../../shared/lib/supabase';

const ProductManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState(new Map());
  const [categoryHierarchyMap, setCategoryHierarchyMap] = useState(new Map());

  // 상품 데이터 및 카테고리 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 카테고리 데이터 로드
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, level, parent_id')
        .order('level', { ascending: true });

      if (error) {
        console.error('카테고리 로드 오류:', error);
        return;
      }

      // 카테고리 맵 생성 (ID -> 이름)
      const catMap = new Map();
      const hierarchyMap = new Map();
      
      data?.forEach(category => {
        catMap.set(category.id, category.name);
      });
      
      // 계층 구조 맵 생성 (ID -> 전체 경로)
      data?.forEach(category => {
        let fullPath = category.name;
        let currentCategory = category;
        
        // 부모 카테고리들을 따라 올라가면서 전체 경로 구성
        while (currentCategory.parent_id) {
          const parentCategory = data.find(cat => cat.id === currentCategory.parent_id);
          if (parentCategory) {
            fullPath = `${parentCategory.name} > ${fullPath}`;
            currentCategory = parentCategory;
          } else {
            break;
          }
        }
        
        hierarchyMap.set(category.id, fullPath);
      });
      
      setCategoryMap(catMap);
      setCategoryHierarchyMap(hierarchyMap);

      return data || [];
    } catch (err) {
      console.error('카테고리 로드 중 오류:', err);
      return [];
    }
  };

  const loadProducts = async () => {
    try {
      const result = await getProducts();
      
      if (result.success) {
        setProducts(result.data || []);
        
        // 카테고리 목록 추출
        const uniqueCategories = [...new Set(result.data.map(product => product.category_id))];
        setCategories(['all', ...uniqueCategories]);
      } else {
        setError(result.error || '상품 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('상품 로드 오류:', err);
      setError('상품 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 모든 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 병렬로 카테고리와 상품 데이터 로드
      await Promise.all([
        loadCategories(),
        loadProducts()
      ]);
      
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상품 관리 메뉴 항목들
  const menuItems = [
    {
      id: 'approval',
      title: '상품 승인',
      description: '입점사가 등록한 상품의 승인/반려 처리',
      icon: CheckCircle,
      color: '#28a745',
      path: '/product-approval',
      stats: {
        pending: 23,
        approved: 156,
        rejected: 8
      }
    },
    {
      id: 'settings',
      title: '승인 정책',
      description: '상품 승인 기준 및 정책 설정',
      icon: Settings,
      color: '#6c757d',
      path: '/product-settings',
      stats: {
        activePolicies: 12,
        lastUpdated: '2024-01-15'
      }
    }
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      'success': 'badge-success',
      'danger': 'badge-danger',
      'warning': 'badge-warning'
    };
    return statusMap[status] || 'badge-info';
  };

  const getProductStatusBadge = (status) => {
    const statusMap = {
      'forsale': 'badge-success',
      'soldout': 'badge-secondary',
      'hidden': 'badge-warning'
    };
    return statusMap[status] || 'badge-secondary';
  };

  const getProductStatusText = (status) => {
    const statusMap = {
      'forsale': '판매중',
      'soldout': '품절',
      'hidden': '숨김'
    };
    return statusMap[status] || status;
  };

  // 카테고리 ID를 카테고리명으로 변환
  const getCategoryName = (categoryId) => {
    return categoryMap.get(categoryId) || `카테고리 ${categoryId}`;
  };

  // 카테고리 ID를 계층 구조 경로로 변환
  const getCategoryHierarchy = (categoryId) => {
    return categoryHierarchyMap.get(categoryId) || getCategoryName(categoryId);
  };

  const handleMenuClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id?.toString().includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category_id?.toString() === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleExport = () => {
    // CSV 내보내기 기능
    const csvContent = [
      ['상품코드', '상품명', '브랜드', '카테고리', '카테고리경로', '카테고리ID', '가격', '상태', '재고', '판매량', '등록일', '최종수정일'].join(','),
      ...filteredProducts.map(product => [
        product.id,
        `"${product.name}"`,
        `"${product.brand || ''}"`,
        `"${getCategoryName(product.category_id)}"`,
        `"${getCategoryHierarchy(product.category_id)}"`,
        product.category_id,
        product.price,
        getProductStatusText(product.status),
        product.stock,
        product.sales,
        product.created_at,
        product.updated_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `전체상품목록_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 통계 계산
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'forsale').length,
    soldoutProducts: products.filter(p => p.status === 'soldout').length,
    hiddenProducts: products.filter(p => p.status === 'hidden').length
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <Package size={24} />
          <h1>상품 관리</h1>
        </div>
        <p className="page-description">
          입점사 상품의 승인, 전체 상품 열람, 정책을 관리합니다.
        </p>
      </div>

      {/* 통계 요약 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffc107' }}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <h3>승인 대기</h3>
            <p className="stat-value">23건</p>
            <p className="stat-change">+5건</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#28a745' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>승인 완료</h3>
            <p className="stat-value">156건</p>
            <p className="stat-change">+12건</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dc3545' }}>
            <AlertCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>반려 건수</h3>
            <p className="stat-value">8건</p>
            <p className="stat-change">-2건</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#007bff' }}>
            <Eye size={20} />
          </div>
          <div className="stat-content">
            <h3>전체 상품</h3>
            <p className="stat-value">{stats.totalProducts}건</p>
            <p className="stat-change">+{stats.activeProducts}건 활성</p>
          </div>
        </div>
      </div>

      {/* 메뉴 카드 */}
      <div className="menu-grid">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className="menu-card"
            onClick={() => handleMenuClick(item)}
          >
            <div className="menu-card-header">
              <div className="menu-icon" style={{ background: item.color }}>
                <item.icon size={24} />
              </div>
              <ArrowRight size={20} className="menu-arrow" />
            </div>
            
            <div className="menu-card-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              
              <div className="menu-stats">
                {item.id === 'approval' && (
                  <>
                    <span className="stat-item">
                      <Clock size={14} />
                      대기: {item.stats.pending}
                    </span>
                    <span className="stat-item">
                      <CheckCircle size={14} />
                      승인: {item.stats.approved}
                    </span>
                  </>
                )}
                {item.id === 'settings' && (
                  <>
                    <span className="stat-item">
                      활성 정책: {item.stats.activePolicies}
                    </span>
                    <span className="stat-item">
                      최근 업데이트: {item.stats.lastUpdated}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 전체 상품 목록 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">전체 상품 목록</h2>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader size={16} className="animate-spin" />
              <span>로딩 중...</span>
            </div>
          )}
        </div>
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            margin: '1rem', 
            background: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '8px',
            color: '#c33'
          }}>
            <strong>오류:</strong> {error}
            <button 
              onClick={loadData}
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
        
        {/* 검색 및 필터 */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
              <Search size={20} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#6b7280' 
              }} />
              <input
                type="text"
                placeholder="상품명, 브랜드, 상품코드로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                minWidth: '150px'
              }}
            >
              <option value="all">전체 카테고리</option>
              {categories.filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>
                  {getCategoryName(category)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                minWidth: '120px'
              }}
            >
              <option value="all">전체 상태</option>
              <option value="forsale">판매중</option>
              <option value="soldout">품절</option>
              <option value="hidden">숨김</option>
            </select>
            
            <button 
              className="btn btn-primary"
              onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              disabled={loading || filteredProducts.length === 0}
            >
              <Download size={16} />
              내보내기
            </button>
          </div>
        </div>
        
        <div className="table-container">
          {loading ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: '#6b7280' 
            }}>
              <Loader size={32} className="animate-spin" style={{ marginBottom: '1rem' }} />
              <p>상품 데이터를 불러오는 중...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: '#6b7280' 
            }}>
              <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>검색 조건에 맞는 상품이 없습니다.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>상품코드</th>
                  <th>상품명</th>
                  <th>브랜드</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>상태</th>
                  <th>재고</th>
                  <th>판매량</th>
                  <th>등록일</th>
                  <th>최종수정일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <img 
                          src={product.image_urls[0]} 
                          alt={product.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e5e7eb'
                        }}>
                          <Image size={20} color="#9ca3af" />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600', color: '#007bff' }}>{product.id}</td>
                    <td style={{ fontWeight: '600' }}>{product.name}</td>
                    <td>{product.brand || '-'}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div 
                          style={{ 
                            fontWeight: '600', 
                            color: '#374151',
                            marginBottom: '2px'
                          }}
                        >
                          {getCategoryName(product.category_id)}
                        </div>
                        <div 
                          style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}
                          title={`카테고리 ID: ${product.category_id}`}
                        >
                          {getCategoryHierarchy(product.category_id)}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>₩{product.price?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getProductStatusBadge(product.status)}`}>
                        {getProductStatusText(product.status)}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: product.stock > 10 ? '#28a745' : product.stock > 0 ? '#ffc107' : '#dc3545',
                        fontWeight: '600'
                      }}>
                        {product.stock}개
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{product.sales || 0}</td>
                    <td>{new Date(product.created_at).toLocaleDateString()}</td>
                    <td>{new Date(product.updated_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-sm"
                          style={{ 
                            background: '#007bff', 
                            color: 'white', 
                            border: 'none',
                            padding: '0.25rem 0.5rem'
                          }}
                          title="상세보기"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-sm"
                          style={{ 
                            background: '#28a745', 
                            color: 'white', 
                            border: 'none',
                            padding: '0.25rem 0.5rem'
                          }}
                          title="수정"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-sm"
                          style={{ 
                            background: '#dc3545', 
                            color: 'white', 
                            border: 'none',
                            padding: '0.25rem 0.5rem'
                          }}
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
