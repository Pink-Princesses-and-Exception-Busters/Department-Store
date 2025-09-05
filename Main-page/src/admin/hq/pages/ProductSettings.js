import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  Edit,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const ProductSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // 승인 정책 데이터 (mock data)
  const [policies, setPolicies] = useState([
    {
      id: 1,
      name: '전자제품 품질 기준',
      category: '전자제품',
      description: '전자제품의 품질 및 안전성 기준',
      criteria: [
        'KC 인증 필수',
        '제품 보증 기간 1년 이상',
        'A/S 센터 보유',
        '환불 정책 명시'
      ],
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    },
    {
      id: 2,
      name: '패션의류 품질 기준',
      category: '패션의류',
      description: '패션의류의 품질 및 원산지 기준',
      criteria: [
        '원산지 표시 필수',
        '소재 성분 표시',
        '사이즈 가이드 제공',
        '세탁 방법 명시'
      ],
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-10'
    },
    {
      id: 3,
      name: '화장품 안전 기준',
      category: '화장품',
      description: '화장품의 안전성 및 성분 기준',
      criteria: [
        '식약처 허가 필수',
        '성분 표시 의무',
        '사용기한 명시',
        '알레르기 주의사항'
      ],
      isActive: false,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-12'
    }
  ]);

  // 일반 설정 데이터
  const [generalSettings, setGeneralSettings] = useState({
    autoApproval: false,
    approvalTimeLimit: 3,
    requireDocumentation: true,
    notificationEnabled: true,
    qualityThreshold: 80
  });

  // 새 정책 폼 데이터
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    category: '',
    description: '',
    criteria: ['']
  });

  const handleSaveGeneralSettings = () => {
    // 실제 구현에서는 API 호출
    alert('일반 설정이 저장되었습니다.');
  };

  const handleAddPolicy = () => {
    if (!newPolicy.name || !newPolicy.category) {
      alert('정책명과 카테고리를 입력해주세요.');
      return;
    }

    const policy = {
      id: Date.now(),
      ...newPolicy,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setPolicies([...policies, policy]);
    setNewPolicy({ name: '', category: '', description: '', criteria: [''] });
    setShowAddPolicy(false);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setNewPolicy({
      name: policy.name,
      category: policy.category,
      description: policy.description,
      criteria: [...policy.criteria]
    });
    setShowAddPolicy(true);
  };

  const handleUpdatePolicy = () => {
    if (!newPolicy.name || !newPolicy.category) {
      alert('정책명과 카테고리를 입력해주세요.');
      return;
    }

    setPolicies(policies.map(p => 
      p.id === editingPolicy.id 
        ? { 
            ...p, 
            ...newPolicy, 
            updatedAt: new Date().toISOString().split('T')[0] 
          }
        : p
    ));

    setNewPolicy({ name: '', category: '', description: '', criteria: [''] });
    setEditingPolicy(null);
    setShowAddPolicy(false);
  };

  const handleDeletePolicy = (policyId) => {
    if (window.confirm('정책을 삭제하시겠습니까?')) {
      setPolicies(policies.filter(p => p.id !== policyId));
    }
  };

  const handleTogglePolicy = (policyId) => {
    setPolicies(policies.map(p => 
      p.id === policyId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const addCriteria = () => {
    setNewPolicy({
      ...newPolicy,
      criteria: [...newPolicy.criteria, '']
    });
  };

  const removeCriteria = (index) => {
    const newCriteria = newPolicy.criteria.filter((_, i) => i !== index);
    setNewPolicy({
      ...newPolicy,
      criteria: newCriteria
    });
  };

  const updateCriteria = (index, value) => {
    const newCriteria = [...newPolicy.criteria];
    newCriteria[index] = value;
    setNewPolicy({
      ...newPolicy,
      criteria: newCriteria
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <Settings size={24} />
          <h1>승인 정책 설정</h1>
        </div>
        <p className="page-description">
          상품 승인 기준과 정책을 관리합니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          일반 설정
        </button>
        <button 
          className={`tab-button ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          승인 정책
        </button>
      </div>

      {/* 일반 설정 탭 */}
      {activeTab === 'general' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">일반 설정</h2>
            <button 
              className="btn btn-primary"
              onClick={handleSaveGeneralSettings}
            >
              <Save size={16} />
              저장
            </button>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="setting-group">
                <label className="setting-label">
                  <input 
                    type="checkbox"
                    checked={generalSettings.autoApproval}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      autoApproval: e.target.checked
                    })}
                  />
                  자동 승인 활성화
                </label>
                <p className="setting-description">
                  특정 조건을 만족하는 상품은 자동으로 승인됩니다.
                </p>
              </div>

              <div className="setting-group">
                <label className="setting-label">승인 처리 기한 (일)</label>
                <input 
                  type="number"
                  min="1"
                  max="30"
                  value={generalSettings.approvalTimeLimit}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    approvalTimeLimit: parseInt(e.target.value)
                  })}
                  className="form-input"
                />
                <p className="setting-description">
                  상품 승인 요청 후 처리해야 할 기한을 설정합니다.
                </p>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <input 
                    type="checkbox"
                    checked={generalSettings.requireDocumentation}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      requireDocumentation: e.target.checked
                    })}
                  />
                  서류 제출 필수
                </label>
                <p className="setting-description">
                  상품 등록 시 관련 서류 제출을 필수로 합니다.
                </p>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <input 
                    type="checkbox"
                    checked={generalSettings.notificationEnabled}
                    onChange={(e) => setGeneralSettings({
                      ...generalSettings,
                      notificationEnabled: e.target.checked
                    })}
                  />
                  알림 활성화
                </label>
                <p className="setting-description">
                  승인 상태 변경 시 관련자에게 알림을 발송합니다.
                </p>
              </div>

              <div className="setting-group">
                <label className="setting-label">품질 기준 임계값 (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={generalSettings.qualityThreshold}
                  onChange={(e) => setGeneralSettings({
                    ...generalSettings,
                    qualityThreshold: parseInt(e.target.value)
                  })}
                  className="form-input"
                />
                <p className="setting-description">
                  자동 승인을 위한 최소 품질 기준 점수를 설정합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 승인 정책 탭 */}
      {activeTab === 'policies' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">승인 정책 관리</h2>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingPolicy(null);
                  setNewPolicy({ name: '', category: '', description: '', criteria: [''] });
                  setShowAddPolicy(true);
                }}
              >
                <Plus size={16} />
                정책 추가
              </button>
            </div>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>정책명</th>
                    <th>카테고리</th>
                    <th>상태</th>
                    <th>생성일</th>
                    <th>수정일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '600' }}>{policy.name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {policy.description}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{policy.category}</span>
                      </td>
                      <td>
                        <span className={`badge ${policy.isActive ? 'badge-success' : 'badge-secondary'}`}>
                          {policy.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td>{policy.createdAt}</td>
                      <td>{policy.updatedAt}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-sm"
                            onClick={() => handleTogglePolicy(policy.id)}
                          >
                            {policy.isActive ? '비활성화' : '활성화'}
                          </button>
                          <button 
                            className="btn btn-sm"
                            onClick={() => handleEditPolicy(policy)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeletePolicy(policy.id)}
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
          </div>
        </div>
      )}

      {/* 정책 추가/수정 모달 */}
      {showAddPolicy && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingPolicy ? '정책 수정' : '정책 추가'}</h3>
              <button 
                className="btn btn-sm"
                onClick={() => {
                  setShowAddPolicy(false);
                  setEditingPolicy(null);
                  setNewPolicy({ name: '', category: '', description: '', criteria: [''] });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label className="form-label">정책명 *</label>
                  <input 
                    type="text"
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({...newPolicy, name: e.target.value})}
                    className="form-input"
                    placeholder="정책명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="form-label">카테고리 *</label>
                  <select 
                    value={newPolicy.category}
                    onChange={(e) => setNewPolicy({...newPolicy, category: e.target.value})}
                    className="form-input"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="전자제품">전자제품</option>
                    <option value="패션의류">패션의류</option>
                    <option value="화장품">화장품</option>
                    <option value="식품">식품</option>
                    <option value="가구">가구</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">설명</label>
                  <textarea 
                    value={newPolicy.description}
                    onChange={(e) => setNewPolicy({...newPolicy, description: e.target.value})}
                    className="form-input"
                    rows="3"
                    placeholder="정책에 대한 설명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="form-label">승인 기준</label>
                  {newPolicy.criteria.map((criterion, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input 
                        type="text"
                        value={criterion}
                        onChange={(e) => updateCriteria(index, e.target.value)}
                        className="form-input"
                        placeholder="승인 기준을 입력하세요"
                      />
                      <button 
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeCriteria(index)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    className="btn btn-sm"
                    onClick={addCriteria}
                  >
                    <Plus size={14} />
                    기준 추가
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddPolicy(false);
                  setEditingPolicy(null);
                  setNewPolicy({ name: '', category: '', description: '', criteria: [''] });
                }}
              >
                취소
              </button>
              <button 
                className="btn btn-primary"
                onClick={editingPolicy ? handleUpdatePolicy : handleAddPolicy}
              >
                {editingPolicy ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSettings;
