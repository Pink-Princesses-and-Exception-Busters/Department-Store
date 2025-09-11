import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCouponContext } from '../context/CouponContext'
import UserInfoModal from '../components/UserInfoModal'
import { getUserOrders, migrateLocalOrdersToDatabase, Order, cancelOrder } from '../services/orderService'
import { useUser, User } from '../context/UserContext'
import { verifyPasswordForAccess, changePassword } from '../services/userService'
import { getUserInquiries } from '../services/inquiryService'



const MyPage: React.FC = () => {
    const [user, setUser] = useState<User | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [orderStats, setOrderStats] = useState({
        total_orders: 0,
        total_amount: 0,
        status_counts: {
            '주문접수': 0,
            '결제완료': 0,
            '상품준비': 0,
            '배송중': 0,
            '배송완료': 0,
            '픽업가능': 0,
            '주문취소': 0,
            '반품신청': 0,
            '반품완료': 0
        }
    })
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
    const [showUserInfoModal, setShowUserInfoModal] = useState(false)
    const [password, setPassword] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [selectedMenuItem, setSelectedMenuItem] = useState('')
    const [showMembershipModal, setShowMembershipModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userGrade, setUserGrade] = useState<{
        currentGrade: string,
        totalPurchaseAmount: number,
        nextGrade: string | null,
        nextGradeRequired: number | null,
        progressPercentage: number
    }>({
        currentGrade: 'FAMILY',
        totalPurchaseAmount: 0,
        nextGrade: 'SILVER',
        nextGradeRequired: 5000000,
        progressPercentage: 0
    })
    const [inquiryCount, setInquiryCount] = useState(0)
    
    // 등급별 기준 정의
    const gradeThresholds = {
        FAMILY: { min: 0, max: 4999999, next: 'SILVER', nextRequired: 5000000 },
        SILVER: { min: 5000000, max: 29999999, next: 'GOLD', nextRequired: 30000000 },
        GOLD: { min: 30000000, max: 79999999, next: 'DIAMOND', nextRequired: 80000000 },
        DIAMOND: { min: 80000000, max: 119999999, next: 'PRESTIGE VIP', nextRequired: 120000000 },
        'PRESTIGE VIP': { min: 120000000, max: Infinity, next: null, nextRequired: null }
    }
    
    // 회원정보 변경을 위한 상태
    const [editUserInfo, setEditUserInfo] = useState<{
        name: string
        email: string
        phone: string
        address: string
    }>({
        name: '',
        email: '',
        phone: '',
        address: ''
    })
    const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('전체')
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const navigate = useNavigate()
    const { availableCoupons } = useCouponContext()
    const [searchParams] = useSearchParams()
    const { currentUser } = useUser()

    // 사용자 등급 계산 함수
    const calculateUserGrade = (totalAmount: number) => {
        let currentGrade = 'FAMILY'
        let nextGrade: string | null = 'SILVER'
        let nextGradeRequired: number | null = 5000000
        let progressPercentage = 0

        // 현재 등급 결정
        for (const [grade, threshold] of Object.entries(gradeThresholds)) {
            if (totalAmount >= threshold.min && totalAmount <= threshold.max) {
                currentGrade = grade
                nextGrade = threshold.next || null
                nextGradeRequired = threshold.nextRequired || null
                
                // 진행률 계산
                if (threshold.nextRequired) {
                    const currentLevelProgress = totalAmount - threshold.min
                    const totalLevelRange = threshold.nextRequired - threshold.min
                    progressPercentage = (currentLevelProgress / totalLevelRange) * 100
                } else {
                    progressPercentage = 100 // 최고 등급
                }
                break
            }
        }

        return {
            currentGrade,
            totalPurchaseAmount: totalAmount,
            nextGrade: nextGrade,
            nextGradeRequired: nextGradeRequired,
            progressPercentage: Math.min(progressPercentage, 100)
        }
    }

    // 주문 데이터 로드 함수
    const loadOrders = async () => {
        if (!currentUser) return

        try {
            const userId = currentUser.id || currentUser.email || currentUser.name
            console.log(`👤 주문 조회 시작: 사용자 ID = ${userId}`, { 
                id: currentUser.id, 
                email: currentUser.email, 
                name: currentUser.name 
            })
            
            // 데이터베이스에서 사용자 주문 데이터 가져오기
            let userOrders = await getUserOrders(userId)
            
            // 데이터베이스에 주문이 없으면 로컬스토리지에서 마이그레이션 시도
            if (userOrders.length === 0) {
                console.log('데이터베이스에 주문이 없어 로컬스토리지에서 마이그레이션을 시도합니다.')
                const migratedCount = await migrateLocalOrdersToDatabase(currentUser.id || currentUser.email || currentUser.name)
                if (migratedCount > 0) {
                    console.log(`${migratedCount}개의 주문이 데이터베이스로 마이그레이션되었습니다.`)
                    userOrders = await getUserOrders(currentUser.id || currentUser.email || currentUser.name)
                }
            }
            
            console.log(`📦 마이페이지: ${userOrders.length}개 주문 로드됨`, userOrders.map(o => ({
                id: o.id,
                date: o.order_date,
                status: o.status,
                amount: o.total_amount
            })))
            
            setOrders(userOrders)

            // 전체 구매 금액 계산 (등급 산정용 - 배송완료된 주문만)
            const completedOrders = userOrders.filter((order: Order) => order.status === '배송완료')
            const totalLifetimePurchase = completedOrders.reduce((sum: number, order: Order) => sum + order.total_amount, 0)
            
            // 사용자 등급 계산 및 업데이트
            const gradeInfo = calculateUserGrade(totalLifetimePurchase)
            setUserGrade(gradeInfo)

            // 주문 통계 계산 (최근 1개월)
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
            
            console.log(`📅 최근 1개월 기준일: ${oneMonthAgo.toISOString()}`)
            
            const recentOrders = userOrders.filter((order: Order) => 
                order.order_date && new Date(order.order_date) >= oneMonthAgo
            )
            
            console.log(`📊 최근 1개월 주문: 전체 ${userOrders.length}개 → 최근 ${recentOrders.length}개`)
            console.log('최근 주문 상세:', recentOrders.map(o => ({
                id: o.id,
                date: o.order_date,
                status: o.status,
                amount: o.total_amount
            })))

            const total_orders = recentOrders.length
            const total_amount = recentOrders.reduce((sum: number, order: Order) => sum + order.total_amount, 0)

            const status_counts = recentOrders.reduce((counts: any, order: Order) => {
                counts[order.status] = (counts[order.status] || 0) + 1
                return counts
            }, {
                '주문접수': 0,
                '결제완료': 0,
                '상품준비': 0,
                '배송중': 0,
                '배송완료': 0,
                '픽업가능': 0,
                '주문취소': 0,
                '반품신청': 0,
                '반품완료': 0
            })

            console.log(`📈 주문 상태별 통계:`, status_counts)
            
            setOrderStats({
                total_orders,
                total_amount,
                status_counts
            })
        } catch (error) {
            console.error('주문 데이터 로드 중 오류:', error)
        }
    }

    // 문의 개수 로드 함수
    const loadInquiryCount = async () => {
        if (!currentUser) return

        try {
            console.log('📋 1:1문의 개수 로드 시작...')
            const userInquiries = await getUserInquiries(currentUser.id)
            setInquiryCount(userInquiries.length)
            console.log(`✅ 1:1문의 개수 로드 완료: ${userInquiries.length}건`)
        } catch (error) {
            console.error('1:1문의 개수 로드 중 오류:', error)
        }
    }

    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) {
                navigate('/login')
                return
            }

            setUser(currentUser)
            
            // 회원정보 변경 폼 초기화
            setEditUserInfo({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                address: currentUser.address || ''
            })

            try {
                // 주문 데이터 로드
                await loadOrders()

                // 문의 개수 로드
                await loadInquiryCount()
            } catch (error) {
                console.error('주문 데이터를 가져오는 중 오류 발생:', error)
            }

            setLoading(false)
        }

        if (currentUser) {
            loadUserData()
        }
        
        // URL 파라미터 확인하여 모달 자동 열기
        const modalParam = searchParams.get('modal')
        if (modalParam === 'userInfo') {
            setShowUserInfoModal(true)
        }
    }, [currentUser, searchParams])

    // currentUser가 변경될 때마다 데이터 로드
    useEffect(() => {
        if (currentUser) {
            const loadUserData = async () => {
                setUser(currentUser)
                
                // 회원정보 변경 폼 초기화
                setEditUserInfo({
                    name: currentUser.name || '',
                    email: currentUser.email || '',
                    phone: currentUser.phone || '',
                    address: currentUser.address || ''
                })

                try {
                    // 데이터베이스에서 사용자 주문 데이터 가져오기
                    let userOrders = await getUserOrders(currentUser.id || currentUser.email || currentUser.name)
                    
                    // 데이터베이스에 주문이 없으면 로컬스토리지에서 마이그레이션 시도
                    if (userOrders.length === 0) {
                        console.log('데이터베이스에 주문이 없어 로컬스토리지에서 마이그레이션을 시도합니다.')
                        const migratedCount = await migrateLocalOrdersToDatabase(currentUser.id || currentUser.email || currentUser.name)
                        if (migratedCount > 0) {
                            console.log(`${migratedCount}개의 주문이 데이터베이스로 마이그레이션되었습니다.`)
                            userOrders = await getUserOrders(currentUser.id || currentUser.email || currentUser.name)
                        }
                    }
                    
                    setOrders(userOrders)

                    // 주문 통계 계산
                    const oneMonthAgo = new Date()
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
                    
                    const recentOrders = userOrders.filter((order: Order) => 
                        order.order_date && new Date(order.order_date) >= oneMonthAgo
                    )

                    const total_orders = recentOrders.length
                    const total_amount = recentOrders.reduce((sum: number, order: Order) => sum + order.total_amount, 0)
                    
                    const status_counts = {
                        '주문접수': 0,
                        '결제완료': 0,
                        '상품준비': 0,
                        '배송중': 0,
                        '배송완료': 0,
                        '픽업가능': 0,
                        '주문취소': 0,
                        '반품신청': 0,
                        '반품완료': 0
                    }

                    recentOrders.forEach((order: Order) => {
                        status_counts[order.status]++
                    })

                    setOrderStats({
                        total_orders,
                        total_amount,
                        status_counts
                    })
                } catch (error) {
                    console.error('주문 데이터를 가져오는 중 오류 발생:', error)
                }

                setLoading(false)
            }

            loadUserData()
        }
    }, [currentUser])


    const handlePersonalInfoClick = (menuItem: string) => {
        if (menuItem === '회원정보변경') {
            setShowUserInfoModal(true)
        } else {
            setSelectedMenuItem(menuItem)
            setShowPasswordModal(true)
        }
    }

    const handlePasswordSubmit = async () => {
        if (!password) {
            alert('비밀번호를 입력해주세요.')
            return
        }

        try {
            const result = await verifyPasswordForAccess(password)
            
            if (result.success) {
                alert(`${selectedMenuItem} 페이지로 이동합니다.`)
                setShowPasswordModal(false)
                setPassword('')
            } else {
                alert(result.error || '비밀번호 확인에 실패했습니다.')
            }
        } catch (error) {
            console.error('비밀번호 확인 중 오류:', error)
            alert('비밀번호 확인 중 오류가 발생했습니다.')
        }
    }

    const handleChangePassword = async () => {
        if (!currentPassword) {
            alert('현재 비밀번호를 입력해주세요.')
            return
        }

        // 새 비밀번호 유효성 검사
        if (newPassword.length < 8) {
            alert('새 비밀번호는 8자 이상이어야 합니다.')
            return
        }

        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
            return
        }

        try {
            const result = await changePassword(currentPassword, newPassword)
            
            if (result.success) {
                alert('비밀번호가 성공적으로 변경되었습니다.')
                setShowChangePasswordModal(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                alert(result.error || '비밀번호 변경에 실패했습니다.')
            }
        } catch (error) {
            console.error('비밀번호 변경 중 오류:', error)
            alert('비밀번호 변경 중 오류가 발생했습니다.')
        }
    }

    const handleModalClose = () => {
        setShowPasswordModal(false)
        setPassword('')
        setSelectedMenuItem('')
    }

    const handleChangePasswordModalClose = () => {
        setShowChangePasswordModal(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    const handleUserInfoChange = (field: string, value: string) => {
        setEditUserInfo(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleUserInfoSubmit = () => {
        // 유효성 검사
        if (!editUserInfo.name.trim()) {
            alert('이름을 입력해주세요.')
            return
        }
        if (!editUserInfo.email.trim()) {
            alert('이메일을 입력해주세요.')
            return
        }
        if (!editUserInfo.phone.trim()) {
            alert('전화번호를 입력해주세요.')
            return
        }

        // currentUser 업데이트
        const updatedUser: User = {
            ...user!,
            name: editUserInfo.name,
            email: editUserInfo.email,
            phone: editUserInfo.phone,
            address: editUserInfo.address
        }
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))

        // users 배열에서도 해당 사용자 정보 업데이트
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
        const updatedUsers = existingUsers.map((existingUser: any) => {
            if (existingUser.id === user?.id) {
                return {
                    ...existingUser,
                    name: editUserInfo.name,
                    email: editUserInfo.email,
                    phone: editUserInfo.phone,
                    address: editUserInfo.address
                }
            }
            return existingUser
        })
        localStorage.setItem('users', JSON.stringify(updatedUsers))

        // 상태 업데이트
        setUser(updatedUser)
        
        alert('회원정보가 성공적으로 변경되었습니다.')
        setShowUserInfoModal(false)
    }

    const handleUserInfoModalClose = () => {
        setShowUserInfoModal(false)
        // 원래 정보로 되돌리기
        setEditUserInfo({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || ''
        })
    }

    const handleUserUpdate = (updatedUser: User) => {
        setUser(updatedUser)
    }

    const handleMembershipBenefitsClick = () => {
        setShowMembershipModal(true)
    }

    const handleMembershipModalClose = () => {
        setShowMembershipModal(false)
    }


    // 주문 상태별 필터링
    const filteredOrders = orders.filter(order => {
        if (selectedOrderStatus === '전체') return true
        return order.status === selectedOrderStatus
    })
    
    console.log(`🔍 필터링 결과: 전체 ${orders.length}개 → 필터링 후 ${filteredOrders.length}개 (필터: ${selectedOrderStatus})`)

    // 주문 상세 보기
    const handleOrderDetailClick = (order: Order) => {
        setSelectedOrder(order)
        setShowOrderDetailModal(true)
    }

    // 주문 취소
    const handleOrderCancel = async (orderId: string) => {
        const reason = prompt('주문 취소 사유를 입력해주세요:')
        if (!reason) return

        try {
            const success = await cancelOrder(orderId, reason)
            if (success) {
                // 주문 목록 새로고침
                await loadOrders()
                alert('주문 취소 요청이 접수되었습니다. 관리자 검토 후 처리됩니다.')
            } else {
                alert('주문 취소 요청에 실패했습니다.')
            }
        } catch (error) {
            console.error('주문 취소 중 오류 발생:', error)
            alert('주문 취소 중 오류가 발생했습니다.')
        }
    }

    // 반품 신청
    const handleReturnRequest = (orderId: string) => {
        const reason = prompt('반품 사유를 입력해주세요:')
        if (reason) {
            const updatedOrders = orders.map(order => {
                if (order.id === orderId) {
                    return {
                        ...order,
                        status: '반품신청' as const,
                        return_reason: reason,
                        updated_at: new Date().toISOString()
                    }
                }
                return order
            })
            setOrders(updatedOrders)
            localStorage.setItem('orders', JSON.stringify(updatedOrders))
            alert('반품 신청이 완료되었습니다.')
        }
    }

    if (loading) {
        return <div>로딩중...</div>
    }

    if (!user) {
        return <div>로딩중...</div>
    }

    return (
        <div className="py-10 min-h-screen bg-gray-50 w-full">
            <div className="max-w-7xl mx-auto px-5 w-full box-border">
                {/* Breadcrumb */}
                <div className="text-sm text-gray-600 mb-8 p-0">
                    <span className="text-gray-600">Home</span>
                    <span className="mx-2 text-gray-400">&gt;</span>
                    <span className="text-gray-600">MyPage</span>
                </div>

                {/* 멤버십 정보 배너 */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-200 rounded-xl p-8 mb-8 shadow-lg">
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-300">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${
                                userGrade.currentGrade === 'FAMILY' ? 'bg-gradient-to-br from-yellow-400 to-yellow-300' :
                                userGrade.currentGrade === 'SILVER' ? 'bg-gradient-to-br from-gray-400 to-gray-300' :
                                userGrade.currentGrade === 'GOLD' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                                userGrade.currentGrade === 'DIAMOND' ? 'bg-gradient-to-br from-blue-200 to-blue-400' :
                                'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}>
                                {userGrade.currentGrade.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-600 font-medium">{userGrade.currentGrade}</span>
                                <span className="text-lg font-semibold text-gray-800 mt-0.5">{user.name}</span>
                            </div>
                            <button 
                                className="bg-gray-800 text-white border-none py-2 px-4 rounded-full text-xs cursor-pointer transition-colors duration-300 ml-4 hover:bg-gray-600"
                                onClick={handleMembershipBenefitsClick}
                            >
                                등급혜택 확인하기
                            </button>
                        </div>
                        <div className="flex gap-10 flex-wrap">
                            <div className="flex flex-col items-center text-center">
                                <span className="text-sm text-gray-600 mb-1">쿠폰</span>
                                <span className="text-lg font-semibold text-gray-800">{availableCoupons.length}장</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-sm text-gray-600 mb-1">P.Point</span>
                                <span className="text-lg font-semibold text-gray-800">0P</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-sm text-gray-600 mb-1">디머니</span>
                                <span className="text-lg font-semibold text-gray-800">0원</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-sm text-gray-600 mb-1">예치금</span>
                                <span className="text-lg font-semibold text-gray-800">0원</span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-sm text-gray-600 mb-1">마이바우처</span>
                                <span className="text-lg font-semibold text-gray-800">0건</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-lg shadow-sm">
                        <h4 className="m-0 mb-4 text-base font-semibold text-gray-800">FAMILY 등급 혜택</h4>
                        <ul className="m-0 p-0 list-none flex gap-5">
                            <li className="text-sm text-gray-600 relative pl-4 before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">적립률 1% 추가</li>
                            <li className="text-sm text-gray-600 relative pl-4 before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">생일 쿠폰 제공</li>
                            <li className="text-sm text-gray-600 relative pl-4 before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">무료배송 혜택</li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-8 items-start w-full">
                    <div className="bg-white rounded-lg p-8 h-fit shadow-lg w-64 flex-shrink-0 relative z-10">
                        <div className="text-left mb-8 pb-5 border-b-2 border-gray-800">
                            <h3 className="text-2xl font-bold text-gray-800 m-0">PREMIUM</h3>
                        </div>

                        <nav className="block">
                            <div className="mb-8">
                                <h4 className="text-base font-semibold text-gray-800 m-0 mb-4">주문현황</h4>
                                <ul className="list-none p-0 m-0">
                                    <li 
                                        className="text-sm text-gray-600 py-3 px-4 cursor-pointer transition-all duration-300 rounded-md mb-1 select-none relative z-10 block hover:text-gray-800 hover:bg-gray-50"
                                        onClick={() => navigate('/order-tracking')}
                                    >
                                        주문접수/배송조회
                                    </li>
                                </ul>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-base font-semibold text-gray-800 m-0 mb-4">쇼핑통장</h4>
                                <ul className="list-none p-0 m-0">
                                    <li 
                                        className="text-sm text-gray-600 py-3 px-4 cursor-pointer transition-all duration-300 rounded-md mb-1 select-none relative z-10 block hover:text-gray-800 hover:bg-gray-50"
                                        onClick={() => navigate('/coupon')}
                                    >
                                        쿠폰
                                    </li>
                                </ul>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-base font-semibold text-gray-800 m-0 mb-4">쇼핑백</h4>
                                <ul className="list-none p-0 m-0">
                                    <li 
                                        className="text-sm text-gray-600 py-3 px-4 cursor-pointer transition-all duration-300 rounded-md mb-1 select-none relative z-10 block hover:text-gray-800 hover:bg-gray-50"
                                        onClick={() => navigate('/wishlist')}
                                    >
                                        찜
                                    </li>
                                    <li 
                                        className="text-sm text-gray-600 py-3 px-4 cursor-pointer transition-all duration-300 rounded-md mb-1 select-none relative z-10 block hover:text-gray-800 hover:bg-gray-50"
                                        onClick={() => navigate('/recent')}
                                    >
                                        최근 본 상품
                                    </li>
                                </ul>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-base font-semibold text-gray-800 m-0 mb-4">나의 정보</h4>
                                <ul className="list-none p-0 m-0">
                                    <li 
                                        className="text-sm text-gray-4 cursor-pointer transition-all duration-300 rounded-md mb-1 select-none relative z-10 block hover:text-gray-800 hover:bg-gray-50"
                                        onClick={() => handlePersonalInfoClick('회원정보변경')}
                                    >
                                        회원정보변경
                                    </li>
                                    <li 
                                        className="text-sm text-gray-600 py-3 px-4 cursor-pointer transition-all duration-300 rounded-md mb-1 select-none relative z-10 block hover:text-gray-800 hover:bg-gray-50"
                                        onClick={() => navigate('/inquiry-history')}
                                    >
                                        1:1 문의내역
                                    </li>
                                </ul>
                            </div>
                        </nav>
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-8 shadow-lg min-h-[500px] block">
                        <div className="w-full block">
                            {/* 주문현황 섹션 */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-800 m-0 mb-6">
                                    주문현황 <span className="text-sm font-normal text-gray-600">(최근 1개월 기준)</span>
                                </h3>
                                <div className="flex items-center justify-between mb-8 py-5">
                                    <div className="flex flex-col items-center text-center flex-1">
                                        <div className="text-2xl mb-2">📋</div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-600">주문접수</span>
                                            <span className="text-lg font-semibold text-gray-800">{orderStats.status_counts['주문접수']}건</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 text-base mx-2">→</div>
                                    <div className="flex flex-col items-center text-center flex-1">
                                        <div className="text-2xl mb-2">💳</div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-600">결제완료</span>
                                            <span className="text-lg font-semibold text-gray-800">{orderStats.status_counts['결제완료']}건</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 text-base mx-2">→</div>
                                    <div className="flex flex-col items-center text-center flex-1">
                                        <div className="text-2xl mb-2">📦</div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-600">상품준비</span>
                                            <span className="text-lg font-semibold text-gray-800">{orderStats.status_counts['상품준비']}건</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 text-base mx-2">→</div>
                                    <div className="flex flex-col items-center text-center flex-1">
                                        <div className="text-2xl mb-2">🚚</div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-600">배송중</span>
                                            <span className="text-lg font-semibold text-gray-800">{orderStats.status_counts['배송중']}건</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 text-base mx-2">→</div>
                                    <div className="flex flex-col items-center text-center flex-1">
                                        <div className="text-2xl mb-2">📋</div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-600">픽업가능</span>
                                            <span className="text-lg font-semibold text-gray-800">{orderStats.status_counts['픽업가능'] || 0}건</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 text-base mx-2">→</div>
                                    <div className="flex flex-col items-center text-center flex-1">
                                        <div className="text-2xl mb-2">💻</div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-600">배송/픽업완료</span>
                                            <span className="text-lg font-semibold text-gray-800">{orderStats.status_counts['배송완료']}건</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-5">
                                    <div className="grid grid-cols-4 gap-5">
                                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
                                            <span className="text-sm text-gray-600 mb-2">1:1문의내역</span>
                                            <span className="text-base font-semibold text-gray-800">{inquiryCount}건</span>
                                        </div>
                                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
                                            <span className="text-sm text-gray-600 mb-2">상품Q&A</span>
                                            <span className="text-base font-semibold text-gray-800">0건</span>
                                        </div>
                                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
                                            <span className="text-sm text-gray-600 mb-2">내가 쓴 상품평</span>
                                            <span className="text-base font-semibold text-gray-800">0건</span>
                                        </div>
                                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-md">
                                            <span className="text-sm text-gray-600 mb-2">이벤트 응모/당첨내역</span>
                                            <span className="text-base font-semibold text-gray-800">0/0건</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 주문 상태별 필터링 */}
                            <div className="mb-6">
                                <div className="flex gap-2 flex-wrap">
                                    {['전체', '주문접수', '결제완료', '상품준비', '배송중', '배송완료', '주문취소', '반품신청'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setSelectedOrderStatus(status)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                                selectedOrderStatus === status
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 최근 주문 배송내역 */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold text-gray-800 m-0">
                                        주문 내역 <span className="text-sm font-normal text-gray-600">({filteredOrders.length}건)</span>
                                    </h3>
                                    <button 
                                        onClick={() => navigate('/order-tracking')}
                                        className="bg-transparent border-none text-gray-600 text-sm cursor-pointer py-1 px-2 rounded transition-colors duration-300 hover:bg-gray-50"
                                    >
                                        전체보기 →
                                    </button>
                                </div>
                                <div className="rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-6 bg-gray-50 py-4 px-5 text-sm font-semibold text-gray-800 gap-5">
                                        <span>주문일</span>
                                        <span>주문번호</span>
                                        <span>주문금액</span>
                                        <span>주문상태</span>
                                        <span>상품정보</span>
                                        <span>관리</span>
                                    </div>
                                    {filteredOrders.length > 0 ? (
                                        filteredOrders.map((order, index) => (
                                            <div key={order.id || index} className="grid grid-cols-6 py-4 px-5 text-sm text-gray-800 gap-5 border-b border-gray-100 last:border-b-0">
                                                <span>{new Date(order.order_date).toLocaleDateString('ko-KR')}</span>
                                                <span className="font-medium">{order.id || 'N/A'}</span>
                                                <span className="font-semibold">{order.total_amount.toLocaleString()}원</span>
                                                <span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        order.status === '배송완료' ? 'bg-green-100 text-green-800' :
                                                        order.status === '배송중' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === '상품준비' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === '결제완료' ? 'bg-purple-100 text-purple-800' :
                                                        order.status === '주문취소' ? 'bg-red-100 text-red-800' :
                                                        order.status === '반품신청' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </span>
                                                <span>
                                                    {order.items.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="text-xs text-gray-600 mb-1">
                                                            {item.name} ({item.quantity}개)
                                                            {item.size && <span className="ml-1">- {item.size}</span>}
                                                            {item.color && <span className="ml-1">- {item.color}</span>}
                                                        </div>
                                                    ))}
                                                </span>
                                                <span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleOrderDetailClick(order)}
                                                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                                                        >
                                                            상세보기
                                                        </button>
                                                        {order.status === '결제완료' && (
                                                            <button
                                                                onClick={() => order.id && handleOrderCancel(order.id)}
                                                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                                            >
                                                                취소
                                                            </button>
                                                        )}
                                                        {order.status === '배송완료' && (
                                                            <button
                                                                onClick={() => order.id && handleReturnRequest(order.id)}
                                                                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-red-200"
                                                            >
                                                                반품
                                                            </button>
                                                        )}
                                                    </div>
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="min-h-[100px] flex items-center justify-center">
                                            <div className="text-center text-gray-600 py-10">
                                                <p className="m-0 text-base">
                                                    {selectedOrderStatus === '전체' 
                                                        ? '주문내역이 없습니다.' 
                                                        : `${selectedOrderStatus} 상태의 주문이 없습니다.`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 비밀번호 확인 모달 */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-gray-200">
                                <h3 className="m-0 text-lg font-semibold text-gray-800">회원정보 확인</h3>
                                <button 
                                    className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-gray-800"
                                    onClick={handleModalClose}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-8">
                                <p className="m-0 mb-5 text-gray-800 text-base leading-relaxed">
                                    개인정보 보호를 위해 비밀번호를 다시 한번 확인해 주세요.
                                </p>
                                <div className="mb-5">
                                    <label className="block mb-2 font-semibold text-gray-800">비밀번호</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="비밀번호를 입력하세요"
                                        className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                        onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed m-0">
                                    * 고객님의 개인정보 보호를 위해 비밀번호를 다시 확인합니다.<br />
                                    * 비밀번호 분실 시 비밀번호 찾기를 이용해 주세요.
                                </p>
                            </div>
                            <div className="flex gap-2.5 p-5 border-t border-gray-200 justify-end">
                                <button 
                                    className="py-3 px-6 border-none rounded text-sm cursor-pointer transition-colors duration-300 bg-gray-50 text-gray-600 hover:bg-gray-200"
                                    onClick={handleModalClose}
                                >
                                    취소
                                </button>
                                <button 
                                    className="py-3 px-6 border-none rounded text-sm cursor-pointer transition-colors duration-300 bg-gray-800 text-white hover:bg-gray-600"
                                    onClick={handlePasswordSubmit}
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 비밀번호 변경 모달 */}
                {showChangePasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-gray-200">
                                <h3 className="m-0 text-lg font-semibold text-gray-800">비밀번호 변경</h3>
                                <button 
                                    className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-gray-800"
                                    onClick={handleChangePasswordModalClose}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <label className="block mb-2 font-semibold text-gray-800">현재 비밀번호</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="현재 비밀번호를 입력하세요"
                                        className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2 font-semibold text-gray-800">새 비밀번호</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="새 비밀번호를 입력하세요"
                                        className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2 font-semibold text-gray-800">새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="새 비밀번호를 다시 입력하세요"
                                        className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                    />
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed m-0 mb-4">
                                    * 비밀번호는 8자 이상이어야 합니다.
                                </p>
                            </div>
                            <div className="flex gap-2.5 p-5 border-t border-gray-200 justify-end">
                                <button 
                                    className="py-3 px-6 border-none rounded text-sm cursor-pointer transition-colors duration-300 bg-gray-50 text-gray-600 hover:bg-gray-200"
                                    onClick={handleChangePasswordModalClose}
                                >
                                    취소
                                </button>
                                <button 
                                    className="py-3 px-6 border-none rounded text-sm cursor-pointer transition-colors duration-300 bg-gray-800 text-white hover:bg-gray-600"
                                    onClick={handleChangePassword}
                                >
                                    변경
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 회원정보 변경 모달 */}
                {showUserInfoModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-gray-200">
                                <h3 className="m-0 text-lg font-semibold text-gray-800">회원정보 변경</h3>
                                <button 
                                    className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-gray-800"
                                    onClick={handleUserInfoModalClose}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block mb-2 font-semibold text-gray-800">이름 *</label>
                                        <input
                                            type="text"
                                            value={editUserInfo.name}
                                            onChange={(e) => handleUserInfoChange('name', e.target.value)}
                                            placeholder="이름을 입력하세요"
                                            className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold text-gray-800">이메일 *</label>
                                        <input
                                            type="email"
                                            value={editUserInfo.email}
                                            onChange={(e) => handleUserInfoChange('email', e.target.value)}
                                            placeholder="이메일을 입력하세요"
                                            className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold text-gray-800">전화번호 *</label>
                                        <input
                                            type="tel"
                                            value={editUserInfo.phone}
                                            onChange={(e) => handleUserInfoChange('phone', e.target.value)}
                                            placeholder="전화번호를 입력하세요"
                                            className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold text-gray-800">주소</label>
                                        <input
                                            type="text"
                                            value={editUserInfo.address}
                                            onChange={(e) => handleUserInfoChange('address', e.target.value)}
                                            placeholder="주소를 입력하세요"
                                            className="w-full py-3 px-4 border border-gray-300 rounded focus:outline-none focus:border-gray-800 text-base box-border"
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">비밀번호 변경</h4>
                                    <p className="text-sm text-gray-600 mb-3">비밀번호를 변경하시려면 아래 버튼을 클릭하세요.</p>
                                    <button 
                                        className="bg-gray-800 text-white py-2 px-4 rounded text-sm hover:bg-gray-600 transition-colors"
                                        onClick={() => {
                                            setShowUserInfoModal(false)
                                            setShowChangePasswordModal(true)
                                        }}
                                    >
                                        비밀번호 변경
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2.5 p-5 border-t border-gray-200 justify-end">
                                <button 
                                    className="py-3 px-6 border-none rounded text-sm cursor-pointer transition-colors duration-300 bg-gray-50 text-gray-600 hover:bg-gray-200"
                                    onClick={handleUserInfoModalClose}
                                >
                                    취소
                                </button>
                                <button 
                                    className="py-3 px-6 border-none rounded text-sm cursor-pointer transition-colors duration-300 bg-gray-800 text-white hover:bg-gray-600"
                                    onClick={handleUserInfoSubmit}
                                >
                                    변경
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 멤버십 혜택 모달 */}
                {showMembershipModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col">
                            {/* 고정 헤더 */}
                            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-white rounded-t-xl flex-shrink-0 sticky top-0 z-10 shadow-sm">
                                <h3 className="m-0 text-lg font-semibold text-gray-800">멤버십 등급별 혜택</h3>
                                <button 
                                    className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-gray-800 transition-colors duration-200 hover:bg-gray-100 rounded-full"
                                    onClick={handleMembershipModalClose}
                                    title="닫기"
                                >
                                    ×
                                </button>
                            </div>
                            {/* 스크롤 가능한 컨텐츠 영역 */}
                            <div className="p-8 overflow-y-auto flex-1" style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#d1d5db #f3f4f6'
                            }}>
                                <div className="grid grid-cols-2 gap-5 mb-8">
                                    <div className="border-2 border-gray-300 rounded-xl p-5 transition-all duration-300 hover:border-gray-400 hover:shadow-lg border-gray-800 bg-gradient-to-br from-gray-50 to-gray-200">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-15 h-15 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                                                F
                                            </div>
                                            <div>
                                                <h4 className="m-0 mb-1 text-xl font-semibold text-gray-800">FAMILY</h4>
                                                <p className="m-0 mb-2 text-gray-600 text-sm">첫 구매 시 자동 등급</p>
                                                {userGrade.currentGrade === 'FAMILY' && (
                                                    <span className="bg-gray-800 text-white py-1 px-2 rounded-full text-xs font-semibold">현재 등급</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="m-0 mb-3 text-base font-semibold text-gray-800">혜택</h5>
                                            <ul className="m-0 p-0 list-none">
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">첫 구매 웰컴 쿠폰</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">1회 무료배송 쿠폰</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="border-2 border-gray-300 rounded-xl p-5 transition-all duration-300 hover:border-gray-400 hover:shadow-lg">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-15 h-15 bg-gradient-to-br from-gray-400 to-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-800">
                                                S
                                            </div>
                                            <div>
                                                <h4 className="m-0 mb-1 text-xl font-semibold text-gray-800">SILVER</h4>
                                                <p className="m-0 mb-2 text-gray-600 text-sm">연간 구매금액 500만원 이상</p>
                                                {userGrade.currentGrade === 'SILVER' && (
                                                    <span className="bg-gray-800 text-white py-1 px-2 rounded-full text-xs font-semibold">현재 등급</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="m-0 mb-3 text-base font-semibold text-gray-800">혜택</h5>
                                            <ul className="m-0 p-0 list-none">
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">1% 적립률</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">생일 쿠폰</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">무료배송</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="border-2 border-gray-300 rounded-xl p-5 transition-all duration-300 hover:border-gray-400 hover:shadow-lg">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-15 h-15 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                                                G
                                            </div>
                                            <div>
                                                <h4 className="m-0 mb-1 text-xl font-semibold text-gray-800">GOLD</h4>
                                                <p className="m-0 mb-2 text-gray-600 text-sm">연간 구매금액 3,000만원 이상</p>
                                                {userGrade.currentGrade === 'GOLD' && (
                                                    <span className="bg-gray-800 text-white py-1 px-2 rounded-full text-xs font-semibold">현재 등급</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="m-0 mb-3 text-base font-semibold text-gray-800">혜택</h5>
                                            <ul className="m-0 p-0 list-none">
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">2% 적립률</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">생일·특별 쿠폰</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">당일배송 무료 혹은 할인</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">VIP 고객센터</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="border-2 border-gray-300 rounded-xl p-5 transition-all duration-300 hover:border-gray-400 hover:shadow-lg">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-15 h-15 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full flex items-center justify-center text-2xl font-bold text-gray-800">
                                                D
                                            </div>
                                            <div>
                                                <h4 className="m-0 mb-1 text-xl font-semibold text-gray-800">DIAMOND</h4>
                                                <p className="m-0 mb-2 text-gray-600 text-sm">연간 구매금액 8,000만원 이상</p>
                                                {userGrade.currentGrade === 'DIAMOND' && (
                                                    <span className="bg-gray-800 text-white py-1 px-2 rounded-full text-xs font-semibold">현재 등급</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="m-0 mb-3 text-base font-semibold text-gray-800">혜택</h5>
                                            <ul className="m-0 p-0 list-none">
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">3~4% 적립</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">매월 프리미엄 쿠폰</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">모든 배송 무료</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">전용 고객센터 & 컨시어지</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">한정판 우선 구매</li>
                                                <li className="py-1.5 text-sm text-gray-600 relative pl-5 before:content-['•'] before:absolute before:left-0 before:text-gray-800 before:font-bold">연 2회 초대 이벤트</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Prestige VIP 등급 - 전체 너비로 크게 표시 */}
                                <div className="border-2 border-gradient-to-r from-purple-400 to-pink-400 rounded-xl p-8 mb-8 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                                            P
                                        </div>
                                        <div>
                                            <h4 className="m-0 mb-2 text-3xl font-bold text-gray-800">PRESTIGE VIP</h4>
                                            <p className="m-0 mb-3 text-gray-600 text-lg">연간 구매금액 1억 2,000만원 이상</p>
                                            {userGrade.currentGrade === 'PRESTIGE VIP' ? (
                                                <span className="bg-gray-800 text-white py-2 px-4 rounded-full text-sm font-bold shadow-md">현재 등급</span>
                                            ) : (
                                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-full text-sm font-bold shadow-md">최고 등급</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="m-0 mb-4 text-xl font-bold text-gray-800">프리미엄 혜택</h5>
                                        <div className="grid grid-cols-2 gap-6">
                                            <ul className="m-0 p-0 list-none">
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['✨'] before:absolute before:left-0 before:text-purple-500 before:font-bold">5% 적립</li>
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['🎁'] before:absolute before:left-0 before:text-purple-500 before:font-bold">월별 프리미엄 혜택</li>
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['🏛️'] before:absolute before:left-0 before:text-purple-500 before:font-bold">VIP 라운지 및 전용 컨시어지</li>
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['🎪'] before:absolute before:left-0 before:text-purple-500 before:font-bold">연 4회 초대 프라이빗 세일</li>
                                            </ul>
                                            <ul className="m-0 p-0 list-none">
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['👑'] before:absolute before:left-0 before:text-purple-500 before:font-bold">전담 VIP 매니저 서비스</li>
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['💎'] before:absolute before:left-0 before:text-purple-500 before:font-bold">한정판 상품 최우선 구매</li>
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['🌟'] before:absolute before:left-0 before:text-purple-500 before:font-bold">브랜드 쇼룸 개별 투어</li>
                                                <li className="py-2 text-base text-gray-700 relative pl-6 before:content-['💫'] before:absolute before:left-0 before:text-purple-500 before:font-bold">24시간 VIP 전용 고객센터</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h5 className="m-0 mb-4 text-lg font-semibold text-gray-800">다음 등급까지</h5>
                                    <div>
                                        {userGrade.nextGrade ? (
                                            <>
                                                <span className="block mb-3 text-gray-600 text-sm">
                                                    {userGrade.nextGrade} 등급까지 {((userGrade.nextGradeRequired || 0) - userGrade.totalPurchaseAmount).toLocaleString()}원 더 구매하세요!
                                                </span>
                                                <div className="w-full h-2 bg-gray-300 rounded overflow-hidden mb-2.5">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-gray-800 to-gray-600 transition-all duration-500" 
                                                        style={{ width: `${userGrade.progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-600">
                                                    <span>현재: {userGrade.totalPurchaseAmount.toLocaleString()}원</span>
                                                    <span>목표: {(userGrade.nextGradeRequired || 0).toLocaleString()}원</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <span className="block mb-3 text-purple-600 text-sm font-semibold">
                                                    🎉 최고 등급 달성! 축하합니다! 🎉
                                                </span>
                                                <div className="w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded mb-2.5"></div>
                                                <div className="text-xs text-gray-600">
                                                    <span>총 구매금액: {userGrade.totalPurchaseAmount.toLocaleString()}원</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 주문 상세 모달 */}
                {showOrderDetailModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="flex justify-between items-center p-5 border-b border-gray-200">
                                <h3 className="m-0 text-lg font-semibold text-gray-800">주문 상세 정보</h3>
                                <button 
                                    className="bg-transparent border-none text-2xl text-gray-400 cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-gray-800"
                                    onClick={() => setShowOrderDetailModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-3">주문 정보</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">주문번호:</span>
                                                <span className="font-medium">{selectedOrder.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">주문일:</span>
                                                <span className="font-medium">
                                                    {new Date(selectedOrder.order_date).toLocaleString('ko-KR')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">주문상태:</span>
                                                <span className="font-medium">{selectedOrder.status}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">결제방법:</span>
                                                <span className="font-medium">{selectedOrder.payment_method}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">총 결제금액:</span>
                                                <span className="font-bold text-lg">{selectedOrder.total_amount.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-3">배송 정보</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">수령인:</span>
                                                <span className="font-medium">{selectedOrder.recipient_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">연락처:</span>
                                                <span className="font-medium">{selectedOrder.recipient_phone}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">배송주소:</span>
                                                <span className="font-medium text-right max-w-[200px]">{selectedOrder.shipping_address}</span>
                                            </div>
                                            {selectedOrder.tracking_number && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">운송장번호:</span>
                                                    <span className="font-medium">{selectedOrder.tracking_number}</span>
                                                </div>
                                            )}
                                            {selectedOrder.estimated_delivery && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">예상배송일:</span>
                                                    <span className="font-medium">{selectedOrder.estimated_delivery}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="border-t pt-6">
                                    <h4 className="font-semibold text-gray-800 mb-3">주문 상품</h4>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="flex gap-4 p-3 border border-gray-100 rounded-lg">
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                                <div className="flex-1">
                                                    <h5 className="font-medium text-gray-800">{item.name}</h5>
                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        {item.brand && <div>브랜드: {item.brand}</div>}
                                                        {item.size && <div>사이즈: {item.size}</div>}
                                                        {item.color && <div>색상: {item.color}</div>}
                                                        <div>수량: {item.quantity}개</div>
                                                        <div>가격: {item.price.toLocaleString()}원</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedOrder.cancel_reason && (
                                    <div className="border-t pt-6">
                                        <h4 className="font-semibold text-gray-800 mb-3">취소 사유</h4>
                                        <p className="text-gray-600">{selectedOrder.cancel_reason}</p>
                                    </div>
                                )}

                                {selectedOrder.return_reason && (
                                    <div className="border-t pt-6">
                                        <h4 className="font-semibold text-gray-800 mb-3">반품 사유</h4>
                                        <p className="text-gray-600">{selectedOrder.return_reason}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2.5 p-5 border-t border-gray-200 justify-end">
                                <button 
                                    className="py-3 px-6 border-none rounded text-sm cursor-pointer transition-colors duration-300 bg-gray-800 text-white hover:bg-gray-600"
                                    onClick={() => setShowOrderDetailModal(false)}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* UserInfoModal */}
                {showUserInfoModal && (
                    <UserInfoModal
                        isOpen={showUserInfoModal}
                        user={user}
                        onClose={handleUserInfoModalClose}
                        onUserUpdate={handleUserUpdate}
                    />
                )}
            </div>
        </div>
    )
}

export default MyPage