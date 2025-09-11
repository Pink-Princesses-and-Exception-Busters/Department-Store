import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  XCircle,
  Building2,
  RefreshCw,
  Loader
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { supabase } from '../../shared/lib/supabase';

const Tenants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [newTenant, setNewTenant] = useState({
    companyName: '',
    representative: '',
    email: '',
    phone: '',
    businessNumber: '',
    address: '',
    description: ''
  });

  const [tenants, setTenants] = useState([]);

  // 데이터 로드
  useEffect(() => {
    loadTenants();
  }, []);

  // 입점사 데이터 로드
  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('brand_admins')
        .select('*')
        .order('joined_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // 모든 브랜드의 상품 수를 한 번에 조회
      const { data: productCounts, error: productError } = await supabase
        .from('products')
        .select('brand')
        .in('brand', data?.map(tenant => tenant.name) || []);

      if (productError) {
        console.error('상품 수 조회 오류:', productError);
      }

      // 브랜드별 상품 수 계산
      const brandProductCounts = {};
      productCounts?.forEach(product => {
        brandProductCounts[product.brand] = (brandProductCounts[product.brand] || 0) + 1;
      });

      // 데이터 변환 (brand_admins 테이블 구조를 UI에 맞게 변환)
      const transformedTenants = data?.map(tenant => ({
        id: tenant.id,
        companyName: tenant.name,
        representative: '대표자 정보 없음', // brand_admins에는 대표자 정보가 없음
        email: tenant.email,
        phone: tenant.phone || '-',
        businessNumber: tenant.business_number || '-',
        productCount: brandProductCounts[tenant.name] || 0, // 실제 상품 수
        status: getStatusText(tenant.status),
        joinDate: new Date(tenant.joined_at).toLocaleDateString('ko-KR'),
        monthlySales: 0, // 매출 정보는 별도 계산 필요
        commission: getCommissionByGrade(tenant.grade),
        address: tenant.address || '-',
        description: `${tenant.name} 브랜드`,
        grade: tenant.grade,
        logoUrl: tenant.logo_url,
        terminatedAt: tenant.terminated_at,
        originalStatus: tenant.status
      })) || [];

      setTenants(transformedTenants);
      console.log('입점사 데이터 로드 완료:', transformedTenants.length, '개');

    } catch (err) {
      console.error('입점사 데이터 로드 오류:', err);
      setError('입점사 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTenants();
    setRefreshing(false);
  };

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    const statusMap = {
      'active': '승인됨',
      'suspended': '일시정지',
      'terminated': '계약종료'
    };
    return statusMap[status] || '승인대기';
  };

  // 등급에 따른 수수료율
  const getCommissionByGrade = (grade) => {
    const commissionMap = {
      1: 5.0,
      2: 4.0,
      3: 3.0
    };
    return commissionMap[grade] || 5.0;
  };

  // 브랜드별 상품 수 조회
  const getBrandProductCount = async (brandName) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('brand', brandName);

      if (error) throw error;
      return data?.length || 0;
    } catch (err) {
      console.error('상품 수 조회 오류:', err);
      return 0;
    }
  };

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: '승인대기', label: '승인대기' },
    { value: '승인됨', label: '승인됨' },
    { value: '일시정지', label: '일시정지' },
    { value: '계약종료', label: '계약종료' }
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
  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      // UI 상태를 DB 상태로 변환
      const dbStatusMap = {
        '승인됨': 'active',
        '일시정지': 'suspended',
        '계약종료': 'terminated'
      };
      
      const dbStatus = dbStatusMap[newStatus];
      if (!dbStatus) {
        alert('올바르지 않은 상태입니다.');
        return;
      }

      const { error } = await supabase
        .from('brand_admins')
        .update({ 
          status: dbStatus,
          terminated_at: dbStatus === 'terminated' ? new Date().toISOString() : null
        })
        .eq('id', tenantId);

      if (error) {
        throw error;
      }

      // 로컬 상태 업데이트
      setTenants(tenants.map(tenant => 
        tenant.id === tenantId ? { 
          ...tenant, 
          status: newStatus,
          originalStatus: dbStatus
        } : tenant
      ));
      
      alert(`입점사 상태가 '${newStatus}'로 변경되었습니다.`);
      
    } catch (err) {
      console.error('상태 변경 오류:', err);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 새 입점사 추가
  const handleAddTenant = async () => {
    if (!newTenant.companyName || !newTenant.email) {
      alert('필수 정보(회사명, 이메일)를 모두 입력해주세요.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brand_admins')
        .insert([{
          name: newTenant.companyName,
          email: newTenant.email,
          phone: newTenant.phone || null,
          business_number: newTenant.businessNumber || null,
          address: newTenant.address || null,
          grade: 1, // 기본 등급
          status: 'active' // 기본적으로 활성 상태로 등록
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 새로운 입점사를 로컬 상태에 추가
      const newTenantData = {
        id: data.id,
        companyName: data.name,
        representative: '대표자 정보 없음',
        email: data.email,
        phone: data.phone || '-',
        businessNumber: data.business_number || '-',
        productCount: 0, // 새 입점사는 상품이 없음
        status: getStatusText(data.status),
        joinDate: new Date(data.joined_at).toLocaleDateString('ko-KR'),
        monthlySales: 0,
        commission: getCommissionByGrade(data.grade),
        address: data.address || '-',
        description: `${data.name} 브랜드`,
        grade: data.grade,
        logoUrl: data.logo_url,
        terminatedAt: data.terminated_at,
        originalStatus: data.status
      };

      setTenants([newTenantData, ...tenants]); // 최신 항목을 맨 위에 추가
      
      // 폼 초기화
      setNewTenant({
        companyName: '',
        representative: '',
        email: '',
        phone: '',
        businessNumber: '',
        address: '',
        description: ''
      });
      
      setShowAddModal(false);
      alert('입점사가 성공적으로 등록되었습니다.');
      
    } catch (err) {
      console.error('입점사 등록 오류:', err);
      alert('입점사 등록 중 오류가 발생했습니다.');
    }
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
      '일시정지': 'badge-warning',
      '계약종료': 'badge-secondary'
    };
    return statusMap[status] || 'badge-info';
  };

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Loader size={32} className="animate-spin" />
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            입점사 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>입점사 관리</h1>
          <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
            총 {tenants.length}개의 입점사가 등록되어 있습니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '새로고침 중...' : '새로고침'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            새 입점사 등록
          </button>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div style={{ 
          padding: '1rem', 
          margin: '1rem 0', 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px',
          color: '#c33'
        }}>
          <strong>오류:</strong> {error}
          <button 
            onClick={loadTenants}
            style={{ 
              marginLeft: '1rem', 
              padding: '0.25rem 0.5rem', 
              background: '#c33', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      )}

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
              <th>로고</th>
              <th>입점사명</th>
              <th>이메일</th>
              <th>상품 수</th>
              <th>상태</th>
              <th>입점일</th>
              <th>등급</th>
              <th>수수료율</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <Building2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>검색 조건에 맞는 입점사가 없습니다.</p>
                </td>
              </tr>
            ) : (
              filteredTenants.map(tenant => (
                <tr key={tenant.id}>
                  <td>
                    {tenant.logoUrl ? (
                      <img 
                        src={tenant.logoUrl} 
                        alt={`${tenant.companyName} 로고`}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#f3f4f6',
                      borderRadius: '6px',
                      display: tenant.logoUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      <Building2 size={20} color="#9ca3af" />
                    </div>
                  </td>
                  <td>
                    <div className="company-info">
                      <span style={{ fontWeight: '600' }}>{tenant.companyName}</span>
                    </div>
                  </td>
                  <td>{tenant.email}</td>
                  <td>
                    <span style={{ 
                      fontWeight: '600',
                      color: tenant.productCount > 10 ? '#28a745' : tenant.productCount > 0 ? '#ffc107' : '#6c757d'
                    }}>
                      {tenant.productCount.toLocaleString()}개
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td>{tenant.joinDate}</td>
                  <td>
                    <span style={{ 
                      fontWeight: '600',
                      color: tenant.grade === 1 ? '#dc3545' : tenant.grade === 2 ? '#ffc107' : '#28a745'
                    }}>
                      {tenant.grade}등급
                    </span>
                  </td>
                  <td>{tenant.commission}%</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleViewTenant(tenant)}
                        title="상세보기"
                      >
                        <Eye size={14} />
                      </button>
                      {tenant.status === '승인됨' && (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleStatusChange(tenant.id, '일시정지')}
                          title="일시정지"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {tenant.status === '일시정지' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleStatusChange(tenant.id, '승인됨')}
                          title="활성화"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
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
                  <label>등급</label>
                  <span style={{ 
                    fontWeight: '600',
                    color: selectedTenant.grade === 1 ? '#dc3545' : selectedTenant.grade === 2 ? '#ffc107' : '#28a745'
                  }}>
                    {selectedTenant.grade}등급
                  </span>
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
                  <label>등록된 상품 수</label>
                  <span style={{ 
                    fontWeight: '600',
                    color: selectedTenant.productCount > 10 ? '#28a745' : selectedTenant.productCount > 0 ? '#ffc107' : '#6c757d'
                  }}>
                    {selectedTenant.productCount.toLocaleString()}개
                  </span>
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
                  <label>로고</label>
                  <div>
                    {selectedTenant.logoUrl ? (
                      <img 
                        src={selectedTenant.logoUrl} 
                        alt={`${selectedTenant.companyName} 로고`}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb'
                      }}>
                        <Building2 size={24} color="#9ca3af" />
                      </div>
                    )}
                  </div>
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
