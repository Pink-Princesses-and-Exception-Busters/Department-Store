import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser, logout as logoutService } from '../services/userService'
import { authLogger } from '../utils/logger'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
}

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // 사용자 정보 새로고침 (DB에서만 가져오기)
  const refreshUser = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
    } catch (error) {
      authLogger.error('Failed to refresh user:', error)
      setCurrentUser(null)
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    try {
      await logoutService()
      setCurrentUser(null)
      authLogger.log('User logged out successfully')
    } catch (error) {
      authLogger.error('Logout error:', error)
      // 에러가 발생해도 사용자 상태는 초기화
      setCurrentUser(null)
    }
  }

  // 초기 사용자 정보 로드
  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}
