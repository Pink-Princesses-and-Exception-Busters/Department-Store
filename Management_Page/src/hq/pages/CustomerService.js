import React, { useState } from 'react';
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

const CustomerService = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [inquiries, setInquiries] = useState([
    {
      id: 1,
      customerName: '김철수',
      customerEmail: 'kim@email.com',
      customerPhone: '010-1234-5678',
      category: '상품문의',
      subject: '갤럭시 S24 배송 문의',
      content: '갤럭시 S24를 주문했는데 배송이 지연되고 있습니다. 언제 도착할 예정인가요?',
      status: '답변대기',
      priority: '높음',
      submittedDate: '2024-01-15 14:30',
      assignedTo: '미배정',
      tenant: '삼성전자'
    },
    {
      id: 2,
      customerName: '이영희',
      customerEmail: 'lee@email.com',
      customerPhone: '010-2345-6789',
      category: '환불요청',
      subject: 'LG TV 환불 신청',
      content: 'LG OLED TV를 구매했는데 화면에 문제가 있습니다. 환불을 신청합니다.',
      status: '처리중',
      priority: '높음',
      submittedDate: '2024-01-15 11:20',
      assignedTo: '김서비스',
      tenant: 'LG전자',
      reply: '환불 절차를 안내드리겠습니다. 제품 사진을 첨부해 주시면 더 빠른 처리가 가능합니다.'
    },
    {
      id: 3,
      customerName: '박민수',
      customerEmail: 'park@email.com',
      customerPhone: '010-3456-7890',
      category: '배송문의',
      subject: '나이키 신발 배송 상태',
      content: '나이키 에어맥스를 주문했는데 배송 상태를 확인하고 싶습니다.',
      status: '답변완료',
      priority: '보통',
      submittedDate: '2024-01-14 16:45',
      assignedTo: '이서비스',
      tenant: '신세계인터내셔날',
      reply: '주문하신 상품은 오늘 오후에 배송될 예정입니다. 배송 추적 번호를 문자로 발송드렸습니다.'
    },
    {
      id: 4,
      customerName: '정수진',
      customerEmail: 'jung@email.com',
      customerPhone: '010-4567-8901',
      category: '상품불만',
      subject: '의자 품질 문제',
      content: '구매한 디자인 의자의 다리가 흔들립니다. 교환을 요청합니다.',
      status: '답변대기',
      priority: '보통',
      submittedDate: '2024-01-15 09:15',
      assignedTo: '미배정',
      tenant: '가구업체'
    },
    {
      id: 5,
      customerName: '최동현',
      customerEmail: 'choi@email.com',
      customerPhone: '010-5678-9012',
      category: '시스템문의',
      subject: '로그인 문제',
      content: '웹사이트에서 로그인이 되지 않습니다. 비밀번호를 재설정하고 싶습니다.',
      status: '답변완료',
      priority: '낮음',
      submittedDate: '2024-01-13 13:20',
      assignedTo: '박서비스',
      tenant: '시스템',
      reply: '비밀번호 재설정 링크를 이메일로 발송드렸습니다. 확인 후 새로운 비밀번호로 설정해 주세요.'
    }
  ]);

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
  const handleStatusChange = (inquiryId, newStatus) => {
    setInquiries(inquiries.map(inquiry => 
      inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
    ));
    alert(`문의 상태가 '${newStatus}'로 변경되었습니다.`);
  };

  // 답변 등록
  const handleReply = (inquiryId) => {
    if (!replyText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setInquiries(inquiries.map(inquiry => 
      inquiry.id === inquiryId ? { 
        ...inquiry, 
        reply: replyText,
        status: '답변완료',
        replyDate: new Date().toISOString()
      } : inquiry
    ));
    setReplyText('');
    setShowDetailModal(false);
    alert('답변이 등록되었습니다.');
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
