import { supabase } from './supabase'

export interface BrandCustomer {
  id: string
  name: string
  email: string
  phone?: string
  joinDate: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  status: string
}

// 브랜드별 고객 목록 조회
export const getBrandCustomers = async (brandName: string): Promise<BrandCustomer[]> => {
  try {
    console.log('🔍 브랜드별 고객 조회 시작:', brandName)

    // 1. 해당 브랜드 상품을 구매한 모든 주문 조회
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        items,
        total_amount,
        order_date
      `)

    if (ordersError) {
      console.error('주문 데이터 조회 오류:', ordersError)
      return []
    }

    console.log('📊 전체 주문 데이터:', orders?.length || 0, '건')

    // 2. 해당 브랜드 상품을 포함한 주문들만 필터링
    console.log('🔍 필터링 대상 브랜드:', brandName)
    
    const brandOrders = orders?.filter(order => {
      if (!order.items || !Array.isArray(order.items)) {
        console.log('❌ items 없음:', order.id)
        return false
      }
      
      // 각 주문의 브랜드들 확인
      const orderBrands = order.items.map(item => item.brand).filter(Boolean)
      console.log(`📦 주문 ${order.id.slice(0, 8)} 브랜드들:`, orderBrands)
      
      const hasTargetBrand = order.items.some(item => {
        const itemBrand = item.brand
        const matches = itemBrand && itemBrand.toLowerCase() === brandName.toLowerCase()
        if (matches) {
          console.log(`✅ 매칭: ${itemBrand} === ${brandName}`)
        }
        return matches
      })
      
      return hasTargetBrand
    }) || []

    console.log('🏷️ 브랜드 관련 주문:', brandOrders.length, '건')
    if (brandOrders.length > 0) {
      console.log('📋 브랜드 주문 목록:', brandOrders.map(o => ({
        id: o.id.slice(0, 8),
        brands: o.items.map(item => item.brand).filter(Boolean)
      })))
    }

    // 3. 고객별로 그룹화하여 통계 계산
    const customerMap = new Map<string, {
      user: any
      orders: any[]
      brandSpent: number
    }>()

    // 고유한 사용자 ID 목록 추출
    const uniqueUserIds = [...new Set(brandOrders.map(order => order.user_id))]
    console.log('👥 고유 사용자 ID:', uniqueUserIds.length, '명')

    // 사용자 정보 별도 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, phone, created_at')
      .in('id', uniqueUserIds)

    if (usersError) {
      console.error('사용자 데이터 조회 오류:', usersError)
      return []
    }

    console.log('👤 조회된 사용자 수:', users?.length || 0)

    // 사용자 정보를 Map으로 변환
    const usersMap = new Map()
    users?.forEach(user => {
      usersMap.set(user.id, user)
    })

    brandOrders.forEach(order => {
      const userId = order.user_id
      const user = usersMap.get(userId)
      
      if (!user) {
        console.log('❌ 사용자 정보 없음:', userId)
        return
      }

      // 해당 브랜드 상품의 금액만 계산
      const brandItemsValue = order.items
        .filter(item => item.brand?.toLowerCase() === brandName.toLowerCase())
        .reduce((sum, item) => sum + (item.price * item.quantity), 0)

      if (!customerMap.has(userId)) {
        customerMap.set(userId, {
          user,
          orders: [],
          brandSpent: 0
        })
      }

      const customerData = customerMap.get(userId)!
      customerData.orders.push(order)
      customerData.brandSpent += brandItemsValue
    })

    // 4. 고객 데이터 변환
    const brandCustomers: BrandCustomer[] = Array.from(customerMap.values()).map(({ user, orders, brandSpent }) => {
      // 최근 주문일 계산
      const lastOrderDate = orders
        .map(order => new Date(order.order_date))
        .sort((a, b) => b.getTime() - a.getTime())[0]

      // 가입일 (users 테이블의 created_at 또는 첫 주문일)
      const joinDate = user.created_at 
        ? new Date(user.created_at)
        : orders
            .map(order => new Date(order.order_date))
            .sort((a, b) => a.getTime() - b.getTime())[0]

      // 활성 상태 판단 (최근 90일 이내 주문이 있으면 활성)
      const daysSinceLastOrder = lastOrderDate 
        ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      return {
        id: user.id,
        name: user.name || '이름 없음',
        email: user.email || '',
        phone: user.phone || '',
        joinDate: joinDate.toISOString().split('T')[0],
        totalOrders: orders.length,
        totalSpent: brandSpent,
        lastOrder: lastOrderDate ? lastOrderDate.toISOString().split('T')[0] : '',
        status: daysSinceLastOrder <= 90 ? '활성' : '비활성'
      }
    })

    // 5. 총 구매 금액 순으로 정렬
    brandCustomers.sort((a, b) => b.totalSpent - a.totalSpent)

    console.log('✅ 브랜드 고객 목록 생성 완료:', brandCustomers.length, '명')
    
    return brandCustomers

  } catch (error) {
    console.error('브랜드 고객 조회 중 오류:', error)
    return []
  }
}

// 현재 로그인한 관리자의 브랜드명 조회
export const getCurrentBrandName = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ 사용자 정보 없음')
      return null
    }

    console.log('👤 현재 사용자 정보:', {
      email: user.email,
      role: user.user_metadata?.role,
      name: user.user_metadata?.name,
      metadata: user.user_metadata
    })

    // 1. user_metadata에서 브랜드명 확인
    const brandFromMetadata = user.user_metadata?.name
    if (brandFromMetadata) {
      console.log('🏷️ user_metadata에서 브랜드명:', brandFromMetadata)
      return brandFromMetadata
    }

    // 2. brand_admins 테이블에서 조회
    console.log('📋 brand_admins 테이블에서 조회 중...', user.email)
    const { data: brandData, error } = await supabase
      .from('brand_admins')
      .select('name')
      .eq('email', user.email)
      .single()

    if (error) {
      console.error('브랜드 정보 조회 오류:', error)
      return null
    }

    console.log('🏷️ brand_admins에서 브랜드명:', brandData?.name)
    return brandData?.name || null

  } catch (error) {
    console.error('브랜드명 조회 중 오류:', error)
    return null
  }
}
