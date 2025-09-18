import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  User,
  ShoppingCart
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { getInquiriesByBrand, replyToInquiry, updateInquiryStatus } from '../../../services/inquiryService';
import { useAuth } from '../../shared/contexts/AuthContext';

const CustomerService = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');

  // 현재 입점사의 브랜드명 가져오기 (인증 정보 기반)
  useEffect(() => {
    const merchantBrand = 
      user?.user_metadata?.brand ||
      user?.user_metadata?.company ||
      user?.user_metadata?.name ||
      '알 수 없는 브랜드';
    setBrandName(merchantBrand);
    console.log('🏷️ 입점사 브랜드(인증):', merchantBrand);
  }, [user?.user_metadata?.brand, user?.user_metadata?.company, user?.user_metadata?.name]);

  // 브랜드별 문의 목록 로드
  useEffect(() => {
    if (brandName) {
      loadInquiries();
    }
  }, [brandName]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      console.log('🔄 입점사 고객서비스: 문의 목록 로드 시작');
      
      const data = await getInquiriesByBrand(brandName);
      
      // 데이터베이스 형식을 UI 형식으로 변환
      const formattedInquiries = data.map(inquiry => ({
        id: inquiry.id,
        customerName: inquiry.users?.name || '알 수 없음',
        customerEmail: inquiry.email,
        customerPhone: inquiry.phone || inquiry.users?.phone || '미등록',
        category: inquiry.category,
        subject: inquiry.title,
        content: inquiry.content,
        status: inquiry.status,
        priority: inquiry.priority,
        submittedDate: new Date(inquiry.created_at).toLocaleString('ko-KR'),
        assignedTo: inquiry.assigned_to || '미배정',
        tenant: inquiry.product_brand || inquiry.tenant || brandName,
        reply: inquiry.reply_content,
        replyDate: inquiry.reply_date ? new Date(inquiry.reply_date).toLocaleString('ko-KR') : null,
        orderId: inquiry.order_id,
        productName: inquiry.product_name || '일반 문의'
      }));
      
      setInquiries(formattedInquiries);
      console.log(`✅ 입점사 고객서비스: ${formattedInquiries.length}건 문의 로드 완료`);
    } catch (error) {
      console.error('문의 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: '답변대기', label: '답변대기' },
    { value: '처리중', label: '처리중' },
    { value: '답변완료', label: '답변완료' }
  ];

  const categoryOptions = [
    { value: 'all', label: '전체' },
    { value: '회원', label: '회원' },
    { value: '상품', label: '상품' },
    { value: '주문/결제', label: '주문/결제' },
    { value: '배송', label: '배송' }
  ];

  // 필터링된 문의 목록
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || inquiry.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || inquiry.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });


  // 답변 등록
  const handleReply = async (inquiryId) => {
    if (!replyText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      console.log('💬 답변 등록 시작:', inquiryId);
      
      // 데이터베이스에 답변 저장
      const success = await replyToInquiry(inquiryId, replyText, brandName);
      
      if (success) {
        // UI 상태 업데이트
        setInquiries(inquiries.map(inquiry => 
          inquiry.id === inquiryId ? { 
            ...inquiry, 
            reply: replyText,
            status: '답변완료',
            assignedTo: brandName,
            replyDate: new Date().toLocaleString('ko-KR')
          } : inquiry
        ));
        
        setReplyText('');
        setShowDetailModal(false);
        alert('답변이 등록되었습니다.');
        console.log('✅ 답변 등록 완료');
      } else {
        alert('답변 등록 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('답변 등록 실패:', error);
      alert('답변 등록 중 오류가 발생했습니다.');
    }
  };

  // 문의 상세 정보 보기
  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyText(inquiry.reply || '');
    setShowDetailModal(true);
  };

  const handleViewOrder = (orderId) => {
    // 주문내역 페이지로 이동 (새 탭에서 열기)
    window.open(`/admin/orders?orderId=${orderId}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      '답변대기': 'badge-warning',
      '처리중': 'badge-info',
      '답변완료': 'badge-success'
    };
    return statusMap[status] || 'badge-info';
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      '높음': 'badge-danger',
      '보통': 'badge-warning',
      '낮음': 'badge-success'
    };
    return priorityMap[priority] || 'badge-info';
  };

  // 답변 대기 중인 문의 수
  const pendingCount = inquiries.filter(i => i.status === '답변대기').length;

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>고객 서비스 관리 - {brandName}</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>문의 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gray-50">
      {/* 헤더 영역 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">고객 서비스 관리</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {brandName} 브랜드 관련 문의를 관리하고 빠르게 응답하세요
                </p>
              </div>
              
              {/* 통계 카드 */}
              <div className="mt-4 sm:mt-0 flex gap-4">
                <div 
                  className={`rounded-lg px-4 py-3 min-w-[100px] cursor-pointer transition-all hover:shadow-md ${
                    selectedStatus === 'all' ? 'bg-blue-100 border-2 border-blue-300' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                  onClick={() => setSelectedStatus('all')}
                >
                  <div className="text-2xl font-bold text-blue-600">{inquiries.length}</div>
                  <div className="text-sm text-blue-600">전체 문의</div>
                </div>
                <div 
                  className={`rounded-lg px-4 py-3 min-w-[100px] cursor-pointer transition-all hover:shadow-md ${
                    selectedStatus === '답변대기' ? 'bg-orange-100 border-2 border-orange-300' : 'bg-orange-50 hover:bg-orange-100'
                  }`}
                  onClick={() => setSelectedStatus('답변대기')}
                >
                  <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                  <div className="text-sm text-orange-600">답변 대기</div>
                </div>
                <div 
                  className={`rounded-lg px-4 py-3 min-w-[100px] cursor-pointer transition-all hover:shadow-md ${
                    selectedStatus === '답변완료' ? 'bg-green-100 border-2 border-green-300' : 'bg-green-50 hover:bg-green-100'
                  }`}
                  onClick={() => setSelectedStatus('답변완료')}
                >
                  <div className="text-2xl font-bold text-green-600">
                    {inquiries.filter(i => i.status === '답변완료').length}
                  </div>
                  <div className="text-sm text-green-600">답변 완료</div>
                </div>
              </div>
            </div>
            
            {pendingCount > 0 && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle size={20} className="text-orange-600 mr-2" />
                  <span className="text-orange-800 font-medium">
                    답변 대기 중인 문의가 {pendingCount}개 있습니다.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 검색 및 필터 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title">고객 서비스 관리</h2>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#666'
                }} 
              />
              <input
                type="text"
                placeholder="제목, 고객명, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.875rem',
                minWidth: '140px'
              }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '0.875rem',
                minWidth: '140px'
              }}
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button className="btn" style={{ background: '#6c757d', color: 'white' }}>
              <Filter size={16} />
              필터
            </button>
          </div>
        </div>

        {/* 문의 목록 */}
        <div className="card">
          {filteredInquiries.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">문의가 없습니다</h3>
              <p className="text-gray-500">
                {inquiries.length === 0 ? 
                  `${brandName} 브랜드 관련 문의가 없습니다.` : 
                  '검색 조건에 맞는 문의가 없습니다.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      문의 내용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상품명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User size={20} className="text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {inquiry.customerName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail size={12} className="mr-1" />
                              {inquiry.customerEmail}
                            </div>
                            {inquiry.customerPhone !== '미등록' && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone size={12} className="mr-1" />
                                {inquiry.customerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {inquiry.subject}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs">
                          {inquiry.content.length > 50 
                            ? `${inquiry.content.substring(0, 50)}...` 
                            : inquiry.content
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {inquiry.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inquiry.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inquiry.priority === '높음' ? 'bg-red-100 text-red-800' :
                          inquiry.priority === '보통' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {inquiry.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          inquiry.status === '답변완료' ? 'bg-green-100 text-green-800' :
                          inquiry.status === '처리중' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {inquiry.submittedDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleViewInquiry(inquiry)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-2 rounded-lg hover:bg-blue-50"
                          title="상세보기 및 답변"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* 문의 상세 모달 */}
    {showDetailModal && selectedInquiry && (
        <Modal 
          isOpen={showDetailModal} 
          onClose={() => setShowDetailModal(false)}
          title="문의 상세 정보"
          size="large"
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">고객 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">고객명</label>
                  <div className="text-sm text-gray-900">{selectedInquiry.customerName}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">이메일</label>
                  <div className="text-sm text-gray-900">{selectedInquiry.customerEmail}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">연락처</label>
                  <div className="text-sm text-gray-900">{selectedInquiry.customerPhone}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">카테고리</label>
                  <div className="text-sm text-gray-900">{selectedInquiry.category}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">상품명</label>
                  <div className="text-sm text-gray-900">{selectedInquiry.productName}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">우선순위</label>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedInquiry.priority === '높음' ? 'bg-red-100 text-red-800' :
                      selectedInquiry.priority === '보통' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedInquiry.priority}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">상태</label>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedInquiry.status === '답변완료' ? 'bg-green-100 text-green-800' :
                      selectedInquiry.status === '처리중' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedInquiry.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">등록일</label>
                  <div className="text-sm text-gray-900">{selectedInquiry.submittedDate}</div>
                </div>
              </div>
              
              {/* 주문내역 버튼 */}
              {selectedInquiry.orderId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-600">관련 주문</label>
                      <div className="text-sm text-gray-900">주문 ID: {selectedInquiry.orderId}</div>
                    </div>
                    <button
                      onClick={() => handleViewOrder(selectedInquiry.orderId)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      주문내역 보기
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">문의 내용</h3>
              <div className="space-y-3">
                <h4 className="text-base font-medium text-gray-900">{selectedInquiry.subject}</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedInquiry.content}</p>
              </div>
            </div>

            {selectedInquiry.reply && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">답변</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedInquiry.reply}</p>
                  {selectedInquiry.replyDate && (
                    <div className="text-xs text-gray-500">
                      답변일: {selectedInquiry.replyDate}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedInquiry.reply ? '답변 수정' : '답변 작성'}
              </h3>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답변 내용을 입력하세요..."
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            {selectedInquiry && (
              <button 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                onClick={() => handleReply(selectedInquiry.id)}
              >
                <MessageSquare size={16} className="mr-2" />
                {selectedInquiry.reply ? '답변 수정' : '답변 등록'}
              </button>
            )}
            <button 
              className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              onClick={() => setShowDetailModal(false)}
            >
              닫기
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerService;
