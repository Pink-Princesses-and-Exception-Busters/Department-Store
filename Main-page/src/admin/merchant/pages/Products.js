import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  Save,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import ImageUpload from '../../shared/components/ImageUpload';
import MultipleImageUpload from '../../shared/components/MultipleImageUpload';
import { supabase, getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, uploadMultipleProductImages, deleteProductImage } from '../../shared/lib/supabase';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // DB에서 가져온 카테고리 데이터
  const [loading, setLoading] = useState(true);
  const [currentUserBrand, setCurrentUserBrand] = useState(''); // 현재 사용자의 브랜드
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [originalProduct, setOriginalProduct] = useState(null); // 원본 상품 데이터 저장
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: null,
    brand: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    image_path: '',
    tempImageFile: null // 임시 이미지 파일 저장용
  });

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadProducts();
    loadCurrentUserBrand();
    loadCategories();
  }, []);

  // 카테고리 데이터 로드
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    }
  };

  // 카테고리 트리 구성 함수
  const buildCategoryTree = (categories) => {
    const categoryMap = {};
    const rootCategories = [];

    // 카테고리 맵 생성
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // 트리 구조 구성
    categories.forEach(cat => {
      if (cat.parent_id === null) {
        rootCategories.push(categoryMap[cat.id]);
      } else if (categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      }
    });

    return rootCategories;
  };

  // 카테고리 이름 찾기 함수
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '미분류';
  };

  // 현재 사용자의 브랜드 정보 로드
  const loadCurrentUserBrand = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === 'merchant') {
        const userBrand = user?.user_metadata?.name || '';
        setCurrentUserBrand(userBrand);
        console.log('🏷️ 현재 사용자 브랜드:', userBrand);
      }
    } catch (error) {
      console.error('사용자 브랜드 로드 오류:', error);
    }
  };

  // 계층형 카테고리 선택기 컴포넌트
  const CategorySelector = ({ value, onChange, placeholder = "카테고리를 선택하세요" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    
    const categoryTree = buildCategoryTree(categories);
    const selectedCategoryName = getCategoryName(value);

    const toggleCategory = (categoryId) => {
      const newExpanded = new Set(expandedCategories);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      setExpandedCategories(newExpanded);
    };

    const renderCategoryOption = (category, depth = 0) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      
      return (
        <div key={category.id}>
          <div
            style={{
              padding: '0.5rem',
              paddingLeft: `${0.5 + depth * 1.5}rem`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              ':hover': { backgroundColor: '#f8f9fa' }
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {hasChildren && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
                style={{ cursor: 'pointer', width: '16px', textAlign: 'center' }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            {!hasChildren && <span style={{ width: '16px' }}></span>}
            <span
              onClick={() => {
                onChange(category.id);
                setIsOpen(false);
              }}
              style={{ flex: 1 }}
            >
              {category.name}
            </span>
          </div>
          {hasChildren && isExpanded && category.children.map(child => 
            renderCategoryOption(child, depth + 1)
          )}
        </div>
      );
    };

    return (
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ color: value ? '#000' : '#999' }}>
            {value ? selectedCategoryName : placeholder}
          </span>
          <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>
        
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '6px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            {categoryTree.map(category => renderCategoryOption(category))}
          </div>
        )}
      </div>
    );
  };

  // 상품 데이터 로드
  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts();
      if (result.success) {
        console.log('📊 로드된 상품 데이터:', result.data);
        
        // 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 현재 사용자:', user?.email, user?.user_metadata);
        
        let filteredProducts = result.data;
        
        // merchant 역할인 경우 브랜드별 필터링
        if (user?.user_metadata?.role === 'merchant') {
          const userBrand = user?.user_metadata?.name;
          console.log('🏷️ 사용자 브랜드:', userBrand);
          
          filteredProducts = result.data.filter(product => 
            product.brand && product.brand.toLowerCase() === userBrand.toLowerCase()
          );
          
          console.log(`🔍 브랜드 필터링 결과: ${filteredProducts.length}개 상품`);
        }
        
        setProducts(filteredProducts);
        
        // 이미지 URL이 있는 상품들 확인
        const productsWithImages = filteredProducts.filter(p => p.image_url);
        console.log('🖼️ 이미지가 있는 상품:', productsWithImages.length, '개');
      } else {
        console.error('상품 로드 실패:', result.error);
        alert('상품 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('상품 로드 오류:', error);
      alert('상품 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };



  // 상품 관리 함수들
  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.price && newProduct.stock && newProduct.category_id) {
      setLoading(true);
      try {
        // 1단계: 재사용 가능한 가장 작은 ID 가져오기
        console.log('🔍 다음 상품 ID를 가져오는 중...');
        const { data: nextId, error: rpcError } = await supabase.rpc('get_next_product_id');

        if (rpcError) {
          throw new Error(`다음 상품 ID를 가져오는데 실패했습니다: ${rpcError.message}`);
        }
        console.log(`✅ 사용 가능한 다음 ID: ${nextId}`);

        // 2단계: 가져온 ID로 상품 생성 (이미지 없이)
        const productData = {
          id: nextId, // 받아온 ID 명시
          name: newProduct.name,
          category_id: newProduct.category_id || 1,
          price: parseInt(newProduct.price),
          stock: parseInt(newProduct.stock),
          status: 'forsale',
          description: newProduct.description,
          image_urls: [], // 초기에는 빈 배열로 생성
          brand: newProduct.brand || currentUserBrand // 브랜드 정보 추가
        };

        console.log('📦 상품 등록 데이터:', productData);

        const result = await createProduct(productData);
        
        if (result.success) {
          const newProductId = result.data.id;
          console.log('✅ 상품 등록 성공, ID:', newProductId);

                             // 3단계: 임시 이미지 파일들이 있다면 실제 상품 ID로 업로드
        if (newProduct.tempImageFiles && newProduct.tempImageFiles.length > 0) {
          console.log('🔄 다중 이미지를 실제 상품 ID로 업로드 중...');
          
          try {
            const uploadResult = await uploadMultipleProductImages(newProduct.tempImageFiles, newProductId);
            
            if (uploadResult.success) {
              await updateProduct(newProductId, {
                image_urls: uploadResult.urls
              });
              
              console.log('✅ 다중 이미지 업로드 완료:', uploadResult.urls);
            }
          } catch (imageError) {
            console.error('다중 이미지 업로드 실패:', imageError);
          }
        }

          await loadProducts();
          setNewProduct({ 
            name: '', 
            category_id: null, 
            brand: currentUserBrand, // 브랜드 정보 유지
            price: '', 
            stock: '', 
            description: '',
            image_url: '',
            image_path: '',
            tempImageFile: null
          });
          setShowAddModal(false);
          alert('상품이 성공적으로 등록되었습니다.');
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('상품 등록 오류:', error);
        alert('상품 등록에 실패했습니다: ' + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      alert('필수 정보를 모두 입력해주세요.');
    }
  };

  // 새 상품 등록 모달 열기
  const openAddModal = () => {
    setNewProduct({
      name: '',
      category: '전자제품',
      brand: currentUserBrand, // 현재 사용자의 브랜드로 초기화
      price: '',
      stock: '',
      description: '',
      image_url: '',
      image_path: '',
      tempImageFile: null
    });
    setShowAddModal(true);
  };

       // 다중 이미지 업로드 처리 (신규 상품)
  const handleNewProductImagesUpload = (imageUrls, imagePaths, files) => {
    console.log('🖼️ Products.js - handleNewProductImagesUpload 호출:', { 
      imageUrls, 
      imagePaths, 
      fileCount: files?.length,
      totalImageUrls: imageUrls.length,
      isTempUrls: imageUrls.some(url => url.startsWith('blob:')),
      현재newProduct상태: newProduct.image_urls?.length || 0
    });
    
    setNewProduct(prev => {
      console.log('📝 newProduct 상태 업데이트:', {
        이전상태: prev.image_urls?.length || 0,
        새상태: imageUrls.length
      });
      return {
        ...prev,
        tempImageFiles: files, // 실제 파일 객체들 저장
        image_urls: imageUrls
      };
    });
  };

  // 다중 이미지 삭제 처리 (신규 상품)
  const handleNewProductImagesDelete = (imageUrls) => {
    console.log('🗑️ 신규 상품 다중 이미지 삭제');
    setNewProduct(prev => ({
      ...prev,
      tempImageFiles: null,
      image_urls: imageUrls || []
    }));
  };

       // 다중 이미지 업로드 처리 (기존 상품 수정)
  const handleEditProductImagesUpload = (imageUrls, imagePaths, files) => {
    console.log('🖼️ 기존 상품 다중 이미지 업로드 (임시 저장):', { 
      imageUrls, 
      imagePaths, 
      fileCount: files?.length,
      totalImageUrls: imageUrls.length 
    });
    
    // blob URL들을 필터링하여 실제 URL만 유지
    const realImageUrls = imageUrls.filter(url => !url.startsWith('blob:'));
    
    // 상태만 업데이트 (데이터베이스에는 저장하지 않음)
    setSelectedProduct(prev => ({
      ...prev,
      tempImageFiles: files,
      image_urls: realImageUrls // blob URL 제외한 실제 URL만 저장
    }));

    console.log('📝 이미지들이 임시로 설정되었습니다 (blob URL 제외). 수정 버튼을 눌러 저장하세요.');
  };

  // 다중 이미지 삭제 처리 (기존 상품 수정)
  const handleEditProductImagesDelete = async (imageUrls) => {
    console.log('🗑️ 기존 상품 다중 이미지 삭제:', { imageUrls });
    
    // 즉시 데이터베이스 업데이트
    if (selectedProduct && selectedProduct.id) {
      try {
        const result = await updateProduct(selectedProduct.id, {
          image_urls: imageUrls || []
        });
        
        if (result.success) {
          // 상태 업데이트
          setSelectedProduct(prev => ({
            ...prev,
            tempImageFiles: null,
            image_urls: imageUrls || []
          }));
          
          // 상품 목록도 업데이트
          setProducts(prev => prev.map(product => 
            product.id === selectedProduct.id 
              ? { ...product, image_urls: imageUrls || [] }
              : product
          ));
          
          console.log('✅ 이미지 삭제 후 데이터베이스 업데이트 완료');
        }
      } catch (error) {
        console.error('❌ 이미지 삭제 후 데이터베이스 업데이트 실패:', error);
      }
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct({ ...product }); // 복사본 생성
    setOriginalProduct({ ...product }); // 원본 저장
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    if (selectedProduct) {
      setLoading(true);
      try {
        console.log('수정할 상품 데이터:', selectedProduct);
        
        // 필수 필드 검증
        if (!selectedProduct.name || !selectedProduct.price || selectedProduct.stock === undefined) {
          throw new Error('필수 정보를 모두 입력해주세요.');
        }

                 const productData = {
           name: selectedProduct.name.trim(),
           category_id: selectedProduct.category_id || 1,
           price: parseInt(selectedProduct.price) || 0,
           stock: parseInt(selectedProduct.stock) || 0,
           status: selectedProduct.status || 'forsale',
           description: selectedProduct.description || '',
           image_urls: selectedProduct.image_urls || [],
           brand: selectedProduct.brand || currentUserBrand // 브랜드 정보 추가
         };

        console.log('전송할 데이터:', productData);

                 console.log('📤 updateProduct 호출:', { productId: selectedProduct.id, productData });
         const result = await updateProduct(selectedProduct.id, productData);
         console.log('📥 updateProduct 결과:', result);
         
                     if (result.success) {
              // 다중 이미지 업로드가 필요한 경우
              if (selectedProduct.tempImageFiles && selectedProduct.tempImageFiles.length > 0) {
                try {
                  const uploadResult = await uploadMultipleProductImages(selectedProduct.tempImageFiles, selectedProduct.id);
                  if (uploadResult.success) {
                    // 기존 실제 이미지 URLs (blob URL 제외)와 새로운 이미지 URLs를 합침
                    const existingRealUrls = (selectedProduct.image_urls || []).filter(url => !url.startsWith('blob:'));
                    const allImageUrls = [...existingRealUrls, ...uploadResult.urls];
                    
                    await updateProduct(selectedProduct.id, {
                      image_urls: allImageUrls
                    });
                    console.log('✅ 다중 이미지 업로드 완료 (blob URL 제외):', allImageUrls);
                  }
                } catch (imageError) {
                  console.error('다중 이미지 업로드 실패:', imageError);
                }
              }
           
                                   // 데이터베이스에서 최신 데이터를 다시 로드
            await loadProducts();
            
            setShowEditModal(false);
            setSelectedProduct(null);
            alert('상품 정보가 수정되었습니다.');
            console.log('✅ 상품 수정 완료 - 데이터베이스에서 새로고침됨');
         } else {
           throw new Error(result.error);
         }
      } catch (error) {
        console.error('상품 수정 오류:', error);
        alert('상품 수정에 실패했습니다: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      setLoading(true);
      try {
        // 1단계: 삭제할 상품의 이미지 정보 가져오기
        const productToDelete = products.find(p => p.id === productId);
        
        // 2단계: 상품 삭제
        const result = await deleteProduct(productId);
        
        if (result.success) {
          // 3단계: 연결된 이미지가 있다면 Storage에서도 삭제
          if (productToDelete?.image_path) {
            console.log('🗑️ 연결된 이미지 삭제 중:', productToDelete.image_path);
            try {
              await deleteProductImage(productToDelete.image_path);
              console.log('✅ 이미지 삭제 완료');
            } catch (imageError) {
              console.error('⚠️ 이미지 삭제 실패 (상품은 삭제됨):', imageError);
              // 이미지 삭제 실패해도 상품은 이미 삭제되었으므로 계속 진행
            }
          }
          
          await loadProducts(); // 상품 목록 새로고침
          alert('상품이 삭제되었습니다.');
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('상품 삭제 오류:', error);
        alert('상품 삭제에 실패했습니다: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

     // 상태 표시 이름 매핑
   const getStatusDisplayName = (status) => {
     const statusMap = {
       'forsale': '판매중',
       'soldout': '품절',
       'hidden': '숨김'
     };
     return statusMap[status] || status;
   };

   // 상태 배지 클래스 매핑
   const getStatusBadge = (status) => {
     const statusMap = {
       'forsale': 'badge-success',
       'soldout': 'badge-danger',
       'hidden': 'badge-warning'
     };
     return statusMap[status] || 'badge-info';
   };

   // 한국어 상태를 ENUM 값으로 변환
   const getStatusEnumValue = (koreanStatus) => {
     const statusMap = {
       '판매중': 'forsale',
       '품절': 'soldout',
       '숨김': 'hidden'
     };
     return statusMap[koreanStatus] || 'forsale';
   };

  // 메뉴 카드 클릭 핸들러
  const handleMenuClick = (cardType) => {
    if (cardType === 'all') {
      // 전체 상품 카드 클릭
      setSelectedStatus('all');
      setSelectedCategory('all');
      setSearchTerm('');
    } else if (cardType === 'forsale') {
      // 판매중 상품 카드 클릭
      setSelectedStatus('forsale');
    } else if (cardType === 'soldout') {
      // 품절 상품 카드 클릭
      setSelectedStatus('soldout');
    } else if (cardType === 'low-stock') {
      // 재고 부족 카드 클릭
      setSelectedStatus('low-stock');
    }
    
    // 상품 목록으로 스크롤
    setTimeout(() => {
      const productListElement = document.querySelector('.product-list-section');
      if (productListElement) {
        productListElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === parseInt(selectedCategory);
    
    let matchesStatus;
    if (selectedStatus === 'all') {
      matchesStatus = true;
    } else if (selectedStatus === 'low-stock') {
      // 재고 부족: 품절이거나 재고가 50개 이하인 상품 (입점사 기준)
      matchesStatus = product.stock === 0 || (product.stock && product.stock < 50);
    } else if (selectedStatus === 'soldout') {
      matchesStatus = product.stock === 0;
    } else {
      matchesStatus = product.status === selectedStatus;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
        <p style={{ color: '#666' }}>상품 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 상단 액션 바 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title">상품 관리</h2>
          <button 
            className="btn btn-primary"
            onClick={openAddModal}
          >
            <Plus size={16} />
            새 상품 등록
          </button>
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
              minWidth: '120px'
            }}
          >
            <option value="all">전체 카테고리</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.875rem',
              minWidth: '120px'
            }}
          >
            <option value="all">전체 상태</option>
            <option value="forsale">판매중</option>
            <option value="soldout">품절</option>
            <option value="low-stock">재고 부족</option>
          </select>

          <button className="btn" style={{ background: '#6c757d', color: 'white' }}>
            <Filter size={16} />
            필터
          </button>
        </div>
      </div>


      {/* 상품 관리 메뉴 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* 전체 상품 카드 */}
        <div 
          className="card" 
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: '1px solid #e9ecef',
            ':hover': { borderColor: '#007bff', transform: 'translateY(-2px)' }
          }}
          onClick={() => handleMenuClick('all')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#007bff';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,123,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e9ecef';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: '#007bff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Package size={24} color="white" />
            </div>
            <ArrowRight size={20} style={{ color: '#6c757d' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#212529' }}>
            전체 상품
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '0.875rem' }}>
            모든 상품 보기 및 관리
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#007bff' }}>
              <Package size={14} />
              총 {products.length}개
            </span>
          </div>
        </div>

        {/* 판매중 상품 카드 */}
        <div 
          className="card" 
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: '1px solid #e9ecef'
          }}
          onClick={() => handleMenuClick('forsale')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#28a745';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(40,167,69,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e9ecef';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: '#28a745', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircle size={24} color="white" />
            </div>
            <ArrowRight size={20} style={{ color: '#6c757d' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#212529' }}>
            판매중 상품
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '0.875rem' }}>
            현재 판매중인 상품 관리
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#28a745' }}>
              <CheckCircle size={14} />
              {products.filter(p => p.status === 'forsale').length}개 판매중
            </span>
          </div>
        </div>

        {/* 품절 상품 카드 */}
        <div 
          className="card" 
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: '1px solid #e9ecef'
          }}
          onClick={() => handleMenuClick('soldout')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#dc3545';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,53,69,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e9ecef';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: '#dc3545', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <AlertCircle size={24} color="white" />
            </div>
            <ArrowRight size={20} style={{ color: '#6c757d' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#212529' }}>
            품절 상품
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '0.875rem' }}>
            재고가 없는 상품 관리
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc3545' }}>
              <AlertCircle size={14} />
              {products.filter(p => p.stock === 0).length}개 품절
            </span>
          </div>
        </div>

        {/* 재고 부족 카드 */}
        <div 
          className="card" 
          style={{ 
            cursor: 'pointer', 
            transition: 'all 0.2s ease',
            border: '1px solid #e9ecef'
          }}
          onClick={() => handleMenuClick('low-stock')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ffc107';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,193,7,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e9ecef';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: '#ffc107', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Package size={24} color="white" />
            </div>
            <ArrowRight size={20} style={{ color: '#6c757d' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#212529' }}>
            재고 부족
          </h3>
          <p style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '0.875rem' }}>
            재고가 부족한 상품 관리
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ffc107' }}>
              <AlertCircle size={14} />
              {products.filter(p => p.stock < 50 && p.stock > 0).length}개 부족
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc3545' }}>
              <Package size={14} />
              {products.filter(p => p.stock === 0).length}개 품절
            </span>
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="card product-list-section">
        <div className="card-header">
          <h3 className="card-title">
            상품 목록 ({filteredProducts.length}개)
          </h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>상품 정보</th>
                <th>브랜드</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>재고</th>
                <th>판매량</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        style={{
                          width: '60px',
                          height: '60px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: '1px solid #e9ecef'
                        }}
                      >
                                                                {product.image_urls && product.image_urls.length > 0 ? (
                                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                            <img
                                              src={product.image_urls[0]}
                                              alt={product.name}
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                              }}
                                              onError={(e) => {
                                                // 이미지 로드 실패 시 기본 아이콘 표시
                                                e.target.style.display = 'none';
                                                if (e.target.nextSibling) {
                                                  e.target.nextSibling.style.display = 'flex';
                                                }
                                              }}
                                            />
                                            {/* 다중 이미지 표시 */}
                                            {product.image_urls.length > 1 && (
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
                                                +{product.image_urls.length - 1}
                                              </div>
                                            )}
                                          </div>
                                        ) : null}
                        <div style={{ 
                          display: (product.image_urls && product.image_urls.length > 0) ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                          <Package size={24} color="#666" />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          ID: {product.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.875rem',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {product.brand || '-'}
                    </span>
                  </td>
                  <td>{getCategoryName(product.category_id)}</td>
                  <td style={{ fontWeight: '600' }}>
                    ₩{product.price.toLocaleString()}
                  </td>
                  <td>
                    <span style={{ 
                      color: product.stock === 0 ? '#dc3545' : product.stock < 50 ? '#ffc107' : '#28a745',
                      fontWeight: '600'
                    }}>
                      {product.stock}개
                    </span>
                  </td>
                  <td>{product.sales}개</td>
                                     <td>
                     <span className={`badge ${getStatusBadge(product.status)}`}>
                       {getStatusDisplayName(product.status)}
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
                        onClick={() => handleViewProduct(product)}
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="수정"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="삭제"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#666' 
          }}>
            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>검색 조건에 맞는 상품이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 상품 등록 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="새 상품 등록"
        size="medium"
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* 상품 이미지 업로드 */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              상품 이미지
            </label>
                                                       <MultipleImageUpload
                                productId={`new-${Date.now()}`}
                                currentImageUrls={newProduct.image_urls || []}
                                onImagesUpload={handleNewProductImagesUpload}
                                onImagesDelete={handleNewProductImagesDelete}
                                maxImages={10}
                                mode="replace"
                              />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              상품명 *
            </label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              placeholder="상품명을 입력하세요"
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
              브랜드
            </label>
            <input
              type="text"
              value={newProduct.brand}
              onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
              placeholder="브랜드명을 입력하세요"
              readOnly={currentUserBrand !== ''} // merchant 역할인 경우 읽기 전용
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: currentUserBrand !== '' ? '#f8f9fa' : 'white', // 읽기 전용일 때 배경색 변경
                cursor: currentUserBrand !== '' ? 'not-allowed' : 'text'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                카테고리 *
              </label>
              <CategorySelector
                value={newProduct.category_id}
                onChange={(categoryId) => setNewProduct({...newProduct, category_id: categoryId})}
                placeholder="카테고리를 선택하세요"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                가격 *
              </label>
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                placeholder="가격을 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              재고 수량 *
            </label>
            <input
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
              placeholder="재고 수량을 입력하세요"
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
              상품 설명
            </label>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              placeholder="상품 설명을 입력하세요"
              rows={3}
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
              onClick={handleAddProduct}
            >
              <Save size={16} />
              등록
            </button>
            <button 
              className="btn" 
              style={{ background: '#6c757d', color: 'white' }}
              onClick={() => setShowAddModal(false)}
            >
              <X size={16} />
              취소
            </button>
          </div>
        </div>
      </Modal>

      {/* 상품 수정 모달 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
                     // 변경사항이 있는지 확인
           const hasChanges = originalProduct && selectedProduct && (
             originalProduct.name !== selectedProduct.name ||
             originalProduct.category_id !== selectedProduct.category_id ||
             originalProduct.brand !== selectedProduct.brand ||
             originalProduct.price !== selectedProduct.price ||
             originalProduct.stock !== selectedProduct.stock ||
             originalProduct.status !== selectedProduct.status ||
             originalProduct.description !== selectedProduct.description ||
             (originalProduct.image_urls && selectedProduct.image_urls && 
              JSON.stringify(originalProduct.image_urls) !== JSON.stringify(selectedProduct.image_urls))
           );

          if (hasChanges) {
            if (window.confirm('변경사항이 있습니다. 저장하지 않고 닫으시겠습니까?')) {
              setShowEditModal(false);
              setSelectedProduct(null);
              setOriginalProduct(null);
            }
          } else {
            setShowEditModal(false);
            setSelectedProduct(null);
            setOriginalProduct(null);
          }
        }}
        title="상품 정보 수정"
        size="medium"
      >
        {selectedProduct && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* 상품 이미지 업로드 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                상품 이미지
              </label>
                                                           <MultipleImageUpload
                                productId={selectedProduct.id}
                                currentImageUrls={selectedProduct.image_urls || []}
                                onImagesUpload={handleEditProductImagesUpload}
                                onImagesDelete={handleEditProductImagesDelete}
                                maxImages={10}
                                mode="append"
                              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                상품명 *
              </label>
              <input
                type="text"
                value={selectedProduct.name}
                onChange={(e) => setSelectedProduct({...selectedProduct, name: e.target.value})}
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
                브랜드
              </label>
              <input
                type="text"
                value={selectedProduct.brand || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, brand: e.target.value})}
                placeholder="브랜드명을 입력하세요"
                readOnly={currentUserBrand !== ''} // merchant 역할인 경우 읽기 전용
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: currentUserBrand !== '' ? '#f8f9fa' : 'white', // 읽기 전용일 때 배경색 변경
                  cursor: currentUserBrand !== '' ? 'not-allowed' : 'text'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  카테고리 *
                </label>
                <CategorySelector
                  value={selectedProduct.category_id}
                  onChange={(categoryId) => setSelectedProduct({...selectedProduct, category_id: categoryId})}
                  placeholder="카테고리를 선택하세요"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  가격 *
                </label>
                <input
                  type="number"
                  value={selectedProduct.price}
                  onChange={(e) => setSelectedProduct({...selectedProduct, price: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  재고 수량 *
                </label>
                <input
                  type="number"
                  value={selectedProduct.stock}
                  onChange={(e) => setSelectedProduct({...selectedProduct, stock: e.target.value})}
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
                  상태
                </label>
                                 <select
                   value={selectedProduct.status}
                   onChange={(e) => setSelectedProduct({...selectedProduct, status: e.target.value})}
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '1px solid #ddd',
                     borderRadius: '6px'
                   }}
                 >
                   <option value="forsale">판매중</option>
                   <option value="soldout">품절</option>
                   <option value="hidden">숨김</option>
                 </select>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                상품 설명
              </label>
              <textarea
                value={selectedProduct.description || ''}
                onChange={(e) => setSelectedProduct({...selectedProduct, description: e.target.value})}
                rows={3}
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
                onClick={handleUpdateProduct}
              >
                <Save size={16} />
                수정
              </button>
              <button 
                className="btn" 
                style={{ background: '#6c757d', color: 'white' }}
                onClick={() => {
                                     // 변경사항이 있는지 확인
                   const hasChanges = originalProduct && selectedProduct && (
                     originalProduct.name !== selectedProduct.name ||
                     originalProduct.category_id !== selectedProduct.category_id ||
                     originalProduct.price !== selectedProduct.price ||
                     originalProduct.stock !== selectedProduct.stock ||
                     originalProduct.status !== selectedProduct.status ||
                     originalProduct.description !== selectedProduct.description ||
                     (originalProduct.image_urls && selectedProduct.image_urls && 
                      JSON.stringify(originalProduct.image_urls) !== JSON.stringify(selectedProduct.image_urls))
                   );

                  if (hasChanges) {
                    if (window.confirm('변경사항이 있습니다. 저장하지 않고 취소하시겠습니까?')) {
                      setShowEditModal(false);
                      setSelectedProduct(null);
                      setOriginalProduct(null);
                    }
                  } else {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    setOriginalProduct(null);
                  }
                }}
              >
                <X size={16} />
                취소
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 상품 상세 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="상품 상세 정보"
        size="medium"
      >
        {selectedProduct && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
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
                         // 이미지 로드 실패 시 기본 아이콘 표시
                         e.target.style.display = 'none';
                         if (e.target.nextSibling) {
                           e.target.nextSibling.style.display = 'flex';
                         }
                       }}
                     />
                    {/* 다중 이미지 표시 */}
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
                 <span className={`badge ${getStatusBadge(selectedProduct.status)}`}>
                   {getStatusDisplayName(selectedProduct.status)}
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
                  ₩{selectedProduct.price.toLocaleString()}
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
                  {selectedProduct.stock}개
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#666' }}>
                  판매량
                </label>
                <p style={{ margin: 0, fontWeight: '600' }}>{selectedProduct.sales}개</p>
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

            {/* 추가 이미지들 */}
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
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditProduct(selectedProduct);
                }}
              >
                <Edit size={16} />
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;