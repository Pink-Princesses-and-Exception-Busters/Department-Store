import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Building2,
  Truck,
  Percent,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import Modal from '../components/Modal';
import { 
  calculateSettlementSummary, 
  formatSettlementsForCSV
} from '../utils/paymentUtils';

const Settlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [filteredSettlements, setFilteredSettlements] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: ''
  });

  const [activeTab, setActiveTab] = useState('settlements');
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  // 샘플 정산 데이터
  const sampleSettlements = useMemo(() => [
    {
      id: 'ST001',
      orderId: 'ORD001',
      customerName: '김철수',
      amount: 25000,
      commission: 1250,
      netAmount: 23750,
      paymentMethod: '신용카드',
      orderDate: '2024-01-15',
      settlementDate: '2024-01-22',
      status: 'completed',
      statusText: '정산완료',
      paymentProvider: '토스페이먼츠',
      transactionId: 'TXN123456789'
    },
    {
      id: 'ST002',
      orderId: 'ORD002',
      customerName: '이영희',
      amount: 89000,
      commission: 4450,
      netAmount: 84550,
      paymentMethod: '카카오페이',
      orderDate: '2024-01-16',
      settlementDate: '2024-01-23',
      status: 'pending',
      statusText: '정산대기',
      paymentProvider: '카카오페이',
      transactionId: 'TXN987654321'
    },
    {
      id: 'ST003',
      orderId: 'ORD003',
      customerName: '박민수',
      amount: 45000,
      commission: 2250,
      netAmount: 42750,
      paymentMethod: '네이버페이',
      orderDate: '2024-01-17',
      settlementDate: '2024-01-24',
      status: 'processing',
      statusText: '정산처리중',
      paymentProvider: '네이버페이',
      transactionId: 'TXN456789123'
    },
    {
      id: 'ST004',
      orderId: 'ORD004',
      customerName: '정수진',
      amount: 120000,
      commission: 6000,
      netAmount: 114000,
      paymentMethod: '신용카드',
      orderDate: '2024-01-18',
      settlementDate: '2024-01-25',
      status: 'scheduled',
      statusText: '정산예정',
      paymentProvider: '토스페이먼츠',
      transactionId: 'TXN789123456'
    },
    {
      id: 'ST005',
      orderId: 'ORD005',
      customerName: '최동현',
      amount: 15000,
      commission: 750,
      netAmount: 14250,
      paymentMethod: '카카오페이',
      orderDate: '2024-01-19',
      settlementDate: '2024-01-26',
      status: 'completed',
      statusText: '정산완료',
      paymentProvider: '카카오페이',
      transactionId: 'TXN321654987'
    }
  ], []);

  // 샘플 계약 데이터
  const sampleContracts = useMemo(() => [
    {
      id: 'CT001',
      type: 'headquarters',
      companyName: '현대자동차 본사',
      contractType: '직영',
      commissionRate: 0.02,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      description: '현대자동차 본사와의 직영 계약'
    },
    {
      id: 'CT002',
      type: 'shipping',
      companyName: 'CJ대한통운',
      contractType: '위탁',
      commissionRate: 0.05,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      description: 'CJ대한통운 배송 위탁 계약'
    },
    {
      id: 'CT003',
      type: 'shipping',
      companyName: '한진택배',
      contractType: '위탁',
      commissionRate: 0.06,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      description: '한진택배 배송 위탁 계약'
    }
  ], []);

  // 샘플 수수료 데이터
  const sampleCommissions = useMemo(() => [
    {
      id: 'CM001',
      category: 'payment',
      provider: '토스페이먼츠',
      method: '신용카드',
      rate: 0.025,
      fixedFee: 0,
      description: '토스페이먼츠 신용카드 수수료'
    },
    {
      id: 'CM002',
      category: 'payment',
      provider: '카카오페이',
      method: '카카오페이',
      rate: 0.023,
      fixedFee: 0,
      description: '카카오페이 수수료'
    },
    {
      id: 'CM003',
      category: 'shipping',
      provider: 'CJ대한통운',
      method: '일반배송',
      rate: 0.05,
      fixedFee: 2500,
      description: 'CJ대한통운 일반배송 수수료'
    }
  ], []);

  const filterSettlements = useCallback(() => {
    let filtered = [...settlements];

    // 상태별 필터링
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // 검색어 필터링
    if (filters.search) {
      filtered = filtered.filter(item => 
        item.orderId.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.paymentProvider.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredSettlements(filtered);
  }, [filters, settlements]);

  useEffect(() => {
    setSettlements(sampleSettlements);
    setFilteredSettlements(sampleSettlements);
  }, [sampleSettlements]);

  useEffect(() => {
    filterSettlements();
  }, [filterSettlements]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': 'badge-success',
      'pending': 'badge-warning',
      'processing': 'badge-info',
      'scheduled': 'badge-secondary'
    };
    return statusMap[status] || 'badge-secondary';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'completed': CheckCircle,
      'pending': Clock,
      'processing': AlertCircle,
      'scheduled': Calendar
    };
    return iconMap[status] || Clock;
  };

  const handleViewDetail = (settlement) => {
    setSelectedSettlement(settlement);
    setShowDetailModal(true);
  };

  const handleExportSettlements = () => {
    // CSV 내보내기 로직
    const csvData = formatSettlementsForCSV(filteredSettlements);
    const csvContent = csvData.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `정산내역_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = calculateSettlementSummary(filteredSettlements);

  const handleAddContract = () => {
    setModalMode('add');
    setSelectedContract(null);
    setShowContractModal(true);
  };

  const handleEditContract = (contract) => {
    setModalMode('edit');
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const handleDeleteContract = (contractId) => {
    if (window.confirm('계약을 삭제하시겠습니까?')) {
      // 삭제 로직 구현
      console.log('계약 삭제:', contractId);
    }
  };

  const handleAddCommission = () => {
    setModalMode('add');
    setSelectedCommission(null);
    setShowCommissionModal(true);
  };

  const handleEditCommission = (commission) => {
    setModalMode('edit');
    setSelectedCommission(commission);
    setShowCommissionModal(true);
  };

  const handleDeleteCommission = (commissionId) => {
    if (window.confirm('수수료 설정을 삭제하시겠습니까?')) {
      // 삭제 로직 구현
      console.log('수수료 삭제:', commissionId);
    }
  };

  return (
    <div className="settlements-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <DollarSign className="title-icon" />
            정산관리(미구현)
          </h1>
          <p className="page-description">
            정산 내역, 계약 관리, 수수료 설정을 통합 관리합니다
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleExportSettlements}
          >
            <Download size={16} />
            내보내기
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tabs-navigation">
        <button
          className={`tab-button ${activeTab === 'settlements' ? 'active' : ''}`}
          onClick={() => setActiveTab('settlements')}
        >
          <DollarSign size={16} />
          정산내역
        </button>
        <button
          className={`tab-button ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          <Building2 size={16} />
          계약관리
        </button>
        <button
          className={`tab-button ${activeTab === 'commissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('commissions')}
        >
          <Percent size={16} />
          수수료관리
        </button>
      </div>

      {/* 정산내역 탭 */}
      {activeTab === 'settlements' && (
        <>
          {/* 요약 통계 */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">
                <DollarSign size={24} />
              </div>
              <div className="card-content">
                <h3 className="card-title">총 정산금액</h3>
                <p className="card-value">₩{summary.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">
                <TrendingUp size={24} />
              </div>
              <div className="card-content">
                <h3 className="card-title">정산완료</h3>
                <p className="card-value">{summary.statusCounts?.completed || 0}건</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">
                <Clock size={24} />
              </div>
              <div className="card-content">
                <h3 className="card-title">정산대기</h3>
                <p className="card-value">₩{summary.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">
                <CreditCard size={24} />
              </div>
              <div className="card-content">
                <h3 className="card-title">수수료</h3>
                <p className="card-value">₩{summary.totalCommission.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 필터 및 검색 */}
          <div className="filters-section">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="주문ID, 고객명, 결제사로 검색..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div className="filter-controls">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="filter-select"
              >
                <option value="all">전체 상태</option>
                <option value="completed">정산완료</option>
                <option value="pending">정산대기</option>
                <option value="processing">정산처리중</option>
                <option value="scheduled">정산예정</option>
              </select>
            </div>
          </div>

          {/* 정산 내역 테이블 */}
          <div className="table-container">
            <table className="settlements-table">
              <thead>
                <tr>
                  <th>정산ID</th>
                  <th>주문ID</th>
                  <th>고객명</th>
                  <th>주문금액</th>
                  <th>수수료</th>
                  <th>정산금액</th>
                  <th>결제수단</th>
                  <th>주문일</th>
                  <th>정산일</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map((settlement) => {
                  const StatusIcon = getStatusIcon(settlement.status);
                  return (
                    <tr key={settlement.id}>
                      <td>{settlement.id}</td>
                      <td>{settlement.orderId}</td>
                      <td>{settlement.customerName}</td>
                      <td>₩{settlement.amount.toLocaleString()}</td>
                      <td>₩{settlement.commission.toLocaleString()}</td>
                      <td>₩{settlement.netAmount.toLocaleString()}</td>
                      <td>{settlement.paymentMethod}</td>
                      <td>{settlement.orderDate}</td>
                      <td>{settlement.settlementDate}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(settlement.status)}`}>
                          <StatusIcon size={12} />
                          {settlement.statusText}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewDetail(settlement)}
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 정산 상세 모달 */}
          {showDetailModal && selectedSettlement && (
            <Modal
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
              title="정산 상세 정보"
              size="xl"
            >
              <div className="settlement-detail">
                <div className="detail-section">
                  <h3>기본 정보</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>정산ID:</label>
                      <span>{selectedSettlement.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>주문ID:</label>
                      <span>{selectedSettlement.orderId}</span>
                    </div>
                    <div className="detail-item">
                      <label>고객명:</label>
                      <span>{selectedSettlement.customerName}</span>
                    </div>
                    <div className="detail-item">
                      <label>결제사:</label>
                      <span>{selectedSettlement.paymentProvider}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>금액 정보</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>주문금액:</label>
                      <span className="amount">₩{selectedSettlement.amount.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>수수료:</label>
                      <span className="commission">₩{selectedSettlement.commission.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>정산금액:</label>
                      <span className="net-amount">₩{selectedSettlement.netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>일정 정보</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>주문일:</label>
                      <span>{selectedSettlement.orderDate}</span>
                    </div>
                    <div className="detail-item">
                      <label>정산예정일:</label>
                      <span>{selectedSettlement.settlementDate}</span>
                    </div>
                    <div className="detail-item">
                      <label>결제수단:</label>
                      <span>{selectedSettlement.paymentMethod}</span>
                    </div>
                    <div className="detail-item">
                      <label>거래ID:</label>
                      <span className="transaction-id">{selectedSettlement.transactionId}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>정산 상태</h3>
                  <div className="status-info">
                    <span className={`badge ${getStatusBadge(selectedSettlement.status)}`}>
                      {selectedSettlement.statusText}
                    </span>
                    <p className="status-description">
                      {selectedSettlement.status === 'completed' && '정산이 완료되었습니다.'}
                      {selectedSettlement.status === 'pending' && '정산 대기 중입니다.'}
                      {selectedSettlement.status === 'processing' && '정산 처리 중입니다.'}
                      {selectedSettlement.status === 'scheduled' && '정산 예정일까지 대기 중입니다.'}
                    </p>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* 계약관리 탭 */}
      {activeTab === 'contracts' && (
        <>
          <div className="section-header">
            <h2>계약 관리</h2>
            <button className="btn btn-primary" onClick={handleAddContract}>
              <Plus size={16} />
              계약 추가
            </button>
          </div>

          <div className="contracts-grid">
            {sampleContracts.map((contract) => (
              <div key={contract.id} className="contract-card">
                <div className="contract-header">
                  <div className="contract-type">
                    {contract.type === 'headquarters' ? (
                      <Building2 size={20} color="#007bff" />
                    ) : (
                      <Truck size={20} color="#28a745" />
                    )}
                    <span className="contract-type-text">
                      {contract.type === 'headquarters' ? '본사계약' : '배송사계약'}
                    </span>
                  </div>
                  <div className="contract-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleEditContract(contract)}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteContract(contract.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="contract-content">
                  <h3>{contract.companyName}</h3>
                  <p className="contract-description">{contract.description}</p>
                  <div className="contract-details">
                    <div className="detail-row">
                      <span className="label">계약유형:</span>
                      <span className="value">{contract.contractType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">수수료율:</span>
                      <span className="value">{(contract.commissionRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">계약기간:</span>
                      <span className="value">{contract.startDate} ~ {contract.endDate}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">상태:</span>
                      <span className={`status-badge ${contract.status}`}>
                        {contract.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 수수료관리 탭 */}
      {activeTab === 'commissions' && (
        <>
          <div className="section-header">
            <h2>수수료 관리</h2>
            <button className="btn btn-primary" onClick={handleAddCommission}>
              <Plus size={16} />
              수수료 추가
            </button>
          </div>

          <div className="commissions-table">
            <table>
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>제공업체</th>
                  <th>결제/배송방식</th>
                  <th>수수료율</th>
                  <th>고정수수료</th>
                  <th>설명</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {sampleCommissions.map((commission) => (
                  <tr key={commission.id}>
                    <td>
                      <span className={`category-badge ${commission.category}`}>
                        {commission.category === 'payment' ? '결제' : '배송'}
                      </span>
                    </td>
                    <td>{commission.provider}</td>
                    <td>{commission.method}</td>
                    <td>{(commission.rate * 100).toFixed(2)}%</td>
                    <td>
                      {commission.fixedFee > 0 ? `₩${commission.fixedFee.toLocaleString()}` : '-'}
                    </td>
                    <td>{commission.description}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleEditCommission(commission)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteCommission(commission.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 계약 추가/수정 모달 */}
      {showContractModal && (
        <Modal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          title={modalMode === 'add' ? '계약 추가' : '계약 수정'}
          size="large"
        >
          <div className="contract-form">
            <div className="form-group">
              <label>계약 유형</label>
              <select defaultValue={selectedContract?.type || 'headquarters'}>
                <option value="headquarters">본사계약</option>
                <option value="shipping">배송사계약</option>
              </select>
            </div>
            <div className="form-group">
              <label>회사명</label>
              <input
                type="text"
                placeholder="회사명을 입력하세요"
                defaultValue={selectedContract?.companyName || ''}
              />
            </div>
            <div className="form-group">
              <label>계약 유형</label>
              <select defaultValue={selectedContract?.contractType || '직영'}>
                <option value="직영">직영</option>
                <option value="위탁">위탁</option>
                <option value="프랜차이즈">프랜차이즈</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>수수료율 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  defaultValue={selectedContract ? (selectedContract.commissionRate * 100) : ''}
                />
              </div>
              <div className="form-group">
                <label>계약 시작일</label>
                <input
                  type="date"
                  defaultValue={selectedContract?.startDate || ''}
                />
              </div>
              <div className="form-group">
                <label>계약 종료일</label>
                <input
                  type="date"
                  defaultValue={selectedContract?.endDate || ''}
                />
              </div>
            </div>
            <div className="form-group">
              <label>설명</label>
              <textarea
                placeholder="계약에 대한 설명을 입력하세요"
                defaultValue={selectedContract?.description || ''}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowContractModal(false)}>
                취소
              </button>
              <button className="btn btn-primary">
                {modalMode === 'add' ? '추가' : '수정'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 수수료 추가/수정 모달 */}
      {showCommissionModal && (
        <Modal
          isOpen={showCommissionModal}
          onClose={() => setShowCommissionModal(false)}
          title={modalMode === 'add' ? '수수료 추가' : '수수료 수정'}
          size="large"
        >
          <div className="commission-form">
            <div className="form-row">
              <div className="form-group">
                <label>카테고리</label>
                <select defaultValue={selectedCommission?.category || 'payment'}>
                  <option value="payment">결제</option>
                  <option value="shipping">배송</option>
                </select>
              </div>
              <div className="form-group">
                <label>제공업체</label>
                <input
                  type="text"
                  placeholder="제공업체명을 입력하세요"
                  defaultValue={selectedCommission?.provider || ''}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>결제/배송방식</label>
                <input
                  type="text"
                  placeholder="방식을 입력하세요"
                  defaultValue={selectedCommission?.method || ''}
                />
              </div>
              <div className="form-group">
                <label>수수료율 (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={selectedCommission ? (selectedCommission.rate * 100) : ''}
                />
              </div>
              <div className="form-group">
                <label>고정수수료 (원)</label>
                <input
                  type="number"
                  placeholder="0"
                  defaultValue={selectedCommission?.fixedFee || ''}
                />
              </div>
            </div>
            <div className="form-group">
              <label>설명</label>
              <textarea
                placeholder="수수료에 대한 설명을 입력하세요"
                defaultValue={selectedCommission?.description || ''}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowCommissionModal(false)}>
                취소
              </button>
              <button className="btn btn-primary">
                {modalMode === 'add' ? '추가' : '수정'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settlements;
