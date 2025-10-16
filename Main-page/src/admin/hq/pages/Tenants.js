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
  Loader,
  X
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { supabase } from '../../shared/lib/supabase';

const Tenants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantToTerminate, setTenantToTerminate] = useState(null);
  const [tenantToChangeGrade, setTenantToChangeGrade] = useState(null);
  const [newGrade, setNewGrade] = useState(1);
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

  // 등급에 따른 수수료율 (등급이 높을수록 수수료 낮음)
  const getCommissionByGrade = (grade) => {
    const commissionMap = {
      1: 3.0,  // 1등급 (프리미엄) - 가장 낮은 수수료
      2: 4.0,  // 2등급 (스탠다드) - 중간 수수료
      3: 5.0   // 3등급 (베이직) - 가장 높은 수수료
    };
    return commissionMap[grade] || 5.0;
  };

  // 등급별 혜택 설명
  const getGradeBenefits = (grade) => {
    const benefitsMap = {
      1: {
        name: "1등급 (프리미엄)",
        commission: "3.0%",
        benefits: [
          "최우선 상품 노출",
          "프리미엄 마케팅 지원",
          "전담 매니저 배정",
          "우선 고객 지원",
          "특별 프로모션 참여",
          "최저 수수료율 적용"
        ]
      },
      2: {
        name: "2등급 (스탠다드)",
        commission: "4.0%",
        benefits: [
          "우선 상품 노출",
          "마케팅 지원",
          "정기 상담 서비스",
          "고객 지원",
          "프로모션 참여"
        ]
      },
      3: {
        name: "3등급 (베이직)",
        commission: "5.0%",
        benefits: [
          "기본 상품 노출",
          "기본 마케팅 지원",
          "이메일 지원",
          "기본 프로모션 참여"
        ]
      }
    };
    return benefitsMap[grade] || benefitsMap[1];
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
          grade: 3, // 기본 등급 (3등급)
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
    // selectedTenant가 설정된 후 모달 열기
    setTimeout(() => {
      setShowDetailModal(true);
    }, 0);
  };

  // 계약 종료 확인
  const handleTerminateConfirm = (tenant) => {
    setTenantToTerminate(tenant);
    setShowTerminateModal(true);
  };

  // 계약 종료 실행
  const handleTerminateTenant = async () => {
    if (!tenantToTerminate) return;

    try {
      // 1. 입점사 상태를 'terminated'로 변경
      const { error: brandError } = await supabase
        .from('brand_admins')
        .update({ 
          status: 'terminated',
          terminated_at: new Date().toISOString()
        })
        .eq('id', tenantToTerminate.id);

      if (brandError) {
        throw brandError;
      }

      // 2. 해당 브랜드의 모든 상품을 'hidden' 상태로 변경 (숨김)
      const { error: productError } = await supabase
        .from('products')
        .update({ 
          status: 'hidden'
        })
        .eq('brand', tenantToTerminate.companyName);

      if (productError) {
        console.warn('상품 상태 업데이트 실패:', productError);
        // 상품 업데이트 실패해도 계약 종료는 진행
      }

      // 로컬 상태 업데이트
      setTenants(tenants.map(tenant => 
        tenant.id === tenantToTerminate.id ? { 
          ...tenant, 
          status: '계약종료',
          originalStatus: 'terminated',
          terminatedAt: new Date().toISOString()
        } : tenant
      ));
      
      setShowTerminateModal(false);
      setTenantToTerminate(null);
      
      // 성공 메시지에 상품 숨김 정보 포함
      alert(`'${tenantToTerminate.companyName}'의 계약이 종료되었습니다.\n해당 브랜드의 모든 상품이 숨김 처리되었습니다.`);
      
    } catch (err) {
      console.error('계약 종료 오류:', err);
      alert('계약 종료 중 오류가 발생했습니다.');
    }
  };

  // 등급 변경 확인
  const handleGradeChangeConfirm = (tenant) => {
    setTenantToChangeGrade(tenant);
    setNewGrade(tenant.grade);
    setShowGradeModal(true);
  };

  // 등급 변경 실행
  const handleGradeChange = async () => {
    if (!tenantToChangeGrade) return;

    try {
      const { error } = await supabase
        .from('brand_admins')
        .update({ 
          grade: newGrade
        })
        .eq('id', tenantToChangeGrade.id);

      if (error) {
        throw error;
      }

      // 로컬 상태 업데이트
      setTenants(tenants.map(tenant => 
        tenant.id === tenantToChangeGrade.id ? { 
          ...tenant, 
          grade: newGrade,
          commission: getCommissionByGrade(newGrade)
        } : tenant
      ));

      // 상세 모달이 열려있다면 해당 데이터도 업데이트
      if (selectedTenant && selectedTenant.id === tenantToChangeGrade.id) {
        setSelectedTenant({
          ...selectedTenant,
          grade: newGrade,
          commission: getCommissionByGrade(newGrade)
        });
      }
      
      setShowGradeModal(false);
      setTenantToChangeGrade(null);
      
      const gradeInfo = getGradeBenefits(newGrade);
      alert(`'${tenantToChangeGrade.companyName}'의 등급이 ${gradeInfo.name}로 변경되었습니다.\n수수료율: ${gradeInfo.commission}`);
      
    } catch (err) {
      console.error('등급 변경 오류:', err);
      alert('등급 변경 중 오류가 발생했습니다.');
    }
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
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>검색 및 필터</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
            <span>총 {filteredTenants.length}개 결과</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 검색 박스 */}
          <div style={{ 
            position: 'relative', 
            flex: '1', 
            minWidth: '300px',
            maxWidth: '400px'
          }}>
            <div style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              zIndex: 1
            }}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="입점사명, 대표자명, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          {/* 상태 필터 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            minWidth: '200px'
          }}>
            <Filter size={16} style={{ color: '#6b7280' }} />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 검색 초기화 버튼 */}
          {(searchTerm || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
              }}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
              }}
            >
              <XCircle size={14} />
              초기화
            </button>
          )}
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
                      {(tenant.status === '승인됨' || tenant.status === '일시정지') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleTerminateConfirm(tenant)}
                          title="계약 종료"
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: '1px solid #dc3545'
                          }}
                        >
                          <XCircle size={14} />
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
      {showDetailModal && selectedTenant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            {/* 고정 헤더 */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9fafb',
              borderRadius: '8px 8px 0 0'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                입점사 상세 정보
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          fontWeight: '600',
                          color: selectedTenant.grade === 1 ? '#dc3545' : selectedTenant.grade === 2 ? '#ffc107' : '#28a745'
                        }}>
                          {selectedTenant.grade}등급
                        </span>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleGradeChangeConfirm(selectedTenant)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                          title="등급 변경"
                        >
                          변경
                        </button>
                      </div>
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
            </div>

            {/* 고정 푸터 */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              borderRadius: '0 0 8px 8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* 상태 변경 버튼들 */}
                {selectedTenant && selectedTenant.status === '승인됨' && (
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleStatusChange(selectedTenant.id, '일시정지');
                    }}
                    title="일시정지"
                  >
                    <XCircle size={14} /> 일시정지
                  </button>
                )}
                {selectedTenant && selectedTenant.status === '일시정지' && (
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleStatusChange(selectedTenant.id, '승인됨');
                    }}
                    title="활성화"
                  >
                    <CheckCircle size={14} /> 활성화
                  </button>
                )}
                {selectedTenant && (selectedTenant.status === '승인됨' || selectedTenant.status === '일시정지') && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleTerminateConfirm(selectedTenant);
                    }}
                    title="계약 종료"
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: '1px solid #dc3545'
                    }}
                  >
                    <XCircle size={14} /> 계약 종료
                  </button>
                )}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDetailModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: '1px solid #6c757d',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계약 종료 확인 모달 */}
      <Modal
        isOpen={showTerminateModal}
        onClose={() => {
          setShowTerminateModal(false);
          setTenantToTerminate(null);
        }}
        title="계약 종료 확인"
      >
        {tenantToTerminate && (
          <div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#dc2626',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                <XCircle size={20} />
                <span>경고</span>
              </div>
              <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.9rem' }}>
                이 작업은 되돌릴 수 없습니다. 계약 종료 후에는 입점사가 더 이상 서비스를 이용할 수 없습니다.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>계약 종료 대상</h4>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1f2937' }}>
                      {tenantToTerminate.companyName}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {tenantToTerminate.email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      color: '#6b7280', 
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}>
                      현재 상태
                    </div>
                    <span className={`badge ${getStatusBadge(tenantToTerminate.status)}`}>
                      {tenantToTerminate.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>계약 종료 시 영향</h5>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e', fontSize: '0.9rem' }}>
                <li>입점사 계정이 비활성화됩니다</li>
                <li><strong>등록된 모든 상품이 '숨김' 상태로 변경됩니다</strong></li>
                <li>재고가 있어도 상품이 고객에게 노출되지 않습니다</li>
                <li>새로운 주문을 받을 수 없습니다</li>
                <li>기존 주문은 처리 완료까지 유지됩니다</li>
                <li>필요시 관리자가 상품을 다시 활성화할 수 있습니다</li>
                <li>이 작업은 되돌릴 수 없습니다</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowTerminateModal(false);
                  setTenantToTerminate(null);
                }}
              >
                취소
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleTerminateTenant}
                style={{
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545',
                  color: 'white'
                }}
              >
                계약 종료
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 등급 변경 모달 */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => {
          setShowGradeModal(false);
          setTenantToChangeGrade(null);
        }}
        title="입점사 등급 변경"
      >
        {tenantToChangeGrade && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>등급 변경 대상</h4>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1f2937' }}>
                  {tenantToChangeGrade.companyName}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  현재 등급: {getGradeBenefits(tenantToChangeGrade.grade).name}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>새 등급 선택</label>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={1}>1등급 (프리미엄) - 수수료 3.0%</option>
                <option value={2}>2등급 (스탠다드) - 수수료 4.0%</option>
                <option value={3}>3등급 (베이직) - 수수료 5.0%</option>
              </select>
            </div>

            {/* 선택된 등급의 혜택 표시 */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>
                {getGradeBenefits(newGrade).name} 혜택
              </h5>
              <div style={{ color: '#0c4a6e', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                  수수료율: {getGradeBenefits(newGrade).commission}
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {getGradeBenefits(newGrade).benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowGradeModal(false);
                  setTenantToChangeGrade(null);
                }}
              >
                취소
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleGradeChange}
                style={{
                  backgroundColor: '#3b82f6',
                  borderColor: '#3b82f6',
                  color: 'white'
                }}
              >
                등급 변경
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tenants;
