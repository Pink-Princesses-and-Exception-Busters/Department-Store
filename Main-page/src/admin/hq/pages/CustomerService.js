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
import { getAllInquiries, replyToInquiry, updateInquiryStatus } from '../../../services/inquiryService';

const CustomerService = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 데이터베이스에서 문의 목록 로드
  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      console.log('🔄 본사 고객서비스: 문의 목록 로드 시작');
      
      const data = await getAllInquiries();
      
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
        tenant: inquiry.product_brand || inquiry.tenant || '일반',
        reply: inquiry.reply_content,
        replyDate: inquiry.reply_date ? new Date(inquiry.reply_date).toLocaleString('ko-KR') : null
      }));
      
      setInquiries(formattedInquiries);
      console.log(`✅ 본사 고객서비스: ${formattedInquiries.length}건 문의 로드 완료`);
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
    '상품문의', '배송문의', '환불요청', '교환요청', '상품불만', '시스템문의', '기타'
  ];

  // 필터링된 문의 목록
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || inquiry.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || inquiry.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 문의 상태 변경
  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      console.log('🔄 문의 상태 변경:', inquiryId, newStatus);
      
      // 데이터베이스에 상태 변경 저장
      const success = await updateInquiryStatus(inquiryId, newStatus, '본사 관리자');
      
      if (success) {
        // UI 상태 업데이트
        setInquiries(inquiries.map(inquiry => 
          inquiry.id === inquiryId ? { 
            ...inquiry, 
            status: newStatus,
            assignedTo: newStatus === '처리중' ? '본사 관리자' : inquiry.assignedTo
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
      const success = await replyToInquiry(inquiryId, replyText, '본사 관리자');
      
      if (success) {
        // UI 상태 업데이트
        setInquiries(inquiries.map(inquiry => 
          inquiry.id === inquiryId ? { 
            ...inquiry, 
            reply: replyText,
            status: '답변완료',
            assignedTo: '본사 관리자',
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
          <h1>고객 서비스 관리</h1>
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
        <h1>고객 서비스 관리</h1>
        {pendingCount > 0 && (
          <div className="alert alert-warning">
            <AlertCircle size={16} />
            답변 대기 중인 문의가 {pendingCount}개 있습니다.
          </div>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="고객명, 제목, 내용으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">전체 카테고리</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
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
              <th>입점사</th>
              <th>우선순위</th>
              <th>상태</th>
              <th>담당자</th>
              <th>등록일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.map(inquiry => (
              <tr key={inquiry.id}>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">
                      <User size={14} />
                      <span>{inquiry.customerName}</span>
                    </div>
                    <div className="customer-contact">
                      <Mail size={12} />
                      <span>{inquiry.customerEmail}</span>
                    </div>
                    <div className="customer-contact">
                      <Phone size={12} />
                      <span>{inquiry.customerPhone}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="inquiry-subject">
                    <strong>{inquiry.subject}</strong>
                    <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                      {inquiry.content.substring(0, 50)}...
                    </small>
                  </div>
                </td>
                <td>
                  <span className="badge badge-outline">{inquiry.category}</span>
                </td>
                <td>{inquiry.tenant}</td>
                <td>
                  <span className={`badge ${getPriorityBadge(inquiry.priority)}`}>
                    {inquiry.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(inquiry.status)}`}>
                    {inquiry.status}
                  </span>
                </td>
                <td>{inquiry.assignedTo}</td>
                <td>{inquiry.submittedDate}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleViewInquiry(inquiry)}
                    >
                      <Eye size={14} />
                    </button>
                    {inquiry.status === '답변대기' && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleStatusChange(inquiry.id, '처리중')}
                      >
                        <Clock size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 문의 상세 정보 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="문의 상세 정보"
      >
        {selectedInquiry && (
          <div className="inquiry-details">
            <div className="detail-section">
              <h3>고객 정보</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>고객명</label>
                  <span>{selectedInquiry.customerName}</span>
                </div>
                <div className="detail-item">
                  <label>이메일</label>
                  <span>{selectedInquiry.customerEmail}</span>
                </div>
                <div className="detail-item">
                  <label>전화번호</label>
                  <span>{selectedInquiry.customerPhone}</span>
                </div>
                <div className="detail-item">
                  <label>카테고리</label>
                  <span>{selectedInquiry.category}</span>
                </div>
                <div className="detail-item">
                  <label>입점사</label>
                  <span>{selectedInquiry.tenant}</span>
                </div>
                <div className="detail-item">
                  <label>우선순위</label>
                  <span className={`badge ${getPriorityBadge(selectedInquiry.priority)}`}>
                    {selectedInquiry.priority}
                  </span>
                </div>
                <div className="detail-item">
                  <label>상태</label>
                  <span className={`badge ${getStatusBadge(selectedInquiry.status)}`}>
                    {selectedInquiry.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>담당자</label>
                  <span>{selectedInquiry.assignedTo}</span>
                </div>
                <div className="detail-item">
                  <label>등록일</label>
                  <span>{selectedInquiry.submittedDate}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>문의 내용</h3>
              <div className="inquiry-content">
                <h4>{selectedInquiry.subject}</h4>
                <p>{selectedInquiry.content}</p>
              </div>
            </div>

            {selectedInquiry.reply && (
              <div className="detail-section">
                <h3>답변</h3>
                <div className="reply-content">
                  <p>{selectedInquiry.reply}</p>
                  {selectedInquiry.replyDate && (
                    <small style={{ color: '#666' }}>
                      답변일: {new Date(selectedInquiry.replyDate).toLocaleString()}
                    </small>
                  )}
                </div>
              </div>
            )}

            {selectedInquiry.status !== '답변완료' && (
              <div className="detail-section">
                <h3>답변 작성</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="답변 내용을 입력하세요..."
                  rows="4"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            )}
          </div>
        )}
        
        <div className="modal-actions">
          {selectedInquiry && selectedInquiry.status !== '답변완료' && (
            <button 
              className="btn btn-primary"
              onClick={() => handleReply(selectedInquiry.id)}
            >
              <MessageSquare size={16} />
              답변 등록
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
            닫기
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerService;
