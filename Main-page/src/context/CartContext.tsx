import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Product } from '../types'
import { useUser } from './UserContext'
import * as cartService from '../services/cartService'

interface CartContextType {
  cartItems: CartItem[]
  selectedItems: string[]
  isAllSelected: boolean
  isLoading: boolean
  addToCart: (product: Product, quantity?: number) => void
  updateQuantity: (itemId: string, newQuantity: number) => void
  removeItem: (itemId: string) => void
  removeSelectedItems: () => void
  toggleItemSelection: (itemId: string) => void
  toggleAllSelection: () => void
  getTotalPrice: () => number
  getSelectedTotalPrice: () => number
  formatPrice: (price: number) => string
  getCartItemCount: () => number
  clearCart: () => void
  syncCartOnLogin: () => Promise<void>
  syncCartOnLogout: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCartContext = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { currentUser } = useUser()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 비회원용 localStorage 키
  const getGuestCartKey = () => 'shopping_cart_guest'
  const getGuestSelectedKey = () => 'cart_selected_items_guest'

  // localStorage에서 비회원 장바구니 로드
  const loadGuestCartFromStorage = (): CartItem[] => {
    try {
      const savedCart = localStorage.getItem(getGuestCartKey())
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error('비회원 장바구니 데이터 로드 실패:', error)
      return []
    }
  }

  // localStorage에서 비회원 선택 아이템 로드
  const loadGuestSelectedFromStorage = (): string[] => {
    try {
      const savedSelected = localStorage.getItem(getGuestSelectedKey())
      return savedSelected ? JSON.parse(savedSelected) : []
    } catch (error) {
      console.error('비회원 선택된 아이템 데이터 로드 실패:', error)
      return []
    }
  }

  // localStorage에 비회원 장바구니 저장
  const saveGuestCartToStorage = (items: CartItem[]) => {
    try {
      localStorage.setItem(getGuestCartKey(), JSON.stringify(items))
    } catch (error) {
      console.error('비회원 장바구니 데이터 저장 실패:', error)
    }
  }

  // localStorage에 비회원 선택 아이템 저장
  const saveGuestSelectedToStorage = (selected: string[]) => {
    try {
      localStorage.setItem(getGuestSelectedKey(), JSON.stringify(selected))
    } catch (error) {
      console.error('비회원 선택된 아이템 데이터 저장 실패:', error)
    }
  }

  // 비회원 장바구니 데이터 삭제
  const clearGuestCartFromStorage = () => {
    try {
      localStorage.removeItem(getGuestCartKey())
      localStorage.removeItem(getGuestSelectedKey())
      // 기존 키들도 정리
      localStorage.removeItem('shopping_cart')
      localStorage.removeItem('cart_selected_items')
    } catch (error) {
      console.error('비회원 장바구니 데이터 삭제 실패:', error)
    }
  }

  // 장바구니 데이터 로드 (사용자 상태에 따라 DB 또는 localStorage)
  const loadCartData = async () => {
    setIsLoading(true)
    try {
      if (currentUser?.id) {
        // 로그인 사용자: 데이터베이스에서 로드
        console.log('🔄 로그인 사용자 장바구니 로드 중...')
        const { items, selectedIds } = await cartService.getUserCart(currentUser.id)
        setCartItems(items)
        setSelectedItems(selectedIds)
        console.log(`✅ 로그인 사용자 장바구니 로드 완료: ${items.length}개 상품`)
      } else {
        // 비회원: localStorage에서 로드
        console.log('🔄 비회원 장바구니 로드 중...')
        const guestItems = loadGuestCartFromStorage()
        const guestSelected = loadGuestSelectedFromStorage()
        setCartItems(guestItems)
        setSelectedItems(guestSelected)
        console.log(`✅ 비회원 장바구니 로드 완료: ${guestItems.length}개 상품`)
      }
    } catch (error) {
      console.error('장바구니 데이터 로드 중 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 사용자 상태 변경 시 장바구니 로드
  useEffect(() => {
    loadCartData()
  }, [currentUser?.id])

  // 비회원일 때만 localStorage 동기화
  useEffect(() => {
    if (!currentUser?.id) {
      saveGuestCartToStorage(cartItems)
    }
  }, [cartItems, currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id) {
      saveGuestSelectedToStorage(selectedItems)
    }
  }, [selectedItems, currentUser?.id])

  // 로그인 시 비회원 장바구니와 회원 장바구니 병합
  const syncCartOnLogin = async () => {
    if (!currentUser?.id) return

    try {
      setIsLoading(true)
      console.log('🔄 로그인 시 장바구니 동기화 시작...')

      // 비회원 장바구니 가져오기
      const guestItems = loadGuestCartFromStorage()
      
      if (guestItems.length > 0) {
        console.log(`📦 비회원 장바구니에서 ${guestItems.length}개 상품 발견`)
        
        // 비회원 장바구니를 데이터베이스에 추가
        const success = await cartService.addMultipleItemsToUserCart(currentUser.id, guestItems)
        
        if (success) {
          console.log('✅ 비회원 장바구니 병합 완료')
          // 비회원 장바구니 삭제
          clearGuestCartFromStorage()
        } else {
          console.error('❌ 비회원 장바구니 병합 실패')
        }
      }

      // 최종 장바구니 데이터 로드
      await loadCartData()
    } catch (error) {
      console.error('로그인 시 장바구니 동기화 중 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 로그아웃 시 회원 장바구니를 데이터베이스에 저장
  const syncCartOnLogout = async () => {
    if (!currentUser?.id) return

    try {
      console.log('🔄 로그아웃 시 장바구니 동기화 시작...')
      // 현재 데이터는 이미 데이터베이스에 저장되어 있으므로 별도 작업 불필요
      // 단순히 로컬 상태만 초기화
      setCartItems([])
      setSelectedItems([])
      console.log('✅ 로그아웃 시 장바구니 동기화 완료')
    } catch (error) {
      console.error('로그아웃 시 장바구니 동기화 중 오류:', error)
    }
  }

  // 장바구니에 상품 추가
  const addToCart = async (product: Product, quantity: number = 1) => {
    const itemId = `${product.id}-${product.size || 'no-size'}-${product.color || 'no-color'}`
    
    // 기존 아이템 확인
    const existingItemIndex = cartItems.findIndex(item => item.id === itemId)
    
    if (existingItemIndex >= 0) {
      // 기존 아이템의 수량 업데이트
      const newQuantity = cartItems[existingItemIndex].quantity + quantity
      await updateQuantity(itemId, newQuantity)
    } else {
      // 새 아이템 추가
      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        quantity,
        product: {
          ...product,
          size: product.size,
          color: product.color
        }
      }

      if (currentUser?.id) {
        // 로그인 사용자: 데이터베이스에 저장
        const success = await cartService.addItemToUserCart(currentUser.id, newItem)
        if (success) {
          setCartItems(prev => [...prev, newItem])
          setSelectedItems(prev => [...prev, newItem.id])
        }
      } else {
        // 비회원: 로컬 상태만 업데이트 (useEffect에서 localStorage 저장)
        setCartItems(prev => [...prev, newItem])
        setSelectedItems(prev => [...prev, newItem.id])
      }
    }
  }

  // 수량 업데이트
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(itemId)
      return
    }

    if (currentUser?.id) {
      // 로그인 사용자: 데이터베이스 업데이트
      const success = await cartService.updateCartItemQuantity(currentUser.id, itemId, newQuantity)
      if (success) {
        setCartItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        )
      }
    } else {
      // 비회원: 로컬 상태만 업데이트
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }

  // 아이템 삭제
  const removeItem = async (itemId: string) => {
    if (currentUser?.id) {
      // 로그인 사용자: 데이터베이스에서 삭제
      const success = await cartService.removeCartItem(currentUser.id, itemId)
      if (success) {
        setCartItems(prev => prev.filter(item => item.id !== itemId))
        setSelectedItems(prev => prev.filter(id => id !== itemId))
      }
    } else {
      // 비회원: 로컬 상태만 업데이트
      setCartItems(prev => prev.filter(item => item.id !== itemId))
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  // 선택된 아이템들 삭제
  const removeSelectedItems = async () => {
    if (selectedItems.length === 0) return

    if (currentUser?.id) {
      // 로그인 사용자: 데이터베이스에서 삭제
      const success = await cartService.removeSelectedItems(currentUser.id, selectedItems)
      if (success) {
        setCartItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
        setSelectedItems([])
      }
    } else {
      // 비회원: 로컬 상태만 업데이트
      setCartItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
    }
  }

  // 아이템 선택 토글
  const toggleItemSelection = async (itemId: string) => {
    const isSelected = selectedItems.includes(itemId)
    const newSelection = !isSelected

    if (currentUser?.id) {
      // 로그인 사용자: 데이터베이스 업데이트
      const success = await cartService.updateItemSelection(currentUser.id, itemId, newSelection)
      if (success) {
        setSelectedItems(prev => 
          newSelection 
            ? [...prev, itemId]
            : prev.filter(id => id !== itemId)
        )
      }
    } else {
      // 비회원: 로컬 상태만 업데이트
      setSelectedItems(prev => 
        newSelection 
          ? [...prev, itemId]
          : prev.filter(id => id !== itemId)
      )
    }
  }

  // 전체 선택 토글
  const toggleAllSelection = async () => {
    const newSelectionState = !isAllSelected

    if (currentUser?.id) {
      // 로그인 사용자: 데이터베이스 업데이트
      const success = await cartService.updateAllItemsSelection(currentUser.id, newSelectionState)
      if (success) {
        setSelectedItems(newSelectionState ? cartItems.map(item => item.id) : [])
      }
    } else {
      // 비회원: 로컬 상태만 업데이트
      setSelectedItems(newSelectionState ? cartItems.map(item => item.id) : [])
    }
  }

  // 장바구니 전체 삭제
  const clearCart = async () => {
    if (currentUser?.id) {
      // 로그인 사용자: 데이터베이스에서 삭제
      const success = await cartService.clearUserCart(currentUser.id)
      if (success) {
        setCartItems([])
        setSelectedItems([])
      }
    } else {
      // 비회원: 로컬 상태 및 localStorage 삭제
      setCartItems([])
      setSelectedItems([])
      clearGuestCartFromStorage()
    }
  }

  // 계산된 값들
  const isAllSelected = cartItems.length > 0 && selectedItems.length === cartItems.length
  
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const getSelectedTotalPrice = () => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const value: CartContextType = {
    cartItems,
    selectedItems,
    isAllSelected,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    removeSelectedItems,
    toggleItemSelection,
    toggleAllSelection,
    getTotalPrice,
    getSelectedTotalPrice,
    formatPrice,
    getCartItemCount,
    clearCart,
    syncCartOnLogin,
    syncCartOnLogout
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}