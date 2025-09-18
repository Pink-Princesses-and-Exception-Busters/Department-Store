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
import Modal from '../../shared/components/Modal';

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
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    soldoutProducts: 0,
    hiddenProducts: 0,
    totalBrands: 0,
    totalStock: 0,
    totalSales: 0
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, status: 'forsale', stock: 0 });

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

  // 상품 통계 데이터 로드
  const loadProductStats = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('status, brand, stock, sales, price');

      if (error) throw error;

      // 통계 계산
      const stats = {
        totalProducts: data?.length || 0,
        activeProducts: data?.filter(p => p.status === 'forsale').length || 0,
        soldoutProducts: data?.filter(p => p.status === 'soldout').length || 0,
        hiddenProducts: data?.filter(p => p.status === 'hidden').length || 0,
        totalBrands: new Set(data?.map(p => p.brand)).size || 0,
        totalStock: data?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0,
        totalSales: data?.reduce((sum, p) => sum + (p.sales || 0), 0) || 0
      };

      setProductStats(stats);
      return stats;
    } catch (err) {
      console.error('상품 통계 로드 오류:', err);
      return productStats; // 기존 상태 유지
    }
  };

  // 모든 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 병렬로 카테고리, 상품 데이터, 통계 로드
      await Promise.all([
        loadCategories(),
        loadProducts(),
        loadProductStats()
      ]);
      
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상세보기/수정/삭제 핸들러
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setEditMode(false);
    setEditForm({
      name: product.name || '',
      price: product.price || 0,
      status: product.status || 'forsale',
      stock: product.stock || 0
    });
    setShowDetailModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setEditMode(true);
    setEditForm({
      name: product.name || '',
      price: product.price || 0,
      status: product.status || 'forsale',
      stock: product.stock || 0
    });
    setShowDetailModal(true);
  };

  const handleDeleteProduct = async (product) => {
    const confirmDelete = window.confirm(`정말로 상품 [${product.name}]을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);
      if (error) throw error;

      await loadData();
      alert('상품이 삭제되었습니다.');
    } catch (err) {
      console.error('상품 삭제 오류:', err);
      alert('상품 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editForm.name,
          price: Number(editForm.price) || 0,
          status: editForm.status,
          stock: Number(editForm.stock) || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id);
      if (error) throw error;

      setShowDetailModal(false);
      await loadData();
      alert('상품 정보가 업데이트되었습니다.');
    } catch (err) {
      console.error('상품 수정 오류:', err);
      alert('상품 수정 중 오류가 발생했습니다.');
    }
  };

  // 상품 관리 메뉴 항목들 (실시간 데이터)
  const menuItems = [
    {
      id: 'products',
      title: '전체 상품',
      description: '등록된 모든 상품 현황',
      icon: Package,
      color: '#007bff',
      path: '#products-section',
      stats: {
        total: productStats.totalProducts,
        active: productStats.activeProducts,
        brands: productStats.totalBrands
      }
    },
    {
      id: 'inventory',
      title: '재고 관리',
      description: '품절 및 재고 부족 상품 관리',
      icon: AlertCircle,
      color: '#ffc107',
      path: '/inventory-management',
      stats: {
        totalStock: productStats.totalStock,
        soldout: productStats.soldoutProducts,
        lowStock: products.filter(p => p.stock && p.stock <= 10 && p.status !== 'soldout').length,
        totalSales: productStats.totalSales
      }
    },
    {
      id: 'hidden',
      title: '숨김 상품',
      description: '비활성화된 상품 관리',
      icon: Eye,
      color: '#6c757d',
      path: '/hidden-products',
      stats: {
        hidden: productStats.hiddenProducts,
        needsReview: productStats.hiddenProducts
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
    if (item.id === 'products') {
      // 전체상품 카드 클릭 시 전체 상품 보기
      setSelectedStatus('all');
      setSelectedCategory('all');
      setSearchTerm('');
      setTimeout(() => {
        const productListElement = document.querySelector('.product-list-section');
        if (productListElement) {
          productListElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else if (item.id === 'hidden') {
      // 숨김 상품 카드 클릭 시 필터를 숨김 상품으로 설정
      setSelectedStatus('hidden');
      // 페이지 하단의 상품 목록으로 스크롤
      setTimeout(() => {
        const productListElement = document.querySelector('.product-list-section');
        if (productListElement) {
          productListElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else if (item.id === 'inventory') {
      // 재고 관리 카드 클릭 시 재고 부족 상품 필터 (품절 + 재고 10개 이하)
      setSelectedStatus('low-stock');
      setTimeout(() => {
        const productListElement = document.querySelector('.product-list-section');
        if (productListElement) {
          productListElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id?.toString().includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category_id?.toString() === selectedCategory;
    
    let matchesStatus;
    if (selectedStatus === 'all') {
      matchesStatus = true;
    } else if (selectedStatus === 'low-stock') {
      // 재고 부족: 품절이거나 재고가 10개 이하인 상품
      matchesStatus = product.status === 'soldout' || (product.stock && product.stock <= 10);
    } else {
      matchesStatus = product.status === selectedStatus;
    }
    
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

  // 통계 계산 (실시간 데이터 사용)
  const stats = {
    totalProducts: productStats.totalProducts,
    activeProducts: productStats.activeProducts,
    soldoutProducts: productStats.soldoutProducts,
    hiddenProducts: productStats.hiddenProducts,
    totalBrands: productStats.totalBrands,
    totalStock: productStats.totalStock,
    totalSales: productStats.totalSales
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
          <div className="stat-icon" style={{ background: '#007bff' }}>
            <Package size={20} />
          </div>
          <div className="stat-content">
            <h3>전체 상품</h3>
            <p className="stat-value">{stats.totalProducts.toLocaleString()}건</p>
            <p className="stat-change">{stats.totalBrands}개 브랜드</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#28a745' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>판매 중</h3>
            <p className="stat-value">{stats.activeProducts.toLocaleString()}건</p>
            <p className="stat-change">{stats.totalProducts > 0 ? ((stats.activeProducts / stats.totalProducts) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffc107' }}>
            <AlertCircle size={20} />
          </div>
          <div className="stat-content">
            <h3>총 재고</h3>
            <p className="stat-value">{stats.totalStock.toLocaleString()}개</p>
            <p className="stat-change">{stats.soldoutProducts}건 품절</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dc3545' }}>
            <Eye size={20} />
          </div>
          <div className="stat-content">
            <h3>총 판매량</h3>
            <p className="stat-value">{stats.totalSales.toLocaleString()}개</p>
            <p className="stat-change">{stats.hiddenProducts}건 숨김</p>
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
                {item.id === 'products' && (
                  <>
                    <span className="stat-item">
                      <Package size={14} />
                      전체: {item.stats.total.toLocaleString()}
                    </span>
                    <span className="stat-item">
                      <CheckCircle size={14} />
                      활성: {item.stats.active.toLocaleString()}
                    </span>
                    <span className="stat-item">
                      브랜드: {item.stats.brands}개
                    </span>
                  </>
                )}
                {item.id === 'inventory' && (
                  <>
                    <span className="stat-item">
                      <AlertCircle size={14} />
                      품절: {item.stats.soldout}건
                    </span>
                    <span className="stat-item">
                      <Package size={14} />
                      재고부족: {item.stats.lowStock}건
                    </span>
                    <span className="stat-item">
                      총재고: {item.stats.totalStock.toLocaleString()}개
                    </span>
                  </>
                )}
                {item.id === 'hidden' && (
                  <>
                    <span className="stat-item">
                      <Eye size={14} />
                      숨김: {item.stats.hidden}건
                    </span>
                    <span className="stat-item">
                      검토 필요: {item.stats.needsReview}건
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 전체 상품 목록 */}
      <div className="card product-list-section">
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
              <option value="low-stock">재고 부족</option>
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
                          onClick={() => handleViewProduct(product)}
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
                          onClick={() => handleEditProduct(product)}
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
                          onClick={() => handleDeleteProduct(product)}
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

      {/* 상세/수정 모달 */}
      <Modal 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={editMode ? '상품 정보 수정' : '상품 상세 보기'}
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-4">
            {!editMode ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div 
                    style={{
                      width: '120px',
                      height: '120px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    {selectedProduct.image_urls && selectedProduct.image_urls.length > 0 ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img
                          src={selectedProduct.image_urls[0]}
                          alt={selectedProduct.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(selectedProduct.image_urls[0], '_blank')}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        {selectedProduct.image_urls.length > 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            +{selectedProduct.image_urls.length - 1}
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div style={{ 
                      display: (selectedProduct.image_urls && selectedProduct.image_urls.length > 0) ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      <Package size={32} color="#666" />
                    </div>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{selectedProduct.name}</h3>
                    <span className={`badge ${getProductStatusBadge(selectedProduct.status)}`}>
                      {getProductStatusText(selectedProduct.status)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      상품 ID
                    </label>
                    <p style={{ margin: 0 }}>{selectedProduct.id}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      브랜드
                    </label>
                    <p style={{ margin: 0 }}>{selectedProduct.brand || '-'}</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      카테고리
                    </label>
                    <p style={{ margin: 0 }}>{getCategoryName(selectedProduct.category_id)}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      가격
                    </label>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                      ₩{(selectedProduct.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      재고
                    </label>
                    <p style={{ 
                      margin: 0, 
                      fontWeight: '600',
                      color: selectedProduct.stock === 0 ? '#dc3545' : selectedProduct.stock < 50 ? '#ffc107' : '#28a745'
                    }}>
                      {selectedProduct.stock || 0}개
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      판매량
                    </label>
                    <p style={{ margin: 0, fontWeight: '600' }}>{selectedProduct.sales || 0}개</p>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      상품 설명
                    </label>
                    <p style={{ margin: 0, lineHeight: '1.5' }}>{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.image_urls && selectedProduct.image_urls.length > 1 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                      추가 이미지들 ({selectedProduct.image_urls.length - 1}개)
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                      gap: '8px'
                    }}>
                      {selectedProduct.image_urls.slice(1).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${selectedProduct.name} ${index + 2}`}
                          style={{
                            width: '100%',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1px solid #e9ecef'
                          }}
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setEditMode(true)}
                  >
                    수정
                  </button>
                  <button 
                    className="btn" 
                    style={{ background: '#6c757d', color: 'white' }}
                    onClick={() => setShowDetailModal(false)}
                  >
                    닫기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>상품명</span>
                    <input 
                      type="text" 
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>가격(원)</span>
                    <input 
                      type="number" 
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>상태</span>
                    <select 
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px' }}
                    >
                      <option value="forsale">판매중</option>
                      <option value="soldout">품절</option>
                      <option value="hidden">숨김</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>재고(개)</span>
                    <input 
                      type="number" 
                      value={editForm.stock}
                      onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                      style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px' }}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button 
                    className="btn"
                    style={{ background: '#111827', color: 'white', border: 'none', padding: '0.5rem 0.75rem' }}
                    onClick={() => setEditMode(false)}
                  >
                    취소
                  </button>
                  <button 
                    className="btn"
                    style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 0.75rem' }}
                    onClick={handleSaveEdit}
                  >
                    저장
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductManagement;
