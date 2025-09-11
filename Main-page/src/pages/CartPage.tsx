import React, { useState, useEffect } from 'react'
import { FiTrash2, FiMinus, FiPlus, FiHeart, FiGift, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useCartContext } from '../context/CartContext'
import { useCouponContext } from '../context/CouponContext'
import { useUser } from '../context/UserContext'

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const [isSticky, setIsSticky] = useState(false)
  const [showCouponSection, setShowCouponSection] = useState(false)
  const {
    cartItems,
    selectedItems,
    isAllSelected,
    updateQuantity,
    removeItem,
    removeSelectedItems,
    toggleItemSelection,
    toggleAllSelection,
    getSelectedTotalPrice,
    formatPrice
  } = useCartContext()

  const {
    selectedCoupon,
    selectCoupon,
    getAvailableCoupons,
    calculateDiscount,
    clearSelectedCoupon
  } = useCouponContext()

  const { currentUser } = useUser()

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsSticky(scrollTop > 200) // 200px 이상 스크롤되면 sticky 활성화
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 사용자 등급 확인
  const user = currentUser
  
  // 배송비 계산 (FAMILY 등급은 3,000원, SILVER 이상은 무료)
  const shippingFee = user && (user.grade === 'SILVER' || user.grade === 'GOLD' || user.grade === 'DIAMOND' || user.grade === 'PRESTIGE VIP') ? 0 : 3000
  
  const selectedTotalPrice = getSelectedTotalPrice()
  const availableCoupons = getAvailableCoupons(selectedTotalPrice)
  const discountAmount = selectedCoupon ? calculateDiscount(selectedCoupon, selectedTotalPrice) : 0
  const finalPrice = selectedTotalPrice + shippingFee - discountAmount

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('장바구니 페이지 로드됨')
    console.log('선택된 상품 총액:', selectedTotalPrice)
    console.log('사용 가능한 쿠폰:', availableCoupons)
    console.log('선택된 쿠폰:', selectedCoupon)
  }, [selectedTotalPrice, availableCoupons, selectedCoupon])

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-black transition-colors">HOME</Link>
              <span>&gt;</span>
              <span className="text-black">장바구니</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">장바구니</h1>
            <p className="text-gray-500">장바구니가 비어있습니다.</p>
          </div>

          <div className="text-center py-20">
            <div className="text-8xl mb-6">🛒</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">장바구니에 담긴 상품이 없습니다.</h3>
            <p className="text-gray-500 mb-8">원하시는 상품을 장바구니에 담아보세요.</p>
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors no-underline"
            >
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 브레드크럼 */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-black transition-colors">HOME</Link>
            <span>&gt;</span>
            <span className="text-black">장바구니</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">장바구니</h1>
          <p className="text-gray-500">총 <strong className="text-black">{cartItems.length}</strong>개의 상품이 담겨있습니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 장바구니 상품 목록 */}
          <div className="lg:col-span-2">
            {/* 전체 선택 체크박스 */}
            <div className="bg-white rounded-lg p-6 mb-4 flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAllSelection}
                  className="hidden peer"
                />
                <span className="w-5 h-5 border-2 border-gray-300 rounded mr-3 relative transition-all duration-300 peer-checked:bg-black peer-checked:border-black after:content-[''] after:absolute after:left-[6px] after:top-[2px] after:w-[6px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 peer-checked:after:opacity-100"></span>
                <span className="font-medium">전체선택 ({selectedItems.length}/{cartItems.length})</span>
              </label>
              <button
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={removeSelectedItems}
                disabled={selectedItems.length === 0}
              >
                선택삭제 ({selectedItems.length})
              </button>
            </div>

            {/* 상품 목록 */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="hidden peer"
                        />
                        <span className="w-5 h-5 border-2 border-gray-300 rounded relative transition-all duration-300 peer-checked:bg-black peer-checked:border-black after:content-[''] after:absolute after:left-[6px] after:top-[2px] after:w-[6px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 peer-checked:after:opacity-100"></span>
                      </label>
                    </div>

                    <div className="flex-shrink-0 w-24 h-24">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 mb-1">{item.product.brand}</div>
                      <div className="font-medium text-gray-900 mb-2">{item.product.name}</div>
                      <div className="text-sm text-gray-500 mb-3 space-x-4">
                        <span>색상: 블랙</span>
                        <span>사이즈: FREE</span>
                      </div>
                      <div className="flex gap-4">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors">
                          <FiHeart size={16} />
                          관심상품
                        </button>
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors">
                          <FiGift size={16} />
                          선물하기
                        </button>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-center">
                      <div className="text-sm text-gray-500 mb-2">수량</div>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={14} />
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          readOnly
                          className="w-12 text-center border-0 outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-50"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm text-gray-500 mb-1">판매가</div>
                      <div className="text-sm text-gray-400 line-through">₩{formatPrice(item.product.price)}</div>
                      <div className="text-lg font-bold text-black">₩{formatPrice(item.product.price * item.quantity)}</div>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="상품 삭제"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
                          </div>

              {/* 쿠폰 선택 섹션 */}
              {selectedItems.length > 0 && (
                <div className="bg-white rounded-lg p-6 mt-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">쿠폰 적용</h3>
                    {selectedCoupon && (
                      <button
                        onClick={() => setShowCouponSection(!showCouponSection)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showCouponSection ? '접기' : '쿠폰 변경'}
                      </button>
                    )}
                  </div>
                  
                  {selectedCoupon ? (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{selectedCoupon.name}</div>
                          <div className="text-sm text-gray-500">
                            {selectedCoupon.type === 'discount' 
                              ? `${formatPrice(selectedCoupon.value)} 할인`
                              : `${selectedCoupon.value}% 할인${selectedCoupon.maxDiscount ? ` (최대 ${formatPrice(selectedCoupon.maxDiscount)})` : ''}`
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-500 text-lg">
                            -₩{formatPrice(discountAmount)}
                          </div>
                          <button
                            onClick={() => selectCoupon(null)}
                            className="text-xs text-gray-500 hover:text-red-500"
                          >
                            쿠폰 해제
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        console.log('쿠폰 섹션 토글 버튼 클릭됨')
                        console.log('현재 showCouponSection:', showCouponSection)
                        setShowCouponSection(!showCouponSection)
                      }}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-sm text-gray-500">
                          {availableCoupons.length > 0 
                            ? `${availableCoupons.length}개의 쿠폰 사용 가능`
                            : '사용 가능한 쿠폰이 없습니다'
                          }
                        </p>
                      </div>
                      {showCouponSection ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </button>
                  )}

                  {showCouponSection && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {availableCoupons.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">사용 가능한 쿠폰이 없습니다.</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                            <input
                              type="radio"
                              name="coupon"
                              checked={selectedCoupon === null}
                              onChange={() => selectCoupon(null)}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">쿠폰 미사용</div>
                              <div className="text-sm text-gray-500">할인 없이 주문</div>
                            </div>
                          </div>
                          
                          {availableCoupons.map((coupon) => (
                            <div key={coupon.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                              <input
                                type="radio"
                                name="coupon"
                                checked={selectedCoupon?.id === coupon.id}
                                onChange={() => {
                                  console.log('쿠폰 선택됨:', coupon.name)
                                  selectCoupon(coupon)
                                }}
                                className="mr-3"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">{coupon.name}</div>
                                <div className="text-sm text-gray-500">
                                  {coupon.type === 'discount' 
                                    ? `${formatPrice(coupon.value)} 할인`
                                    : `${coupon.value}% 할인${coupon.maxDiscount ? ` (최대 ${formatPrice(coupon.maxDiscount)})` : ''}`
                                  }
                                </div>
                                <div className="text-xs text-gray-400">{coupon.restrictions}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-red-500">
                                  -₩{formatPrice(calculateDiscount(coupon, selectedTotalPrice))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 주문 요약 */}
          <div className="lg:col-span-1 relative">
            {/* 배송 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h4 className="font-bold mb-4">배송정보</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 무료배송 (10만원 이상 구매시)</p>
                <p>• 당일배송 가능지역: 서울/경기 일부</p>
                <p>• 일반배송: 2-3일 소요</p>
              </div>
            </div>

                                                                                                       <div 
                 className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mt-4 z-10 sticky top-4"
                 style={{
                   position: 'sticky',
                   top: '16px'
                 }}
               >
               <h3 className="text-xl font-bold mb-6">주문예상금액</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">상품금액</span>
                  <span className="font-medium">₩{formatPrice(selectedTotalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">배송비</span>
                  {shippingFee > 0 ? (
                    <span className="font-medium">₩{formatPrice(shippingFee)}</span>
                  ) : (
                    <span className="text-green-600 font-medium">무료</span>
                  )}
                </div>
                <div className="flex justify-between text-red-500">
                  <span>할인금액</span>
                  <span>-₩{formatPrice(discountAmount)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>결제예상금액</span>
                    <span>₩{formatPrice(finalPrice)}</span>
                  </div>
                </div>
              </div>

                             <div className="space-y-3">
                 <button
                   className="w-full py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   disabled={selectedItems.length === 0}
                   onClick={() => {
                     if (selectedItems.length === 0) {
                       alert('주문할 상품을 선택해주세요.')
                       return
                     }
                     navigate('/checkout')
                   }}
                 >
                   주문하기 ({selectedItems.length}개)
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* 추천 상품 섹션 */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-8">함께 구매하면 좋은 상품</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200" alt="추천상품" className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">CHANEL</div>
                <div className="font-medium text-gray-900 mb-2">클래식 체인백</div>
                <div className="text-lg font-bold">₩4,200,000</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <img src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200" alt="추천상품" className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">HERMÈS</div>
                <div className="font-medium text-gray-900 mb-2">실크 스카프</div>
                <div className="text-lg font-bold">₩650,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage