import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { Mail, Lock, User, Phone, MapPin, UserPlus, Loader, Building2, Key } from 'lucide-react';

const MerchantRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    business_number: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name || !formData.business_number || !formData.phone || !formData.address) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // 1) 먼저 중복 데이터 검사
      const { data: existingData, error: checkError } = await supabase
        .from('brand_admins')
        .select('name, business_number, email')
        .or(`name.eq.${formData.name.trim()},business_number.eq.${formData.business_number.trim()},email.eq.${formData.email.trim()}`);

      if (checkError) throw checkError;

      if (existingData && existingData.length > 0) {
        const existing = existingData[0];
        if (existing.name === formData.name.trim()) {
          throw new Error('이미 등록된 브랜드명입니다.');
        } else if (existing.business_number === formData.business_number.trim()) {
          throw new Error('이미 등록된 사업자등록번호입니다.');
        } else if (existing.email === formData.email.trim()) {
          throw new Error('이미 등록된 이메일입니다.');
        }
      }

      // 2) Supabase Auth에 사용자 생성
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: { name: formData.name.trim(), role: 'merchant' }
        }
      });

      if (error) throw new Error(error.message);

      // 3) brand_admins 행 생성 (joined_at은 DB default now())
      const { error: insertError } = await supabase
        .from('brand_admins')
        .insert([{
          name: formData.name.trim(),
          business_number: formData.business_number.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim()
        }]);

      if (insertError) throw insertError;

      setSuccess('입점사 계정이 생성되었습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/admin/login'), 2000);

    } catch (err) {
      console.error('관리자 생성 오류:', err);
      
      // 에러 메시지를 더 구체적으로 처리
      let errorMessage = '관리자 계정 생성에 실패했습니다.';
      
      if (err.message.includes('User already registered')) {
        errorMessage = '이미 등록된 이메일입니다.';
      } else if (err.message.includes('이미 등록된')) {
        errorMessage = err.message; // 우리가 설정한 구체적인 메시지 사용
      } else if (err.message.includes('duplicate key value violates unique constraint')) {
        if (err.message.includes('brand_admins_name_key')) {
          errorMessage = '이미 등록된 브랜드명입니다.';
        } else if (err.message.includes('brand_admins_business_number_key')) {
          errorMessage = '이미 등록된 사업자등록번호입니다.';
        } else if (err.message.includes('brand_admins_email_key')) {
          errorMessage = '이미 등록된 이메일입니다.';
        } else {
          errorMessage = '중복된 정보가 있습니다. 브랜드명, 사업자등록번호, 이메일을 확인해주세요.';
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #343a40 0%, #212529 100%)', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', background: '#495057', color: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '600', color: 'white' }}>브랜드 관리자 등록</h1>
          <p style={{ color: '#ced4da' }}>새 브랜드 계정을 생성합니다.</p>
        </div>

        {error && <div style={{ background: '#dc3545', color: 'white', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>{error}</div>}
        {success && <div style={{ background: '#28a745', color: 'white', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* 브랜드 명 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="브랜드 명" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #6c757d', borderRadius: '6px', background: '#343a40', color: 'white' }} />
            </div>
          </div>
          {/* 사업자등록번호 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input type="text" name="business_number" value={formData.business_number} onChange={handleChange} placeholder="사업자등록번호 (예: 123-45-67890)" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #6c757d', borderRadius: '6px', background: '#343a40', color: 'white' }} />
            </div>
          </div>
          {/* 이메일 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="이메일" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #6c757d', borderRadius: '6px', background: '#343a40', color: 'white' }} />
            </div>
          </div>
          {/* 비밀번호 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="비밀번호 (6자 이상)" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #6c757d', borderRadius: '6px', background: '#343a40', color: 'white' }} />
            </div>
          </div>
          {/* 비밀번호 확인 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="비밀번호 확인" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #6c757d', borderRadius: '6px', background: '#343a40', color: 'white' }} />
            </div>
          </div>
          {/* 대표 전화 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="대표 전화 (예: 02-1234-5678)" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #6c757d', borderRadius: '6px', background: '#343a40', color: 'white' }} />
            </div>
          </div>
          {/* 사업지 주소 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd' }} />
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="사업지 주소" disabled={isSubmitting} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #6c757d', borderRadius: '6px', background: '#343a40', color: 'white' }} />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {isSubmitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> 등록 중...</> : <><UserPlus size={16} /> 관리자 등록</>}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#adb5bd', marginTop: '1.5rem' }}>
            <Link to="/login" style={{ color: '#f8f9fa', textDecoration: 'none' }}>로그인 페이지로 돌아가기</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantRegister;
