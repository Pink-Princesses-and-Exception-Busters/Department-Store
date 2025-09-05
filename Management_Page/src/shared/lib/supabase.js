import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY;

// 디버깅을 위한 로그
console.log('🔍 환경변수 확인:');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '설정됨' : '미설정');

let supabase;

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase 클라이언트 생성 성공');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  supabase = { /* 더미 클라이언트 */ };
}

export { supabase };

// 기본 인증 함수들
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('로그인 오류:', error);
    return { success: false, error: error.message };
  }
};

export const signUp = async (email, password, userData = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return { success: true, user };
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return { success: false, error: error.message };
  }
};

// 단일 이미지 업로드 함수
export const uploadProductImage = async (file, productId) => {
  try {
    if (!file) throw new Error('파일이 선택되지 않았습니다.');
    if (file.size > 5 * 1024 * 1024) throw new Error('파일 크기는 5MB 이하여야 합니다.');
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) throw new Error('지원되는 이미지 형식: JPG, PNG, WebP');

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `products/${productId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl, path: filePath };
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 다중 이미지 업로드 함수
export const uploadMultipleProductImages = async (files, productId) => {
  try {
    if (!files || files.length === 0) {
      return { success: true, urls: [], paths: [] };
    }

    const uploadPromises = files.map(file => uploadProductImage(file, productId));
    const results = await Promise.all(uploadPromises);

    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);

    if (failedUploads.length > 0) {
      console.warn('일부 이미지 업로드 실패:', failedUploads);
    }

    const urls = successfulUploads.map(result => result.url);
    const paths = successfulUploads.map(result => result.path);

    return { 
      success: true, 
      urls, 
      paths,
      failedCount: failedUploads.length,
      totalCount: files.length
    };
  } catch (error) {
    console.error('다중 이미지 업로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 이미지 삭제 함수
export const deleteProductImage = async (filePath) => {
  try {
    const { error } = await supabase.storage.from('product-images').remove([filePath]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    return { success: false, error: error.message };
  }
};

// 모든 상품 조회
export const getProducts = async () => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('상품 조회 오류:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 상품 생성
export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('상품 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

// 상품 수정
export const updateProduct = async (productId, productData) => {
  try {
    console.log('🔄 상품 수정 시작:', { productId, productData });
    
    // 현재 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 현재 사용자:', { user: user?.email, userError });
    
    const cleanData = {};
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        cleanData[key] = productData[key];
      }
    });

    console.log('🧹 정리된 데이터:', cleanData);

    // 먼저 현재 상품 상태 확인
    const { data: currentProduct, error: selectError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    console.log('📋 현재 상품 상태:', { currentProduct, selectError });

    const { data, error } = await supabase
      .from('products')
      .update(cleanData)
      .eq('id', productId)
      .select()
      .single();

    console.log('📊 Supabase 응답:', { data, error });

    if (error) {
      console.error('❌ Supabase 업데이트 오류:', error);
      throw error;
    }
    
    console.log('✅ 상품 수정 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ 상품 수정 오류:', error);
    return { success: false, error: error.message };
  }
};

// 상품 삭제
export const deleteProduct = async (productId) => {
  try {
    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
    if (deleteError) throw deleteError;
    return { success: true };
  } catch (error) {
    console.error('❌ 상품 삭제 오류:', error);
    return { success: false, error: error.message };
  }
};

// DummyJSON 상품 데이터를 Supabase 형식으로 변환
export const convertDummyJSONProduct = (dummyProduct) => {
  return {
    name: dummyProduct.title,
    price: dummyProduct.price,
    stock: dummyProduct.stock || 0,
    sales: 0, // 초기 판매량은 0
    category_id: dummyProduct.category === 'smartphones' ? 1 : 
                 dummyProduct.category === 'laptops' ? 1 : 
                 dummyProduct.category === 'fragrances' ? 2 : 
                 dummyProduct.category === 'skincare' ? 2 : 
                 dummyProduct.category === 'groceries' ? 3 : 
                 dummyProduct.category === 'home-decoration' ? 4 : 
                 dummyProduct.category === 'furniture' ? 5 : 
                 dummyProduct.category === 'tops' ? 6 : 
                 dummyProduct.category === 'womens-dresses' ? 6 : 
                 dummyProduct.category === 'womens-shoes' ? 7 : 
                 dummyProduct.category === 'mens-shirts' ? 11 : 
                 dummyProduct.category === 'mens-shoes' ? 12 : 
                 dummyProduct.category === 'mens-watches' ? 13 : 
                 dummyProduct.category === 'womens-watches' ? 13 : 
                 dummyProduct.category === 'womens-bags' ? 8 : 
                 dummyProduct.category === 'womens-jewellery' ? 8 : 
                 dummyProduct.category === 'sunglasses' ? 8 : 
                 dummyProduct.category === 'automotive' ? 9 : 
                 dummyProduct.category === 'motorcycle' ? 9 : 
                 dummyProduct.category === 'lighting' ? 10 : 1,
    status: dummyProduct.stock > 0 ? 'forsale' : 'soldout',
    image_urls: dummyProduct.images ? dummyProduct.images : [],
    description: dummyProduct.description || '',
    brand: dummyProduct.brand || 'Unknown', // 브랜드 필드 추가
  };
};

// DummyJSON 상품들을 일괄 삽입
export const importDummyJSONProducts = async (onProgress) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('사용자 인증이 필요합니다.');

    onProgress?.({ step: 'fetch', message: 'DummyJSON에서 상품 데이터를 가져오는 중...', progress: 0 });
    const response = await fetch('https://dummyjson.com/products?limit=194');
    if (!response.ok) throw new Error('DummyJSON API 호출 실패');
    const data = await response.json();
    const dummyProducts = data.products;

    onProgress?.({ step: 'convert', message: `${dummyProducts.length}개 상품 데이터 변환 중...`, progress: 5 });

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < dummyProducts.length; i++) {
      const dummyProduct = dummyProducts[i];
      const progress = Math.round(((i + 1) / dummyProducts.length) * 90) + 5;

      try {
        onProgress?.({ step: 'import', message: `상품 처리 중: ${dummyProduct.title} (${i + 1}/${dummyProducts.length})`, progress });

        const convertedProduct = convertDummyJSONProduct(dummyProduct);

        const { data: insertedProduct, error: insertError } = await supabase
          .from('products')
          .insert([convertedProduct])
          .select()
          .single();

        if (insertError) throw insertError;
        results.success++;
      } catch (error) {
        console.error(`상품 처리 실패 (${dummyProduct.title}):`, error);
        results.failed++;
        results.errors.push({ product: dummyProduct.title, error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 200)); // API 부하 감소
    }

    onProgress?.({ step: 'complete', message: `완료! 성공: ${results.success}개, 실패: ${results.failed}개`, progress: 100 });
    return { success: true, results };
  } catch (error) {
    console.error('DummyJSON 상품 일괄 삽입 오류:', error);
    return { success: false, error: error.message };
  }
};

export default supabase;