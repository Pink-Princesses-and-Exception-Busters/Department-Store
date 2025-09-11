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
  User
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
    { value: '답변완료', label: '답변완료' },
    { value: '종료', label: '종료' }
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

  // 문의 상태 변경
  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      console.log('🔄 문의 상태 변경:', inquiryId, newStatus);
      
      // 데이터베이스에 상태 변경 저장
      const success = await updateInquiryStatus(inquiryId, newStatus, brandName);
      
      if (success) {
        // UI 상태 업데이트
        setInquiries(inquiries.map(inquiry => 
          inquiry.id === inquiryId ? { 
            ...inquiry, 
            status: newStatus,
            assignedTo: newStatus === '처리중' ? brandName : inquiry.assignedTo
          } : inquiry
        ));
        alert(`문의 상태가 '${newStatus}'로 변경되었습니다.`);
        console.log('✅ 문의 상태 변경 완료');
      } else {
        alert('문의 상태 변경 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('문의 상태 변경 실패:', error);
      alert('문의 상태 변경 중 오류가 발생했습니다.');
    }
  };

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

  const getStatusBadge = (status) => {
    const statusMap = {
      '답변대기': 'badge-warning',
      '처리중': 'badge-info',
      '답변완료': 'badge-success',
      '종료': 'badge-secondary'
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
    <div className="page">
      <div className="page-header">
        <h1>고객 서비스 관리 - {brandName}</h1>
        {pendingCount > 0 && (
          <div className="alert alert-warning">
            <AlertCircle size={16} />
            답변 대기 중인 문의가 {pendingCount}개 있습니다.
          </div>
        )}
        <div className="page-stats">
          <div className="stat-card">
            <div className="stat-label">전체 문의</div>
            <div className="stat-value">{inquiries.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">답변 대기</div>
            <div className="stat-value text-warning">{pendingCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">답변 완료</div>
            <div className="stat-value text-success">
              {inquiries.filter(i => i.status === '답변완료').length}
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="제목, 고객명, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 문의 목록 */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>고객 정보</th>
              <th>제목</th>
              <th>카테고리</th>
              <th>상품명</th>
              <th>우선순위</th>
              <th>상태</th>
              <th>등록일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">
                        <User size={14} />
                        {inquiry.customerName}
                      </div>
                      <div className="customer-contact">
                        <Mail size={12} />
                        {inquiry.customerEmail}
                      </div>
                      {inquiry.customerPhone !== '미등록' && (
                        <div className="customer-contact">
                          <Phone size={12} />
                          {inquiry.customerPhone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="inquiry-title">
                      {inquiry.subject}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {inquiry.category}
                    </span>
                  </td>
                  <td>
                    <span className="product-name">
                      {inquiry.productName}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getPriorityBadge(inquiry.priority)}`}>
                      {inquiry.priority}
                    </span>
                  </td>
                  <td>
                    <select 
                      value={inquiry.status}
                      onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                      className={`status-select ${getStatusBadge(inquiry.status)}`}
                    >
                      <option value="답변대기">답변대기</option>
                      <option value="처리중">처리중</option>
                      <option value="답변완료">답변완료</option>
                      <option value="종료">종료</option>
                    </select>
                  </td>
                  <td>
                    <div className="date-info">
                      <Clock size={12} />
                      {inquiry.submittedDate}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleViewInquiry(inquiry)}
                        title="상세 보기"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewInquiry(inquiry)}
                        title="답변하기"
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center">
                  {inquiries.length === 0 ? 
                    `${brandName} 브랜드 관련 문의가 없습니다.` : 
                    '검색 조건에 맞는 문의가 없습니다.'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 문의 상세 모달 */}
      {showDetailModal && selectedInquiry && (
        <Modal 
          isOpen={showDetailModal} 
          onClose={() => setShowDetailModal(false)}
          title="문의 상세 정보"
          size="large"
        >
          <div className="inquiry-detail">
            <div className="inquiry-header">
              <div className="inquiry-meta">
                <div className="meta-item">
                  <strong>고객명:</strong> {selectedInquiry.customerName}
                </div>
                <div className="meta-item">
                  <strong>이메일:</strong> {selectedInquiry.customerEmail}
                </div>
                <div className="meta-item">
                  <strong>연락처:</strong> {selectedInquiry.customerPhone}
                </div>
                <div className="meta-item">
                  <strong>카테고리:</strong> {selectedInquiry.category}
                </div>
                <div className="meta-item">
                  <strong>상품명:</strong> {selectedInquiry.productName}
                </div>
                <div className="meta-item">
                  <strong>우선순위:</strong> 
                  <span className={`badge ${getPriorityBadge(selectedInquiry.priority)}`}>
                    {selectedInquiry.priority}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>상태:</strong> 
                  <span className={`badge ${getStatusBadge(selectedInquiry.status)}`}>
                    {selectedInquiry.status}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>등록일:</strong> {selectedInquiry.submittedDate}
                </div>
              </div>
            </div>
            
            <div className="inquiry-content">
              <h4>문의 내용</h4>
              <div className="content-box">
                {selectedInquiry.content}
              </div>
            </div>

            <div className="reply-section">
              <h4>답변</h4>
              {selectedInquiry.reply && (
                <div className="existing-reply">
                  <div className="reply-header">
                    <strong>{selectedInquiry.assignedTo}</strong>
                    <span className="reply-date">{selectedInquiry.replyDate}</span>
                  </div>
                  <div className="reply-content">
                    {selectedInquiry.reply}
                  </div>
                </div>
              )}
              
              <div className="reply-form">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  rows={5}
                />
                <div className="reply-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleReply(selectedInquiry.id)}
                  >
                    {selectedInquiry.reply ? '답변 수정' : '답변 등록'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowDetailModal(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerService;
