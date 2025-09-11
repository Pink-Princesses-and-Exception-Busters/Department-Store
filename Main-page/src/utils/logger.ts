// 개발 환경에서만 로그를 출력하는 유틸리티

const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development'

export const logger = {
  // 일반 로그 (개발 환경에서만)
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },
  
  // 경고 로그 (항상 출력)
  warn: (...args: any[]) => {
    console.warn(...args)
  },
  
  // 에러 로그 (항상 출력)
  error: (...args: any[]) => {
    console.error(...args)
  },
  
  // 디버그 로그 (개발 환경에서만, 더 상세한 정보)
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args)
    }
  },
  
  // 성공 로그 (개발 환경에서만)
  success: (...args: any[]) => {
    if (isDev) {
      console.log('✅', ...args)
    }
  },
  
  // 정보 로그 (개발 환경에서만)
  info: (...args: any[]) => {
    if (isDev) {
      console.info('ℹ️', ...args)
    }
  }
}

// 로그인 관련 전용 로거 (필요시 쉽게 활성화/비활성화 가능)
// 🔧 디버깅이 필요할 때: authLogger.enabled = true
// 🧹 콘솔을 깔끔하게: authLogger.enabled = false
export const authLogger = {
  enabled: false, // 기본적으로 비활성화 (필요시 true로 변경)
  
  log: (...args: any[]) => {
    if (authLogger.enabled) {
      console.log('🔐', ...args)
    }
  },
  
  success: (...args: any[]) => {
    if (authLogger.enabled) {
      console.log('✅', ...args)
    }
  },
  
  error: (...args: any[]) => {
    // 에러는 항상 출력
    console.error('🚨', ...args)
  },
  
  warn: (...args: any[]) => {
    if (authLogger.enabled) {
      console.warn('⚠️', ...args)
    }
  }
}
