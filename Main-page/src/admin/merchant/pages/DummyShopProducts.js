import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Package,
  Loader,
  Star,
  ShoppingCart,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { importDummyJSONProducts } from '../../shared/lib/supabase';

const DummyShopProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const [error, setError] = useState(null);

  // 일괄 삽입 관련 상태
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ step: '', message: '', progress: 0 });
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const PRODUCTS_PER_PAGE = 12;

  // DummyJSON API에서 상품 데이터 가져오기
  const fetchProducts = async (page = 1, category = 'all', search = '') => {
    setLoading(true);
    setError(null);

    try {
      let url = '';
      const skip = (page - 1) * PRODUCTS_PER_PAGE;
      const limit = PRODUCTS_PER_PAGE;

      if (search.trim()) {
        // 검색 API 사용
        url = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`;
      } else if (category !== 'all') {
        // 카테고리별 조회
        url = `https://dummyjson.com/products/category/${encodeURIComponent(category)}?limit=${limit}&skip=${skip}`;
      } else {
        // 전체 상품 조회
        url = `https://dummyjson.com/products?limit=${limit}&skip=${skip}`;
      }

      console.log('🔄 API 호출:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / PRODUCTS_PER_PAGE));

      console.log(`✅ ${data.products?.length || 0}개 상품 로드 완료 (전체: ${data.total}개)`);

    } catch (error) {
      console.error('상품 데이터 로드 실패:', error);
      setError(error.message);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 목록 가져오기
  const fetchCategories = async () => {
    try {
      const response = await fetch('https://dummyjson.com/products/categories');
      if (response.ok) {
        const categoryList = await response.json();
        console.log('📋 카테고리 데이터:', categoryList);

        // 카테고리 데이터가 배열인지 확인하고 문자열만 필터링
        const validCategories = Array.isArray(categoryList)
          ? categoryList.filter(cat => typeof cat === 'string')
          : [];

        setCategories(['all', ...validCategories]);
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      // 기본 카테고리 설정
      setCategories(['all', 'smartphones', 'laptops', 'fragrances', 'skincare', 'groceries']);
    }
  };

  // 상품 상세 정보 가져오기
  const fetchProductDetail = async (productId) => {
    try {
      const response = await fetch(`https://dummyjson.com/products/${productId}`);
      if (response.ok) {
        const product = await response.json();
        return product;
      }
      throw new Error('상품 정보를 찾을 수 없습니다');
    } catch (error) {
      console.error('상품 상세 정보 로드 실패:', error);
      return null;
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchCategories();
  }, []);

  // 페이지, 카테고리, 검색어 변경 시 상품 데이터 로드
  useEffect(() => {
    fetchProducts(currentPage, selectedCategory, searchTerm);
  }, [currentPage, selectedCategory, searchTerm]);

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedCategory]);

  // DummyJSON 상품들을 Supabase에 일괄 삽입
  const handleImportProducts = async () => {
    if (!window.confirm('DummyJSON의 모든 상품을 Supabase에 가져오시겠습니까?\n\n이 작업은 시간이 걸릴 수 있으며, 중복된 상품이 생성될 수 있습니다.')) {
      return;
    }

    setImporting(true);
    setImportProgress({ step: 'start', message: '가져오기 시작...', progress: 0 });
    setImportResult(null);
    setShowImportModal(true);

    try {
      const result = await importDummyJSONProducts((progress) => {
        setImportProgress(progress);
      });

      setImportResult(result);

      if (result.success) {
        console.log('✅ 일괄 삽입 완료:', result.results);
      } else {
        console.error('❌ 일괄 삽입 실패:', result.error);
      }
    } catch (error) {
      console.error('일괄 삽입 오류:', error);
      setImportResult({
        success: false,
        error: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  // 상품 상세보기
  const handleViewProduct = async (product) => {
    const detailProduct = await fetchProductDetail(product.id);
    if (detailProduct) {
      setSelectedProduct(detailProduct);
      setShowDetailModal(true);
    }
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(price * 1300); // USD를 KRW로 대략 변환
  };

  // 할인가 계산
  const getDiscountedPrice = (price, discountPercentage) => {
    return price * (1 - discountPercentage / 100);
  };

  // 별점 렌더링
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} fill="#ffc107" color="#ffc107" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={14} fill="#ffc107" color="#ffc107" style={{ opacity: 0.5 }} />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={14} color="#ddd" />);
    }

    return stars;
  };

  // 카테고리명 포맷팅 (한국어 매핑)
  const formatCategoryName = (category) => {
    if (category === 'all') return '전체';

    // category가 문자열이 아닌 경우 처리
    if (typeof category !== 'string') {
      console.warn('카테고리가 문자열이 아닙니다:', category);
      return String(category);
    }

    // 영어 카테고리를 한국어로 매핑
    const categoryMap = {
      // 전자제품
      'smartphones': '전자제품',
      'laptops': '전자제품',
      'tablets': '전자제품',
      'electronics': '전자제품',
      'computers': '전자제품',
      'cameras': '전자제품',
      'audio': '전자제품',
      'headphones': '전자제품',
      'wearable-technology': '전자제품',
      'smart-home': '전자제품',

      // 뷰티/화장품
      'fragrances': '뷰티',
      'skincare': '뷰티',
      'beauty': '뷰티',

      // 식품
      'groceries': '식품',

      // 주방/생활용품
      'kitchen-accessories': '주방용품',

      // 홈데코/가구
      'home-decoration': '홈데코',
      'furniture': '가구',
      'lighting': '조명',

      // 의류
      'tops': '의류',
      'womens-dresses': '의류',
      'mens-shirts': '의류',
      'womens-shirts': '의류',

      // 신발
      'womens-shoes': '신발',
      'mens-shoes': '신발',

      // 액세서리/시계/가방
      'mens-watches': '액세서리',
      'womens-watches': '액세서리',
      'womens-bags': '액세서리',
      'womens-jewellery': '액세서리',
      'sunglasses': '액세서리',

      // 자동차/오토바이
      'automotive': '자동차',
      'motorcycle': '자동차',
      'vehicle': '자동차',

      // 스포츠/레저
      'sports-accessories': '스포츠',
      'fitness': '스포츠',
      'outdoor': '스포츠',

      // 기타
      'office-supplies': '사무용품',
      'books': '도서',
      'toys': '완구',
      'pet-supplies': '반려동물',
      'baby': '유아용품',
      'travel': '여행',
      'health': '건강'
    };

    // 매핑된 한국어 카테고리가 있으면 반환, 없으면 영어를 그대로 포맷팅
    return categoryMap[category.toLowerCase()] ||
      category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  };

  // 로딩 중일 때 표시
  if (loading && products.length === 0) {
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
        <p style={{ color: '#666' }}>DummyJSON 상품 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error && products.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Package size={48} style={{ color: '#dc3545' }} />
        <p style={{ color: '#dc3545' }}>데이터를 불러오는데 실패했습니다: {error}</p>
        <button
          className="btn btn-primary"
          onClick={() => fetchProducts(currentPage, selectedCategory, searchTerm)}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 상단 헤더 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 className="card-title">DummyJSON 상품 카탈로그</h2>
            <p style={{ color: '#666', margin: 0 }}>
              실제 API 데이터를 활용한 상품 정보 조회 ({totalProducts}개 상품)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleImportProducts}
              disabled={importing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {importing ? (
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <ShoppingCart size={16} />
              )}
              {importing ? '가져오는 중...' : 'Supabase에 일괄 삽입'}
            </button>

            <a
              href="https://dummyjson.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: '#6c757d', color: 'white' }}
            >
              <ExternalLink size={16} />
              DummyJSON 방문
            </a>
          </div>
        </div>

        {/* 검색 및 필터 */}
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
              placeholder="상품명으로 검색..."
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.875rem',
              minWidth: '150px'
            }}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {formatCategoryName(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 상품 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {products.map((product) => (
          <div key={product.id} className="card" style={{ overflow: 'hidden' }}>
            {/* 상품 이미지 */}
            <div style={{
              height: '200px',
              background: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div style={{
                display: product.thumbnail ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}>
                <Package size={48} color="#ccc" />
              </div>

              {/* 할인 배지 */}
              {product.discountPercentage > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: '#dc3545',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  -{Math.round(product.discountPercentage)}%
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {product.brand || formatCategoryName(product.category || 'unknown')}
                </span>
              </div>

              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {product.title}
              </h3>

              {/* 별점 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {renderStars(product.rating)}
                </div>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  ({product.rating})
                </span>
              </div>

              {/* 가격 */}
              <div style={{ marginBottom: '0.75rem' }}>
                {product.discountPercentage > 0 ? (
                  <div>
                    <span style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#dc3545'
                    }}>
                      {formatPrice(getDiscountedPrice(product.price, product.discountPercentage))}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      textDecoration: 'line-through',
                      marginLeft: '0.5rem'
                    }}>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                ) : (
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#007bff'
                  }}>
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  background: '#e9ecef',
                  borderRadius: '12px',
                  color: '#495057'
                }}>
                  {formatCategoryName(product.category || 'unknown')}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: product.stock > 0 ? '#28a745' : '#dc3545'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    재고 {product.stock}개
                  </span>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleViewProduct(product)}
              >
                <Eye size={16} />
                상세보기
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            className="btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{
              background: currentPage === 1 ? '#f8f9fa' : '#007bff',
              color: currentPage === 1 ? '#6c757d' : 'white'
            }}
          >
            <ChevronLeft size={16} />
            이전
          </button>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  className="btn"
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    background: currentPage === pageNum ? '#007bff' : '#f8f9fa',
                    color: currentPage === pageNum ? 'white' : '#495057',
                    minWidth: '40px'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            className="btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            style={{
              background: currentPage === totalPages ? '#f8f9fa' : '#007bff',
              color: currentPage === totalPages ? '#6c757d' : 'white'
            }}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 통계 정보 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#007bff', fontSize: '2rem', marginBottom: '0.5rem' }}>
            {totalProducts}
          </h3>
          <p style={{ color: '#666' }}>총 상품 수</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#28a745', fontSize: '2rem', marginBottom: '0.5rem' }}>
            {products.filter(p => p.stock > 0).length}
          </h3>
          <p style={{ color: '#666' }}>재고 있음</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffc107', fontSize: '2rem', marginBottom: '0.5rem' }}>
            {categories.length - 1}
          </h3>
          <p style={{ color: '#666' }}>카테고리 수</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#6f42c1', fontSize: '2rem', marginBottom: '0.5rem' }}>
            {products.filter(p => p.discountPercentage > 0).length}
          </h3>
          <p style={{ color: '#666' }}>할인 상품</p>
        </div>
      </div>

      {/* 상품 상세 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProduct(null);
        }}
        title="상품 상세 정보"
        size="large"
      >
        {selectedProduct && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* 이미지 갤러리 */}
            <div>
              <div style={{
                height: '400px',
                background: '#f8f9fa',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                {selectedProduct.thumbnail ? (
                  <img
                    src={selectedProduct.thumbnail}
                    alt={selectedProduct.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    <Package size={64} color="#ccc" />
                  </div>
                )}
              </div>

              {/* 추가 이미지들 */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem'
                }}>
                  {selectedProduct.images.slice(1, 5).map((image, index) => (
                    <div key={index} style={{
                      height: '80px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={image}
                        alt={`${selectedProduct.title} ${index + 2}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {selectedProduct.brand || formatCategoryName(selectedProduct.category || 'unknown')}
                </span>
              </div>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                lineHeight: '1.3'
              }}>
                {selectedProduct.title}
              </h2>

              {/* 별점 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {renderStars(selectedProduct.rating)}
                </div>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  ({selectedProduct.rating})
                </span>
              </div>

              {/* 가격 */}
              <div style={{ marginBottom: '1.5rem' }}>
                {selectedProduct.discountPercentage > 0 ? (
                  <div>
                    <span style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: '#dc3545'
                    }}>
                      {formatPrice(getDiscountedPrice(selectedProduct.price, selectedProduct.discountPercentage))}
                    </span>
                    <span style={{
                      fontSize: '1.25rem',
                      color: '#666',
                      textDecoration: 'line-through',
                      marginLeft: '0.5rem'
                    }}>
                      {formatPrice(selectedProduct.price)}
                    </span>
                    <div style={{
                      display: 'inline-block',
                      background: '#dc3545',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginLeft: '0.5rem'
                    }}>
                      {Math.round(selectedProduct.discountPercentage)}% 할인
                    </div>
                  </div>
                ) : (
                  <span style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#007bff'
                  }}>
                    {formatPrice(selectedProduct.price)}
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: '#e9ecef',
                  borderRadius: '20px',
                  fontSize: '0.875rem'
                }}>
                  카테고리: {formatCategoryName(selectedProduct.category || 'unknown')}
                </div>

                <div style={{
                  padding: '0.5rem 1rem',
                  background: selectedProduct.stock > 0 ? '#d4edda' : '#f8d7da',
                  color: selectedProduct.stock > 0 ? '#155724' : '#721c24',
                  borderRadius: '20px',
                  fontSize: '0.875rem'
                }}>
                  재고: {selectedProduct.stock}개
                </div>

                {selectedProduct.brand && (
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#d1ecf1',
                    color: '#0c5460',
                    borderRadius: '20px',
                    fontSize: '0.875rem'
                  }}>
                    브랜드: {selectedProduct.brand}
                  </div>
                )}
              </div>

              {selectedProduct.description && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>상품 설명</h4>
                  <p style={{
                    color: '#666',
                    lineHeight: '1.6',
                    fontSize: '0.875rem'
                  }}>
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>태그</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedProduct.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        color: '#495057'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={selectedProduct.stock === 0}
                >
                  <ShoppingCart size={16} />
                  장바구니 담기
                </button>
                <a
                  href={`https://dummyjson.com/products/${selectedProduct.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: '#6c757d', color: 'white' }}
                >
                  <ExternalLink size={16} />
                  원본 보기
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 일괄 삽입 진행 상황 모달 */}
      <Modal
        isOpen={showImportModal}
        onClose={() => !importing && setShowImportModal(false)}
        title="DummyJSON 상품 가져오기"
        size="medium"
      >
        <div style={{ padding: '1rem 0' }}>
          {/* 진행 상황 표시 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              {importing ? (
                <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: '#007bff' }} />
              ) : importResult?.success ? (
                <Eye size={20} style={{ color: '#28a745' }} />
              ) : importResult && !importResult.success ? (
                <Package size={20} style={{ color: '#dc3545' }} />
              ) : null}

              <span style={{ fontWeight: '600' }}>
                {importProgress.message || '대기 중...'}
              </span>
            </div>

            {/* 진행률 바 */}
            <div style={{
              width: '100%',
              height: '8px',
              background: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${importProgress.progress}%`,
                height: '100%',
                background: importing ? '#007bff' :
                  importResult?.success ? '#28a745' :
                    importResult && !importResult.success ? '#dc3545' : '#007bff',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{
              textAlign: 'right',
              fontSize: '0.875rem',
              color: '#666',
              marginTop: '0.25rem'
            }}>
              {importProgress.progress}%
            </div>
          </div>

          {/* 결과 표시 */}
          {importResult && (
            <div style={{
              padding: '1rem',
              borderRadius: '6px',
              background: importResult.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${importResult.success ? '#c3e6cb' : '#f5c6cb'}`,
              marginBottom: '1rem'
            }}>
              {importResult.success ? (
                <div>
                  <h4 style={{
                    color: '#155724',
                    marginBottom: '0.5rem'
                  }}>
                    가져오기 완료!
                  </h4>
                  <div style={{ color: '#155724', fontSize: '0.875rem' }}>
                    <p>✅ 성공: {importResult.results.success}개 상품</p>
                    {importResult.results.failed > 0 && (
                      <p>❌ 실패: {importResult.results.failed}개 상품</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 style={{
                    color: '#721c24',
                    marginBottom: '0.5rem'
                  }}>
                    가져오기 실패
                  </h4>
                  <p style={{ color: '#721c24', fontSize: '0.875rem' }}>
                    {importResult.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 버튼들 */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {importing ? (
              <button
                className="btn"
                disabled
                style={{ background: '#6c757d', color: 'white' }}
              >
                진행 중...
              </button>
            ) : (
              <>
                {importResult?.success && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowImportModal(false);
                      window.location.href = '/products';
                    }}
                  >
                    상품 관리로 이동
                  </button>
                )}

                <button
                  className="btn"
                  onClick={() => setShowImportModal(false)}
                  style={{ background: '#6c757d', color: 'white' }}
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DummyShopProducts;