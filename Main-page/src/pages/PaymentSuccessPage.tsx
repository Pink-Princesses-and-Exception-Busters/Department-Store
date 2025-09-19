import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiHome, FiShoppingBag } from 'react-icons/fi'
import { useCouponContext } from '../context/CouponContext'
import { useCartContext } from '../context/CartContext'
import { createOrder } from '../services/orderService'

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [orderCreated, setOrderCreated] = useState(false)
  const navigate = useNavigate()
  const hasProcessedRef = useRef(false) // 중복 실행 방지를 위한 ref
  const { selectedCoupon, useCoupon, calculateDiscount } = useCouponContext()
  const { clearCart } = useCartContext()

  useEffect(() => {
    // 이미 처리되었으면 중단
    if (hasProcessedRef.current) {
      return
    }

    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (paymentKey && orderId && amount) {
      // 이미 주문이 생성되었는지 확인
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      const orderExists = existingOrders.some((order: any) => 
        order.payment_key === paymentKey
      )

      if (orderExists) {
        console.log('이미 주문이 생성되었습니다.')
        setPaymentInfo({
          paymentKey,
          orderId,
          amount: parseInt(amount),
          method: '카드',
          approvedAt: new Date().toISOString(),
        })
        setLoading(false)
        hasProcessedRef.current = true
        return
      }

      // 처리 시작 표시
      hasProcessedRef.current = true

      // 실제로는 서버에서 결제 승인 API를 호출해야 합니다
      // 여기서는 시뮬레이션으로 처리
      setTimeout(async () => {
        const paymentData = {
          paymentKey,
          orderId,
          amount: parseInt(amount),
          method: '카드',
          approvedAt: new Date().toISOString(),
        }
        setPaymentInfo(paymentData)
        
        // 결제 성공 시 선택된 쿠폰이 있으면 사용 처리
        if (selectedCoupon) {
          const discountAmount = calculateDiscount(selectedCoupon, parseInt(amount))
          useCoupon(selectedCoupon.id, orderId, discountAmount)
        }
        
        // 결제 성공 시 주문 생성
        await createOrderAfterPayment(paymentData)
        setLoading(false)
      }, 1000)
    } else {
      setLoading(false)
    }
  }, []) // 의존성 배열을 비워서 한 번만 실행

  const createOrderAfterPayment = async (paymentData: any) => {
    try {
      // 결제 전 준비된 주문 데이터 가져오기
      const pendingOrderStr = sessionStorage.getItem('pendingOrderData');
      if (!pendingOrderStr) {
        console.error('주문 데이터를 찾을 수 없습니다. 결제는 완료되었지만 주문 생성에 실패했습니다.')
        alert('결제는 완료되었지만 주문 생성에 실패했습니다. 고객센터에 문의해주세요.')
        return
      }
      
      const pendingData = JSON.parse(pendingOrderStr);
      console.log('결제 성공 - 주문 생성 시작:', pendingData)
      
      // 주문 데이터에 결제 키 추가하고 상태를 결제완료로 변경
      const orderDataWithPayment = {
        ...pendingData.orderData,
        status: '결제완료' as const, // 결제 완료 상태로 생성
        payment_key: paymentData.paymentKey,
        payment_method: paymentData.method || pendingData.orderData.payment_method
      };

      // 실제 주문 생성
      const savedOrder = await createOrder(orderDataWithPayment)
      
      if (!savedOrder) {
        console.error('주문 생성에 실패했습니다.')
        alert('결제는 완료되었지만 주문 생성에 실패했습니다. 고객센터에 문의해주세요.')
        return
      }

      console.log('주문이 성공적으로 생성되었습니다:', savedOrder)
      setOrderCreated(true)

      // 쿠폰 사용 처리
      if (pendingData.selectedCoupon && savedOrder.id) {
        const discountAmount = pendingData.discountAmount || 0
        useCoupon(pendingData.selectedCoupon.id, savedOrder.id, discountAmount)
        console.log('쿠폰이 사용 처리되었습니다.')
      }
      
      // 장바구니 비우기 (CartContext 사용)
      clearCart()
      console.log('장바구니가 자동으로 비워졌습니다.')

      // 임시 주문 데이터 제거
      sessionStorage.removeItem('pendingOrderData')
      
      // 로컬스토리지에 주문 정보 저장 (기존 호환성을 위해)
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      const newOrder = {
        id: savedOrder.id || paymentData.orderId, // savedOrder.id가 없으면 paymentData.orderId 사용
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        status: '결제완료',
        date: new Date().toISOString(),
        payment_key: paymentData.paymentKey,
        items: savedOrder.items
      }
      
      existingOrders.push(newOrder)
      localStorage.setItem('orders', JSON.stringify(existingOrders))
      
      // 주문 완료 알림 (한 번만 표시)
      if (!sessionStorage.getItem(`alerted_${paymentData.paymentKey}`)) {
        alert('주문이 성공적으로 완료되었습니다!')
        sessionStorage.setItem(`alerted_${paymentData.paymentKey}`, 'true')
      }
      
      // 바로 마이페이지로 이동
      navigate('/mypage')
      
    } catch (error) {
      console.error('주문 생성 중 오류 발생:', error)
      alert('결제는 완료되었지만 주문 생성에 실패했습니다. 고객센터에 문의해주세요.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">결제 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">결제 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-8">올바르지 않은 접근입니다.</p>
          <Link to="/" className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-green-500 mb-8">
            <FiCheckCircle size={64} className="mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">결제가 완료되었습니다!</h1>
          <p className="text-gray-600 mb-12 leading-relaxed">
            주문해 주셔서 감사합니다.<br />
            주문 확인 및 배송 안내는 문자와 이메일로 발송됩니다.
          </p>

          {orderCreated && (
            <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
              <h4 className="font-bold text-blue-900 mb-2">✅ 주문이 성공적으로 생성되었습니다!</h4>
              <p className="text-blue-700 text-sm">
                마이페이지의 '주문접수/배송조회'에서 주문 내역을 확인할 수 있습니다.
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-8 mb-8 text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-6">결제 정보</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호</span>
                <span className="font-medium text-gray-900">{paymentInfo.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제금액</span>
                <span className="font-bold text-lg text-gray-900">₩{formatPrice(paymentInfo.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제방법</span>
                <span className="font-medium text-gray-900">{paymentInfo.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제일시</span>
                <span className="font-medium text-gray-900">{formatDate(paymentInfo.approvedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <Link to="/" className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              <FiHome size={18} />
              홈으로
            </Link>
            <button 
              onClick={() => navigate('/mypage')}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <FiShoppingBag size={18} />
              주문내역 확인
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 text-left">
            <h4 className="font-bold text-gray-900 mb-4">배송 안내</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 일반배송: 주문일로부터 2-3일 내 배송</li>
              <li>• 당일배송: 오후 2시 이전 주문시 당일 배송 (서울/경기 일부지역)</li>
              <li>• 배송 문의: 1588-1234</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage