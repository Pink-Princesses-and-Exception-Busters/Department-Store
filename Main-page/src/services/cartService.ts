import { supabase } from './supabase'
import { CartItem } from '../types'

export interface DbCartItem {
    id: string
    user_id: string
    product_id: number
    product_name: string
    product_price: number
    product_image: string
    quantity: number
    size?: string
    color?: string
    brand?: string
    is_selected: boolean
    created_at: string
    updated_at: string
}

// CartItem을 DbCartItem으로 변환
export const cartItemToDbItem = (item: CartItem, userId: string): Omit<DbCartItem, 'id' | 'created_at' | 'updated_at'> => ({
    user_id: userId,
    product_id: item.productId,
    product_name: item.product.name,
    product_price: item.product.price,
    product_image: item.product.image,
    quantity: item.quantity,
    size: item.product.size,
    color: item.product.color,
    brand: item.product.brand,
    is_selected: true
})

// DbCartItem을 CartItem으로 변환
export const dbItemToCartItem = (dbItem: DbCartItem): CartItem => ({
    id: `${dbItem.product_id}-${dbItem.size || 'no-size'}-${dbItem.color || 'no-color'}`,
    productId: dbItem.product_id,
    quantity: dbItem.quantity,
    product: {
        id: dbItem.product_id,
        name: dbItem.product_name,
        description: '', // DB에서 가져오지 않으므로 빈 문자열
        price: dbItem.product_price,
        brand: dbItem.brand,
        image: dbItem.product_image,
        category_id: 0, // DB에서 가져오지 않으므로 기본값
        status: 'forsale' as const,
        sales: 0,
        stock: 0,
        created_at: '',
        updated_at: '',
        size: dbItem.size,
        color: dbItem.color
    }
})

// 사용자 장바구니 조회
export const getUserCart = async (userId: string): Promise<{items: CartItem[], selectedIds: string[]}> => {
    try {
        const { data, error } = await supabase
            .from('user_carts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('장바구니 조회 오류:', error)
            return { items: [], selectedIds: [] }
        }

        const items: CartItem[] = []
        const selectedIds: string[] = []

        data?.forEach(dbItem => {
            const cartItem = dbItemToCartItem(dbItem)
            items.push(cartItem)
            
            if (dbItem.is_selected) {
                selectedIds.push(cartItem.id)
            }
        })

        return { items, selectedIds }
    } catch (error) {
        console.error('장바구니 조회 중 예외 발생:', error)
        return { items: [], selectedIds: [] }
    }
}

// 장바구니에 상품 추가
export const addItemToUserCart = async (userId: string, item: CartItem): Promise<boolean> => {
    try {
        const dbItem = cartItemToDbItem(item, userId)
        
        // UPSERT: 이미 존재하면 수량 업데이트, 없으면 새로 추가
        const { error } = await supabase
            .from('user_carts')
            .upsert({
                ...dbItem,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,product_id,size,color',
                ignoreDuplicates: false
            })

        if (error) {
            console.error('장바구니 추가 오류:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('장바구니 추가 중 예외 발생:', error)
        return false
    }
}

// 장바구니 상품 수량 업데이트
export const updateCartItemQuantity = async (userId: string, itemId: string, quantity: number): Promise<boolean> => {
    try {
        // itemId에서 product_id, size, color 추출
        const [productId, size, color] = itemId.split('-')
        const actualSize = size === 'no-size' ? null : size
        const actualColor = color === 'no-color' ? null : color

        const { error } = await supabase
            .from('user_carts')
            .update({ 
                quantity,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('product_id', parseInt(productId))
            .eq('size', actualSize)
            .eq('color', actualColor)

        if (error) {
            console.error('수량 업데이트 오류:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('수량 업데이트 중 예외 발생:', error)
        return false
    }
}

// 장바구니 상품 삭제
export const removeCartItem = async (userId: string, itemId: string): Promise<boolean> => {
    try {
        const [productId, size, color] = itemId.split('-')
        const actualSize = size === 'no-size' ? null : size
        const actualColor = color === 'no-color' ? null : color

        const { error } = await supabase
            .from('user_carts')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', parseInt(productId))
            .eq('size', actualSize)
            .eq('color', actualColor)

        if (error) {
            console.error('장바구니 상품 삭제 오류:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('장바구니 상품 삭제 중 예외 발생:', error)
        return false
    }
}

// 선택된 상품들 삭제
export const removeSelectedItems = async (userId: string, selectedIds: string[]): Promise<boolean> => {
    try {
        for (const itemId of selectedIds) {
            const success = await removeCartItem(userId, itemId)
            if (!success) {
                console.error(`상품 ${itemId} 삭제 실패`)
                return false
            }
        }
        return true
    } catch (error) {
        console.error('선택된 상품들 삭제 중 예외 발생:', error)
        return false
    }
}

// 상품 선택 상태 업데이트
export const updateItemSelection = async (userId: string, itemId: string, isSelected: boolean): Promise<boolean> => {
    try {
        const [productId, size, color] = itemId.split('-')
        const actualSize = size === 'no-size' ? null : size
        const actualColor = color === 'no-color' ? null : color

        const { error } = await supabase
            .from('user_carts')
            .update({ 
                is_selected: isSelected,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('product_id', parseInt(productId))
            .eq('size', actualSize)
            .eq('color', actualColor)

        if (error) {
            console.error('선택 상태 업데이트 오류:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('선택 상태 업데이트 중 예외 발생:', error)
        return false
    }
}

// 모든 상품 선택 상태 업데이트
export const updateAllItemsSelection = async (userId: string, isSelected: boolean): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_carts')
            .update({ 
                is_selected: isSelected,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)

        if (error) {
            console.error('전체 선택 상태 업데이트 오류:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('전체 선택 상태 업데이트 중 예외 발생:', error)
        return false
    }
}

// 사용자 장바구니 전체 삭제
export const clearUserCart = async (userId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_carts')
            .delete()
            .eq('user_id', userId)

        if (error) {
            console.error('장바구니 전체 삭제 오류:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('장바구니 전체 삭제 중 예외 발생:', error)
        return false
    }
}

// 여러 상품을 한 번에 장바구니에 추가 (비회원 → 회원 전환 시 사용)
export const addMultipleItemsToUserCart = async (userId: string, items: CartItem[]): Promise<boolean> => {
    try {
        const dbItems = items.map(item => ({
            ...cartItemToDbItem(item, userId),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }))

        const { error } = await supabase
            .from('user_carts')
            .upsert(dbItems, {
                onConflict: 'user_id,product_id,size,color',
                ignoreDuplicates: false
            })

        if (error) {
            console.error('여러 상품 추가 오류:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('여러 상품 추가 중 예외 발생:', error)
        return false
    }
}
