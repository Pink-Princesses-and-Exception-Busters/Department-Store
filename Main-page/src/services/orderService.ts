import { supabase } from './supabase'

export interface OrderItem {
  product_id: number
  name: string
  price: number
  quantity: number
  image: string
  size?: string
  color?: string
  brand?: string
}

export interface Order {
  id?: string
  user_id: string
  order_date: string
  status: '주문접수' | '결제완료' | '상품준비' | '배송중' | '배송완료' | '주문취소' | '반품신청' | '반품완료'
  total_amount: number
  payment_method: string
  payment_key?: string
  items: OrderItem[]
  shipping_address: string
  recipient_name: string
  recipient_phone: string
  created_at?: string
  updated_at?: string
  tracking_number?: string
  estimated_delivery?: string
  cancel_reason?: string
  return_reason?: string
}

// 주문 생성
export const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order | null> => {
  try {
    // 1. 주문 생성
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        ...orderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('주문 생성 오류:', error)
      return null
    }

    // 2. 주문 성공 시 상품 재고 및 판매량 업데이트
    if (data && data.items) {
      await updateProductStockAndSales(data.items)
    }

    return data
  } catch (error) {
    console.error('주문 생성 중 예외 발생:', error)
    return null
  }
}

// 상품 재고 및 판매량 업데이트 함수
const updateProductStockAndSales = async (orderItems: OrderItem[]): Promise<void> => {
  try {
    console.log('상품 재고 및 판매량 업데이트 시작:', orderItems)
    
    for (const item of orderItems) {
      const { product_id, quantity } = item
      
      // 현재 상품 정보 조회
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock, sales')
        .eq('id', product_id)
        .single()

      if (fetchError) {
        console.error(`상품 ${product_id} 조회 오류:`, fetchError)
        continue
      }

      if (!currentProduct) {
        console.error(`상품 ${product_id}를 찾을 수 없습니다.`)
        continue
      }

      const currentStock = currentProduct.stock || 0
      const currentSales = currentProduct.sales || 0
      const newStock = Math.max(0, currentStock - quantity) // 재고는 0 이하로 내려가지 않음
      const newSales = currentSales + quantity

      // 상품 재고 및 판매량 업데이트
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock: newStock,
          sales: newSales,
          status: newStock === 0 ? 'soldout' as const : 'forsale' as const, // 재고가 0이면 품절 상태로 변경
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id)

      if (updateError) {
        console.error(`상품 ${product_id} 업데이트 오류:`, updateError)
      } else {
        console.log(`상품 ${product_id} 업데이트 완료: 재고 ${currentStock} → ${newStock}, 판매량 ${currentSales} → ${newSales}`)
      }
    }
  } catch (error) {
    console.error('상품 재고 및 판매량 업데이트 중 오류 발생:', error)
  }
}

// 사용자별 주문 목록 조회
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('주문 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('주문 조회 중 예외 발생:', error)
    return []
  }
}

// 주문 ID로 주문 조회
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('주문 조회 오류:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('주문 조회 중 예외 발생:', error)
    return null
  }
}

// 주문 상태 업데이트
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)

    if (error) {
      console.error('주문 상태 업데이트 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('주문 상태 업데이트 중 예외 발생:', error)
    return false
  }
}

// 주문 취소 요청 (관리자 검토 필요)
export const cancelOrder = async (orderId: string, reason: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: '취소요청', 
        cancel_reason: reason,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)

    if (error) {
      console.error('주문 취소 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('주문 취소 중 예외 발생:', error)
    return false
  }
}

// 주문 취소 승인 (관리자용) - 재고 복구 포함
export const approveOrderCancellation = async (orderId: string): Promise<boolean> => {
  try {
    // 1. 주문 정보 조회
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      console.error('주문 조회 오류:', fetchError)
      return false
    }

    // 2. 주문 상태를 취소완료로 변경
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: '주문취소', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('주문 상태 업데이트 오류:', updateError)
      return false
    }

    // 3. 상품 재고 복구 및 판매량 차감
    if (order.items && order.items.length > 0) {
      await restoreProductStockAndSales(order.items)
    }

    return true
  } catch (error) {
    console.error('주문 취소 승인 중 예외 발생:', error)
    return false
  }
}

// 상품 재고 복구 및 판매량 차감 함수 (주문 취소 시)
const restoreProductStockAndSales = async (orderItems: OrderItem[]): Promise<void> => {
  try {
    console.log('상품 재고 복구 및 판매량 차감 시작:', orderItems)
    
    for (const item of orderItems) {
      const { product_id, quantity } = item
      
      // 현재 상품 정보 조회
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock, sales')
        .eq('id', product_id)
        .single()

      if (fetchError) {
        console.error(`상품 ${product_id} 조회 오류:`, fetchError)
        continue
      }

      if (!currentProduct) {
        console.error(`상품 ${product_id}를 찾을 수 없습니다.`)
        continue
      }

      const currentStock = currentProduct.stock || 0
      const currentSales = currentProduct.sales || 0
      const newStock = currentStock + quantity // 재고 복구
      const newSales = Math.max(0, currentSales - quantity) // 판매량 차감 (0 이하로 내려가지 않음)

      // 상품 재고 및 판매량 업데이트
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock: newStock,
          sales: newSales,
          status: newStock > 0 ? 'forsale' as const : 'soldout' as const, // 재고가 있으면 판매중으로 변경
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id)

      if (updateError) {
        console.error(`상품 ${product_id} 복구 오류:`, updateError)
      } else {
        console.log(`상품 ${product_id} 복구 완료: 재고 ${currentStock} → ${newStock}, 판매량 ${currentSales} → ${newSales}`)
      }
    }
  } catch (error) {
    console.error('상품 재고 복구 및 판매량 차감 중 오류 발생:', error)
  }
}

// 배송 정보 업데이트
export const updateShippingInfo = async (orderId: string, trackingNumber: string, estimatedDelivery: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        tracking_number: trackingNumber,
        estimated_delivery: estimatedDelivery,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)

    if (error) {
      console.error('배송 정보 업데이트 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('배송 정보 업데이트 중 예외 발생:', error)
    return false
  }
}

// 기존 로컬스토리지 데이터를 데이터베이스로 마이그레이션
export const migrateLocalOrdersToDatabase = async (userId: string): Promise<number> => {
  try {
    const localOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    const userOrders = localOrders.filter((order: any) => 
      order.user_id === userId || order.user_id === userId || order.user_id === userId
    )

    let migratedCount = 0
    for (const order of userOrders) {
      // 이미 데이터베이스에 있는 주문인지 확인
      const existingOrder = await getOrderById(order.id)
      if (!existingOrder) {
        const success = await createOrder(order)
        if (success) {
          migratedCount++
        }
      }
    }

    return migratedCount
  } catch (error) {
    console.error('주문 마이그레이션 중 오류 발생:', error)
    return 0
  }
}

// 테스트용 주문 데이터 생성 (개발/테스트 목적)
export const createTestOrder = async (userId: string): Promise<Order | null> => {
  try {
    const testOrderData: Omit<Order, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      order_date: new Date().toISOString(),
      status: '주문접수',
      total_amount: 150000,
      payment_method: '카드',
      payment_key: `TEST_${Date.now()}`,
      items: [
        {
          product_id: 1,
          name: '프리미엄 울 코트',
          price: 150000,
          quantity: 1,
          image: '/placeholder-image.jpg',
          brand: '테스트 브랜드',
          size: 'FREE',
          color: '블랙'
        }
      ],
      shipping_address: '서울시 강남구 테스트로 123',
      recipient_name: '테스트 사용자',
      recipient_phone: '010-1234-5678',
      tracking_number: `TN${Date.now()}`,
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    return await createOrder(testOrderData)
  } catch (error) {
    console.error('테스트 주문 생성 중 오류 발생:', error)
    return null
  }
}
