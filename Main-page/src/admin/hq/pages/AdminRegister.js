import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { 
  User, 
  Mail, 
  Lock, 
  Building2, 
  Phone, 
  Hash,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield
} from 'lucide-react';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    employeeCode: '',
    department: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 부서 목록
  const departments = [
    '경영지원팀',
    '마케팅팀',
    '영업팀',
    '상품기획팀',
    '고객서비스팀',
    '재무팀',
    'IT팀',
    '인사팀',
    '법무팀',
    '구매팀'
  ];



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // 사원코드는 자동으로 대문자로 변환
    if (name === 'employeeCode') {
      processedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // 입력 시 해당 필드의 에러 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // 사원코드 검증
    const employeeCodeRegex = /^[A-Z0-9]{4,8}$/;
    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = '사원코드를 입력해주세요.';
    } else if (!employeeCodeRegex.test(formData.employeeCode)) {
      newErrors.employeeCode = '사원코드는 4-8자의 영문 대문자와 숫자만 입력 가능합니다.';
    }

    // 부서 검증
    if (!formData.department) {
      newErrors.department = '부서를 선택해주세요.';
    }

    // 연락처 검증
    const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }

    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Supabase Auth에 사용자 등록 (role: admin으로 설정)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'admin', // role을 admin으로 설정
            name: formData.name,
            employee_code: formData.employeeCode,
            department: formData.department
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // 2. hq_admin_users 테이블에 관리자 정보 저장
      const { data: adminData, error: adminError } = await supabase
        .from('hq_admin_users')
        .insert([{
          employee_code: formData.employeeCode, // 사원번호
          name: formData.name, // 이름
          email: formData.email, // 이메일
          phone: formData.phone, // 연락처
          role: formData.department, // 부서 (role 컬럼에 저장)
          auth_user_id: authData.user?.id, // Auth 사용자 ID와 연결
          is_approved: false // 승인 대기 상태
        }]);

      if (adminError) {
        throw adminError;
      }

      alert('관리자 계정이 성공적으로 등록되었습니다!\n바로 로그인하여 사용하실 수 있습니다.');
      navigate('/admin/login');
      
    } catch (error) {
      console.error('관리자 등록 오류:', error);
      
      // 사용자 친화적인 오류 메시지
      let errorMessage = '관리자 등록 중 오류가 발생했습니다.';
      
      if (error.message?.includes('already registered')) {
        errorMessage = '이미 등록된 이메일입니다.';
      } else if (error.message?.includes('invalid email')) {
        errorMessage = '올바르지 않은 이메일 형식입니다.';
      } else if (error.message?.includes('weak password')) {
        errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = '이미 등록된 사원코드입니다.';
      }
      
      alert(errorMessage + '\n다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-register-container">
      <div className="admin-register-card">
        {/* Header */}
        <div className="admin-register-header">
          <button 
            className="back-button"
            onClick={() => navigate('/admin/login')}
          >
            <ArrowLeft size={20} />
            로그인으로 돌아가기
          </button>
          <div className="header-icon">
            <Shield size={48} color="#495057" />
          </div>
          <h1 className="admin-register-title">백화점 본사 관리자 등록</h1>
          <p className="admin-register-subtitle">본사 관리 시스템 관리자 계정을 등록하세요</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-register-form">
          <div className="form-row">
            {/* 이름 */}
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                이름
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="홍길동"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* 사원코드 */}
            <div className="form-group">
              <label className="form-label">
                <Hash size={16} />
                사원코드
              </label>
              <input
                type="text"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleInputChange}
                className={`form-input ${errors.employeeCode ? 'error' : ''}`}
                placeholder="HD2024"
              />
              {errors.employeeCode && <span className="error-message">{errors.employeeCode}</span>}
            </div>
          </div>

          <div className="form-row">
            {/* 부서 */}
            <div className="form-group">
              <label className="form-label">
                <Building2 size={16} />
                부서
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`form-input ${errors.department ? 'error' : ''}`}
              >
                <option value="">부서를 선택하세요</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <span className="error-message">{errors.department}</span>}
            </div>

            {/* 연락처 */}
            <div className="form-group">
              <label className="form-label">
                <Phone size={16} />
                연락처
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="010-1234-5678"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          {/* 이메일 */}
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} />
              이메일 (아이디)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="admin@hyundai.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>



          <div className="form-row">
            {/* 비밀번호 */}
            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                비밀번호
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="비밀번호를 입력하세요 (최소 8자)"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                비밀번호 확인
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="비밀번호를 다시 입력하세요"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          {/* 주의사항 */}
          <div className="notice-box">
            <div className="notice-header">
              <Shield size={16} />
              <span>관리자 등록 안내</span>
            </div>
            <ul className="notice-list">
              <li>관리자 계정 등록 후 즉시 로그인하여 사용하실 수 있습니다.</li>
              <li>계정 관련 문의사항은 IT팀(ext. 1234)으로 연락하세요.</li>
              <li>사원코드는 정확히 입력해주세요 (예: HD2024001).</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="admin-register-button"
            disabled={isLoading}
          >
            {isLoading ? '등록 중...' : '관리자 등록 신청'}
          </button>
        </form>

        {/* Footer */}
        <div className="admin-register-footer">
          <p>이미 계정이 있으신가요? 
            <button 
              className="link-button"
              onClick={() => navigate('/admin/login')}
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
