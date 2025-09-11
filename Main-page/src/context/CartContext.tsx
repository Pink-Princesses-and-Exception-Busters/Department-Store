import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Product } from '../types'

interface CartContextType {
  cartItems: CartItem[]
  selectedItems: string[]
  isAllSelected: boolean
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
  // localStorage에서 장바구니 데이터 로드
  const loadCartFromStorage = (): CartItem[] => {
    try {
      const savedCart = localStorage.getItem('shopping_cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error('장바구니 데이터 로드 실패:', error)
      return []
    }
  }

  // localStorage에서 선택된 아이템 로드
  const loadSelectedFromStorage = (): string[] => {
    try {
      const savedSelected = localStorage.getItem('cart_selected_items')
      return savedSelected ? JSON.parse(savedSelected) : []
    } catch (error) {
      console.error('선택된 아이템 데이터 로드 실패:', error)
      return []
    }
  }

  // localStorage에 장바구니 데이터 저장
  const saveCartToStorage = (items: CartItem[]) => {
    try {
      localStorage.setItem('shopping_cart', JSON.stringify(items))
    } catch (error) {
      console.error('장바구니 데이터 저장 실패:', error)
    }
  }

  // localStorage에 선택된 아이템 저장
  const saveSelectedToStorage = (selected: string[]) => {
    try {
      localStorage.setItem('cart_selected_items', JSON.stringify(selected))
    } catch (error) {
      console.error('선택된 아이템 데이터 저장 실패:', error)
    }
  }

  // 초기 장바구니 데이터 (localStorage에서 로드)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartFromStorage())
  
  // 선택된 아이템들의 ID를 관리 (localStorage에서 로드)
  const [selectedItems, setSelectedItems] = useState<string[]>(() => loadSelectedFromStorage())

  // 전체 선택 상태 확인
  const isAllSelected = cartItems.length > 0 && selectedItems.length === cartItems.length

  // 장바구니 데이터가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveCartToStorage(cartItems)
  }, [cartItems])

  // 선택된 아이템이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveSelectedToStorage(selectedItems)
  }, [selectedItems])

  // 장바구니에 상품 추가
  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cartItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      // 이미 있는 상품이면 수량 증가
      updateQuantity(existingItem.id, existingItem.quantity + quantity)
    } else {
      // 새로운 상품 추가
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random()}`,
        productId: product.id,
        quantity,
        product
      }
      setCartItems(prev => [...prev, newItem])
      setSelectedItems(prev => [...prev, newItem.id])
    }
  }

  // 수량 업데이트
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }
    
    setCartItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  // 개별 아이템 삭제
  const removeItem = (itemId: string) => {
    setCartItems(items => items.filter(item => item.id !== itemId))
    setSelectedItems(selected => selected.filter(id => id !== itemId))
  }

  // 선택된 아이템들 삭제
  const removeSelectedItems = () => {
    setCartItems(items => items.filter(item => !selectedItems.includes(item.id)))
    setSelectedItems([])
  }

  // 개별 아이템 선택/해제
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(selected => {
      if (selected.includes(itemId)) {
        return selected.filter(id => id !== itemId)
      } else {
        return [...selected, itemId]
      }
    })
  }

  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (isAllSelected) {
      setSelectedItems([])
    } else {
      setSelectedItems(cartItems.map(item => item.id))
    }
  }

  // 총 가격 계산
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  // 선택된 아이템들의 총 가격 계산
  const getSelectedTotalPrice = () => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  // 장바구니 아이템 개수
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  // 장바구니 전체 비우기 (주문 완료 시 사용)
  const clearCart = () => {
    setCartItems([])
    setSelectedItems([])
  }

  const value: CartContextType = {
    cartItems,
    selectedItems,
    isAllSelected,
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
    clearCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}