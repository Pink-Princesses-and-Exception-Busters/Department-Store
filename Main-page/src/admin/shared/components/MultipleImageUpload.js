import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, Move, Trash2 } from 'lucide-react';
import { uploadMultipleProductImages, deleteProductImage } from '../lib/supabase';

const MultipleImageUpload = ({ 
  productId, 
  currentImageUrls = [], 
  onImagesUpload, 
  onImagesDelete,
  disabled = false,
  maxImages = 10,
  mode = 'append' // 'append' (기본, 기존 이미지에 추가) 또는 'replace' (새 이미지로 교체)
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState(currentImageUrls);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const uploadingRef = useRef(false); // 중복 업로드 방지



  // 파일 검증 함수
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return '파일 크기는 5MB 이하여야 합니다.';
    }

    if (!allowedTypes.includes(file.type)) {
      return '지원되는 이미지 형식: JPG, PNG, WebP';
    }

    return null;
  };

  // 파일 업로드 처리
  const handleFilesUpload = useCallback(async (files) => {
    console.log('🔄 MultipleImageUpload - handleFilesUpload 시작:', {
      filesCount: files?.length,
      currentImageUrls: imageUrls.length,
      mode: mode,
      productId: productId,
      isAlreadyUploading: uploadingRef.current
    });

    if (!files || files.length === 0) return;
    
    // 중복 업로드 방지
    if (uploadingRef.current) {
      console.warn('⚠️ 이미 업로드 중입니다. 중복 호출 무시.');
      return;
    }

    // 최대 이미지 개수 확인
    const currentImageCount = mode === 'replace' ? 0 : imageUrls.length;
    if (currentImageCount + files.length > maxImages) {
      setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
      return;
    }

    // 파일 검증
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(0);
    uploadingRef.current = true; // 업로드 시작 플래그

    try {
      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 임시 URL 생성 (실제 업로드는 하지 않음)
      const tempUrls = Array.from(files).map(file => URL.createObjectURL(file));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // 모드에 따라 이미지 처리
      const newImageUrls = mode === 'replace' 
        ? tempUrls  // 교체 모드: 새 이미지로 완전 교체
        : [...imageUrls, ...tempUrls]; // 추가 모드: 기존 이미지에 추가
      
      console.log('📸 이미지 URL 업데이트:', {
        mode: mode,
        기존이미지수: imageUrls.length,
        새이미지수: tempUrls.length,
        최종이미지수: newImageUrls.length,
        기존URLs: imageUrls,
        새URLs: tempUrls,
        최종URLs: newImageUrls
      });
      
      setImageUrls(newImageUrls);
      onImagesUpload && onImagesUpload(newImageUrls, [], files);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        uploadingRef.current = false; // 업로드 완료 플래그
      }, 500);

    } catch (error) {
      console.error('업로드 오류:', error);
      setError(error.message || '이미지 업로드에 실패했습니다.');
      setIsUploading(false);
      setUploadProgress(0);
      uploadingRef.current = false; // 에러 시에도 플래그 해제
    }
  }, [productId, imageUrls, maxImages, onImagesUpload, mode]);

  // 이미지 삭제 처리
  const handleImageDelete = async (index) => {
    if (index < 0 || index >= imageUrls.length) return;

    if (window.confirm('이미지를 삭제하시겠습니까?')) {
      try {
        const imageUrl = imageUrls[index];
        console.log('🗑️ 삭제할 이미지:', { index, imageUrl });
        
        // Storage에서 이미지 삭제 (URL에서 파일 경로 추출)
        if (imageUrl && !imageUrl.startsWith('blob:')) {
          const urlParts = imageUrl.split('/');
          const filePath = urlParts.slice(-3).join('/'); // products/{id}/{filename}
          console.log('📁 파일 경로:', filePath);
          
          const result = await deleteProductImage(filePath);
          if (!result.success) {
            console.warn('⚠️ Storage 삭제 실패:', result.error);
            // Storage 삭제 실패해도 계속 진행 (UI에서는 제거)
          }
        }
        
        // UI에서 이미지 제거
        const newImageUrls = imageUrls.filter((_, i) => i !== index);
        setImageUrls(newImageUrls);
        onImagesDelete && onImagesDelete(newImageUrls);
        
        console.log('✅ 이미지 삭제 완료:', { newImageUrls });
        
      } catch (error) {
        console.error('삭제 오류:', error);
        setError('이미지 삭제에 실패했습니다.');
      }
    }
  };

  // 이미지 순서 변경
  const moveImage = (fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= imageUrls.length || 
        toIndex < 0 || toIndex >= imageUrls.length) return;

    const newImageUrls = [...imageUrls];
    const [movedImage] = newImageUrls.splice(fromIndex, 1);
    newImageUrls.splice(toIndex, 0, movedImage);
    
    setImageUrls(newImageUrls);
    // 순서 변경 시에는 기존 파일 객체들을 유지
    onImagesUpload && onImagesUpload(newImageUrls, [], []);
  };

  // 드래그 이벤트 처리
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  }, [disabled, isUploading, handleFilesUpload]);

  // 파일 선택 처리
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    console.log('📁 파일 선택 이벤트:', { files: files.length, target: e.target });
    
    if (files.length > 0) {
      handleFilesUpload(files);
      // 같은 파일을 다시 선택할 수 있도록 value 초기화
      e.target.value = '';
    }
  };

  // 파일 선택 버튼 클릭
  const handleUploadClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 에러 메시지 */}
      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {/* 이미지 목록 */}
      {imageUrls.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {imageUrls.map((url, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '100%', // 1:1 비율
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #ddd'
                }}>
                                                         <img
                      src={url}
                      alt={`상품 이미지 ${index + 1}`}
                     style={{
                       position: 'absolute',
                       top: 0,
                       left: 0,
                       width: '100%',
                       height: '100%',
                       objectFit: 'cover'
                     }}
                   />
                  
                  {/* 썸네일 표시 (첫 번째 이미지) */}
                  {index === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: '#007bff',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      썸네일
                    </div>
                  )}

                  {/* 순서 표시 */}
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
                    {index + 1}
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleImageDelete(index)}
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      background: 'rgba(220, 53, 69, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="이미지 삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* 순서 변경 버튼들 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '4px'
                }}>
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                      title="위로 이동"
                    >
                      ↑
                    </button>
                  )}
                  {index < imageUrls.length - 1 && (
                    <button
                      onClick={() => moveImage(index, index + 1)}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                      title="아래로 이동"
                    >
                      ↓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미지 업로드 영역 */}
      {imageUrls.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          style={{
            border: `2px dashed ${isDragging ? '#007bff' : '#ddd'}`,
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: (disabled || isUploading) ? 'not-allowed' : 'pointer',
            background: isDragging ? '#f8f9ff' : '#fafafa',
            transition: 'all 0.2s ease',
            position: 'relative',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* 업로드 중 표시 */}
          {isUploading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
              <div style={{ marginBottom: '0.5rem' }}>업로드 중...</div>
              <div style={{
                width: '200px',
                height: '4px',
                background: '#eee',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: '#007bff',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {uploadProgress}%
              </div>
            </div>
          )}

          {/* 업로드 아이콘 */}
          <div style={{
            width: '48px',
            height: '48px',
            background: '#f0f0f0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            {isDragging ? (
              <Upload size={20} color="#007bff" />
            ) : (
              <ImageIcon size={20} color="#666" />
            )}
          </div>

          {/* 안내 텍스트 */}
          <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
            {isDragging ? '파일을 놓아주세요' : '이미지를 추가하세요'}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            클릭하거나 파일을 드래그해서 업로드
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>
            JPG, PNG, WebP 형식 • 최대 5MB • {imageUrls.length}/{maxImages}개
          </div>
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />
    </div>
  );
};

export default MultipleImageUpload;
