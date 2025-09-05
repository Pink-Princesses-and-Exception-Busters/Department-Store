import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, Camera, Loader } from 'lucide-react';

const Profile = () => {
  const { user, error, setError, isAdmin } = useAuth();






  // 로고 업로드 관련 state
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);
  
















  // 로고 업로드 처리
  const handleLogoUpload = async (file) => {
    if (!file) return;
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploadingLogo(true);
    
    try {
      // 파일명 생성 (고유한 이름으로)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.email}_logo_${Date.now()}.${fileExt}`;
      
      // Supabase Storage에 업로드
      const { error } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, file);

      if (error) {
        console.error('로고 업로드 오류:', error);
        alert('로고 업로드에 실패했습니다.');
        return;
      }

      // 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // DB에 로고 URL 저장
      const { error: updateError } = await supabase
        .from('brand_admins')
        .update({ logo_url: publicUrl })
        .eq('email', user.email);

      if (updateError) {
        console.error('로고 URL 저장 오류:', updateError);
        alert('로고 URL 저장에 실패했습니다.');
        return;
      }

      setLogoUrl(publicUrl);
      alert('로고가 성공적으로 업로드되었습니다.');
      
    } catch (error) {
      console.error('로고 업로드 중 오류:', error);
      alert('로고 업로드에 실패했습니다.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  // 로고 클릭 처리
  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };



  const ProfileTab = () => (
    <div className="card">
      {/* 프로필 이미지 및 기본 정보 - 가운데 정렬 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: '120px',
              height: '120px',
              background: logoUrl 
                ? `url(${logoUrl}) center/cover` 
                : 'linear-gradient(135deg, #495057 0%, #343a40 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.2s ease'
            }}
            onClick={handleLogoClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {!logoUrl && <User size={48} color="white" />}
            
            {/* 호버 오버레이 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            >
              {isUploadingLogo ? (
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Camera size={20} style={{ marginBottom: '0.25rem' }} />
                  <div>로고변경</div>
                </div>
              )}
            </div>
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
                     <h3 style={{ margin: '0 0 0.5rem', color: '#333' }}>
             {user?.user_metadata?.name || '사용자'}
           </h3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Mail size={14} color="#666" />
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              {user?.email}
            </span>
          </div>

          {/* 권한 배지 */}
          <div style={{ marginBottom: '1rem' }}>
            <span 
              className={`badge ${isAdmin() ? 'badge-success' : 'badge-info'}`}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.5rem 0.75rem'
              }}
            >
              <Shield size={12} />
              {isAdmin() ? '관리자' : '일반 사용자'}
            </span>
          </div>

          {/* 계정 정보 */}
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#999',
            textAlign: 'left',
            background: '#f8f9fa',
            padding: '0.75rem',
            borderRadius: '6px'
          }}>
            <div style={{ marginBottom: '0.25rem' }}>
              <strong>가입일:</strong> {new Date(user?.created_at).toLocaleDateString('ko-KR')}
            </div>
            <div>
              <strong>마지막 로그인:</strong> {new Date(user?.last_sign_in_at).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );





  return (
    <div>
      {/* 에러 메시지 */}
      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {/* 프로필 컨텐츠 */}
      <ProfileTab />
    </div>
  );
};

export default Profile;