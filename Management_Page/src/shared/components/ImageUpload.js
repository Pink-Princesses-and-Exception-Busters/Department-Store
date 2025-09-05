import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadProductImage, deleteProductImage } from '../lib/supabase';

const ImageUpload = ({ 
  productId, 
  currentImageUrl, 
  onImageUpload, 
  onImageDelete,
  disabled = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    // 파일 검증
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      // 업로드 진행률 시뮬레이션 (실제 Supabase는 진행률 API 미제공)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Supabase에 업로드
      const result = await uploadProductImage(file, productId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setPreviewUrl(result.url);
        onImageUpload && onImageUpload(result.url, result.path, file);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('업로드 오류:', error);
      setError(error.message || '이미지 업로드에 실패했습니다.');
      setPreviewUrl(currentImageUrl || '');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [productId, currentImageUrl, onImageUpload]);

  // 이미지 삭제 처리
  const handleImageDelete = async () => {
    if (!currentImageUrl) return;

    if (window.confirm('이미지를 삭제하시겠습니까?')) {
      try {
        // 파일 경로 추출 (URL에서)
        const urlParts = currentImageUrl.split('/');
        const filePath = urlParts.slice(-3).join('/'); // products/{id}/{filename}
        
        const result = await deleteProductImage(filePath);
        
        if (result.success) {
          setPreviewUrl('');
          onImageDelete && onImageDelete();
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('삭제 오류:', error);
        setError('이미지 삭제에 실패했습니다.');
      }
    }
  };

  // 드래그 이벤트 처리
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [disabled, handleFileUpload]);

  // 파일 선택 처리
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 파일 선택 버튼 클릭
  const handleUploadClick = () => {
    if (!disabled) {
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

      {/* 이미지 업로드 영역 */}
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
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragging ? '#f8f9ff' : previewUrl ? '#f8f9fa' : '#fafafa',
          transition: 'all 0.2s ease',
          position: 'relative',
          minHeight: '200px',
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

        {/* 이미지 미리보기 */}
        {previewUrl && !isUploading ? (
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <img
              src={previewUrl}
              alt="상품 이미지 미리보기"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
            {/* 삭제 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleImageDelete();
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(220, 53, 69, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="이미지 삭제"
            >
              <X size={16} />
            </button>
          </div>
        ) : !isUploading && (
          <>
            {/* 업로드 아이콘 */}
            <div style={{
              width: '64px',
              height: '64px',
              background: '#f0f0f0',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              {isDragging ? (
                <Upload size={24} color="#007bff" />
              ) : (
                <ImageIcon size={24} color="#666" />
              )}
            </div>

            {/* 안내 텍스트 */}
            <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              {isDragging ? '파일을 놓아주세요' : '이미지를 업로드하세요'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              클릭하거나 파일을 드래그해서 업로드
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>
              JPG, PNG, WebP 형식 • 최대 5MB
            </div>
          </>
        )}

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ImageUpload;