import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  XCircle,
  Building2
} from 'lucide-react';
import Modal from '../../shared/components/Modal';

const Tenants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [newTenant, setNewTenant] = useState({
    companyName: '',
    representative: '',
    email: '',
    phone: '',
    businessNumber: '',
    category: '',
    address: '',
    description: ''
  });

  const [tenants, setTenants] = useState([
    {
      id: 1,
      companyName: '삼성전자',
      representative: '김영철',
      email: 'contact@samsung.com',
      phone: '02-1234-5678',
      businessNumber: '124-81-00998',
      category: '전자제품',
      status: '승인됨',
      joinDate: '2023-01-15',
      monthlySales: 150000000,
      commission: 5.0,
      address: '서울특별시 서초구 서초대로 74길 4',
      description: '전자제품 전문 업체'
    },
    {
      id: 2,
      companyName: 'LG화학',
      representative: '이미영',
      email: 'info@lgchem.com',
      phone: '02-2345-6789',
      businessNumber: '110-81-12345',
      category: '화학제품',
      status: '승인됨',
      joinDate: '2023-02-20',
      monthlySales: 89000000,
      commission: 4.5,
      address: '서울특별시 영등포구 여의대로 128',
      description: '화학제품 및 생활용품'
    },
    {
      id: 3,
      companyName: '신세계인터내셔날',
      representative: '박준호',
      email: 'contact@shinsegae.com',
      phone: '02-3456-7890',
      businessNumber: '101-81-23456',
      category: '패션',
      status: '승인됨',
      joinDate: '2023-03-10',
      monthlySales: 210000000,
      commission: 6.0,
      address: '서울특별시 중구 소공로 63',
      description: '패션 및 뷰티 제품'
    },
    {
      id: 4,
      companyName: '신규입점업체',
      representative: '최민수',
      email: 'new@company.com',
      phone: '02-4567-8901',
      businessNumber: '123-45-67890',
      category: '식품',
      status: '승인대기',
      joinDate: '2024-01-10',
      monthlySales: 0,
      commission: 5.0,
      address: '서울특별시 강남구 테헤란로 123',
      description: '건강식품 전문업체'
    },
    {
      id: 5,
      companyName: '반려업체',
      representative: '정수진',
      email: 'rejected@company.com',
      phone: '02-5678-9012',
      businessNumber: '987-65-43210',
      category: '완구',
      status: '승인거부',
      joinDate: '2024-01-05',
      monthlySales: 0,
      commission: 5.0,
      address: '서울특별시 마포구 와우산로 123',
      description: '완구 및 게임 제품'
    }
  ]);

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: '승인대기', label: '승인대기' },
    { value: '승인됨', label: '승인됨' },
    { value: '승인거부', label: '승인거부' },
    { value: '계약만료', label: '계약만료' }
  ];

  const categoryOptions = [
    '전자제품', '화학제품', '패션', '식품', '완구', '가구', '뷰티', '스포츠', '도서', '기타'
  ];

  // 필터링된 입점사 목록
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.representative.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || tenant.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // 입점사 상태 변경
  const handleStatusChange = (tenantId, newStatus) => {
    setTenants(tenants.map(tenant => 
      tenant.id === tenantId ? { ...tenant, status: newStatus } : tenant
    ));
    alert(`입점사 상태가 '${newStatus}'로 변경되었습니다.`);
  };

  // 새 입점사 추가
  const handleAddTenant = () => {
    if (!newTenant.companyName || !newTenant.representative || !newTenant.email) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    const tenant = {
      id: tenants.length + 1,
      ...newTenant,
      status: '승인대기',
      joinDate: new Date().toISOString().split('T')[0],
      monthlySales: 0
    };

    setTenants([...tenants, tenant]);
    setNewTenant({
      companyName: '',
      representative: '',
      email: '',
      phone: '',
      businessNumber: '',
      category: '',
      address: '',
      description: ''
    });
    setShowAddModal(false);
    alert('입점사가 등록되었습니다.');
  };

  // 입점사 상세 정보 보기
  const handleViewTenant = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      '승인대기': 'badge-warning',
      '승인됨': 'badge-success',
      '승인거부': 'badge-danger',
      '계약만료': 'badge-secondary'
    };
    return statusMap[status] || 'badge-info';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>입점사 관리</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          새 입점사 등록
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="입점사명, 대표자명, 이메일로 검색..."
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
      </div>

      {/* 입점사 목록 */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>입점사명</th>
              <th>대표자</th>
              <th>카테고리</th>
              <th>상태</th>
              <th>입점일</th>
              <th>월 매출</th>
              <th>수수료율</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map(tenant => (
              <tr key={tenant.id}>
                <td>
                  <div className="company-info">
                    <Building2 size={16} />
                    <span>{tenant.companyName}</span>
                  </div>
                </td>
                <td>{tenant.representative}</td>
                <td>{tenant.category}</td>
                <td>
                  <span className={`badge ${getStatusBadge(tenant.status)}`}>
                    {tenant.status}
                  </span>
                </td>
                <td>{tenant.joinDate}</td>
                <td>₩{tenant.monthlySales.toLocaleString()}</td>
                <td>{tenant.commission}%</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleViewTenant(tenant)}
                    >
                      <Eye size={14} />
                    </button>
                    {tenant.status === '승인대기' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleStatusChange(tenant.id, '승인됨')}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleStatusChange(tenant.id, '승인거부')}
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 새 입점사 등록 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="새 입점사 등록"
      >
        <div className="form-group">
          <label>회사명 *</label>
          <input
            type="text"
            value={newTenant.companyName}
            onChange={(e) => setNewTenant({...newTenant, companyName: e.target.value})}
            placeholder="회사명을 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>대표자명 *</label>
          <input
            type="text"
            value={newTenant.representative}
            onChange={(e) => setNewTenant({...newTenant, representative: e.target.value})}
            placeholder="대표자명을 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>이메일 *</label>
          <input
            type="email"
            value={newTenant.email}
            onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
            placeholder="이메일을 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>전화번호</label>
          <input
            type="tel"
            value={newTenant.phone}
            onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
            placeholder="전화번호를 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>사업자등록번호</label>
          <input
            type="text"
            value={newTenant.businessNumber}
            onChange={(e) => setNewTenant({...newTenant, businessNumber: e.target.value})}
            placeholder="사업자등록번호를 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>카테고리</label>
          <select
            value={newTenant.category}
            onChange={(e) => setNewTenant({...newTenant, category: e.target.value})}
          >
            <option value="">카테고리 선택</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>주소</label>
          <input
            type="text"
            value={newTenant.address}
            onChange={(e) => setNewTenant({...newTenant, address: e.target.value})}
            placeholder="주소를 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>설명</label>
          <textarea
            value={newTenant.description}
            onChange={(e) => setNewTenant({...newTenant, description: e.target.value})}
            placeholder="업체 설명을 입력하세요"
            rows="3"
          />
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleAddTenant}>
            등록
          </button>
        </div>
      </Modal>

      {/* 입점사 상세 정보 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="입점사 상세 정보"
      >
        {selectedTenant && (
          <div className="tenant-details">
            <div className="detail-section">
              <h3>기본 정보</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>회사명</label>
                  <span>{selectedTenant.companyName}</span>
                </div>
                <div className="detail-item">
                  <label>대표자</label>
                  <span>{selectedTenant.representative}</span>
                </div>
                <div className="detail-item">
                  <label>이메일</label>
                  <span>{selectedTenant.email}</span>
                </div>
                <div className="detail-item">
                  <label>전화번호</label>
                  <span>{selectedTenant.phone}</span>
                </div>
                <div className="detail-item">
                  <label>사업자등록번호</label>
                  <span>{selectedTenant.businessNumber}</span>
                </div>
                <div className="detail-item">
                  <label>카테고리</label>
                  <span>{selectedTenant.category}</span>
                </div>
                <div className="detail-item">
                  <label>주소</label>
                  <span>{selectedTenant.address}</span>
                </div>
                <div className="detail-item">
                  <label>입점일</label>
                  <span>{selectedTenant.joinDate}</span>
                </div>
                <div className="detail-item">
                  <label>상태</label>
                  <span className={`badge ${getStatusBadge(selectedTenant.status)}`}>
                    {selectedTenant.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>월 매출</label>
                  <span>₩{selectedTenant.monthlySales.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>수수료율</label>
                  <span>{selectedTenant.commission}%</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>업체 설명</h3>
              <p>{selectedTenant.description}</p>
            </div>
          </div>
        )}
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
            닫기
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Tenants;
