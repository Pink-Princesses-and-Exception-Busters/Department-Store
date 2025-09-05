import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>현대백화점</h1>
          <h2>본사 관리 시스템</h2>
          <p>로그인하여 시스템에 접속하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <div className="input-group">
              <Mail size={16} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <div className="input-group">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer">
          <p>실제 등록된 계정으로 로그인하세요</p>
          <div className="signup-links">
            <div className="signup-section">
              <h3>본사 관리자</h3>
              <p>본사 관리자 계정이 필요하신가요?</p>
              <button 
                className="link-button hq-button"
                onClick={() => navigate('/admin/hq-register')}
              >
                본사 관리자 등록
              </button>
            </div>
            <div className="signup-section">
              <h3>가맹점</h3>
              <p>가맹점 계정이 필요하신가요?</p>
              <button 
                className="link-button merchant-button"
                onClick={() => navigate('/admin/merchant-register')}
              >
                가맹점 등록
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;