import React, { useState, useEffect } from 'react';
import {
  Save,
  Bell,
  Shield,
  Mail,
  Smartphone,
  Package,
  Building2,
  CheckCircle,
  Calendar,
  BarChart3,
  AlertTriangle,
  Settings as SettingsIcon,
  Plus,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen
} from 'lucide-react';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('notification');
  
  const [settings, setSettings] = useState({
    notifications: {
      newTenantApplication: true,
      productApprovalRequest: true,
      tenantContractExpiry: true,
      salesReport: true,
      customerComplaint: true,
      systemMaintenance: false,
      smsAlert: false,
      emailAlert: true
    }
  });

  // 카테고리 관리 상태
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parent_id: null,
    level: 1
  });

  // 권한에 따라 탭 목록을 동적으로 생성
  const tabs = [
    { id: 'notification', label: '알림 설정', icon: Bell },
    { id: 'security', label: '보안 설정', icon: Shield },
    ...(isAdmin() ? [{ id: 'category', label: '카테고리 관리', icon: Package }] : [])
  ];



  // 카테고리 데이터 로드
  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
      alert('카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 권한 체크 및 탭 리디렉션
  useEffect(() => {
    if (activeTab === 'category' && !isAdmin()) {
      setActiveTab('notification');
    }
  }, [activeTab, isAdmin]);

  // 컴포넌트 마운트 시 카테고리 로드
  useEffect(() => {
    if (activeTab === 'category' && isAdmin()) {
      loadCategories();
    }
  }, [activeTab, isAdmin]);

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name,
          description: newCategory.description,
          parent_id: newCategory.parent_id,
          level: newCategory.level
        }])
        .select();

      if (error) throw error;

      setCategories([...categories, ...data]);
      setNewCategory({ name: '', description: '', parent_id: null, level: 1 });
      setShowAddModal(false);
      alert('카테고리가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
      alert('카테고리 추가에 실패했습니다.');
    }
  };

  // 카테고리 수정
  const handleEditCategory = async () => {
    if (!selectedCategory || !selectedCategory.name.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: selectedCategory.name,
          description: selectedCategory.description
        })
        .eq('id', selectedCategory.id)
        .select();

      if (error) throw error;

      setCategories(categories.map(cat => 
        cat.id === selectedCategory.id ? data[0] : cat
      ));
      setShowEditModal(false);
      setSelectedCategory(null);
      alert('카테고리가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      alert('카테고리 수정에 실패했습니다.');
    }
  };

  // 하위 카테고리 재귀적으로 찾기
  const getAllChildCategories = (parentId) => {
    const children = categories.filter(cat => cat.parent_id === parentId);
    let allChildren = [...children];
    
    children.forEach(child => {
      allChildren = [...allChildren, ...getAllChildCategories(child.id)];
    });
    
    return allChildren;
  };

  // 카테고리를 사용하는 상품 확인
  const checkProductsUsingCategories = async (categoryIds) => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category_id')
        .in('category_id', categoryIds);

      if (error) throw error;
      return products || [];
    } catch (error) {
      console.error('상품 확인 오류:', error);
      return [];
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (categoryId) => {
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    const childCategories = getAllChildCategories(categoryId);
    const hasChildren = childCategories.length > 0;

    // 삭제할 모든 카테고리 ID 수집
    const categoriesToDelete = [categoryId, ...childCategories.map(cat => cat.id)];

    // 해당 카테고리들을 사용하는 상품 확인
    const productsUsingCategories = await checkProductsUsingCategories(categoriesToDelete);

    let confirmMessage = `정말로 "${categoryToDelete?.name}" 카테고리를 삭제하시겠습니까?`;
    
    if (hasChildren) {
      confirmMessage = `"${categoryToDelete?.name}" 카테고리와 하위 카테고리 ${childCategories.length}개가 모두 삭제됩니다.\n\n삭제될 카테고리:\n`;
      confirmMessage += `- ${categoryToDelete?.name}\n`;
      childCategories.forEach(child => {
        const indent = '  '.repeat(child.level - categoryToDelete.level);
        confirmMessage += `${indent}- ${child.name}\n`;
      });
    }

    // 상품이 있는 경우 경고 추가
    if (productsUsingCategories.length > 0) {
      confirmMessage += `\n⚠️ 주의: 이 카테고리들을 사용하는 상품이 ${productsUsingCategories.length}개 있습니다.\n`;
      confirmMessage += `삭제된 카테고리를 사용하는 상품들은 "기타" 카테고리로 이동됩니다.\n`;
      
      if (productsUsingCategories.length <= 10) {
        confirmMessage += `\n영향받는 상품:\n`;
        productsUsingCategories.forEach(product => {
          const categoryName = categories.find(cat => cat.id === product.category_id)?.name || '알 수 없음';
          confirmMessage += `- ${product.name} (${categoryName})\n`;
        });
      }
    }

    confirmMessage += '\n정말로 삭제하시겠습니까?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // 1. 먼저 해당 카테고리를 사용하는 상품들을 "기타" 카테고리로 이동
      if (productsUsingCategories.length > 0) {
        // "기타" 카테고리 찾기 (없으면 생성)
        let otherCategory = categories.find(cat => cat.name === '기타');
        
        if (!otherCategory) {
          const { data: newCategory, error: createError } = await supabase
            .from('categories')
            .insert([{
              name: '기타',
              description: '분류되지 않은 상품들',
              parent_id: null,
              level: 1
            }])
            .select()
            .single();

          if (createError) throw createError;
          otherCategory = newCategory;
          setCategories([...categories, newCategory]);
        }

        // 상품들을 "기타" 카테고리로 이동
        for (const product of productsUsingCategories) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ category_id: otherCategory.id })
            .eq('id', product.id);

          if (updateError) throw updateError;
        }
      }

      // 2. 하위 카테고리부터 역순으로 삭제 (레벨이 높은 것부터)
      const sortedToDelete = categoriesToDelete.sort((a, b) => {
        const catA = categories.find(cat => cat.id === a);
        const catB = categories.find(cat => cat.id === b);
        return (catB?.level || 0) - (catA?.level || 0);
      });

      // 순차적으로 삭제
      for (const id of sortedToDelete) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`카테고리 ${id} 삭제 오류:`, error);
          throw error;
        }
      }

      // 상태에서 삭제된 카테고리들 제거
      setCategories(categories.filter(cat => !categoriesToDelete.includes(cat.id)));
      
      const deletedCount = categoriesToDelete.length;
      let successMessage = `${deletedCount}개의 카테고리가 성공적으로 삭제되었습니다.`;
      
      if (productsUsingCategories.length > 0) {
        successMessage += `\n${productsUsingCategories.length}개의 상품이 "기타" 카테고리로 이동되었습니다.`;
      }
      
      alert(successMessage);
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      alert(`카테고리 삭제에 실패했습니다.\n오류: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // 로컬 스토리지에 설정 저장
      localStorage.setItem('shopSettings', JSON.stringify(settings));
      alert('설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  



  const NotificationSettings = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">알림 설정</h3>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {[
          { 
            title: '신규 입점사 신청 알림', 
            desc: '새로운 입점사 신청이 접수될 때 알림을 받습니다', 
            icon: Building2, 
            key: 'newTenantApplication',
            enabled: settings.notifications.newTenantApplication 
          },
          { 
            title: '상품 승인 요청 알림', 
            desc: '입점사에서 상품 승인을 요청할 때 알림을 받습니다', 
            icon: CheckCircle, 
            key: 'productApprovalRequest',
            enabled: settings.notifications.productApprovalRequest 
          },
          { 
            title: '계약 만료 알림', 
            desc: '입점사 계약 만료일이 다가올 때 알림을 받습니다', 
            icon: Calendar, 
            key: 'tenantContractExpiry',
            enabled: settings.notifications.tenantContractExpiry 
          },
          { 
            title: '매출 리포트 알림', 
            desc: '일일/주간/월간 매출 리포트가 생성될 때 알림을 받습니다', 
            icon: BarChart3, 
            key: 'salesReport',
            enabled: settings.notifications.salesReport 
          },
          { 
            title: '고객 불만 접수 알림', 
            desc: '고객 불만이나 중요한 문의가 접수될 때 알림을 받습니다', 
            icon: AlertTriangle, 
            key: 'customerComplaint',
            enabled: settings.notifications.customerComplaint 
          },
          { 
            title: '시스템 점검 알림', 
            desc: '시스템 점검이나 업데이트 시 알림을 받습니다', 
            icon: SettingsIcon, 
            key: 'systemMaintenance',
            enabled: settings.notifications.systemMaintenance 
          },
          { 
            title: 'SMS 알림', 
            desc: '긴급하거나 중요한 알림을 SMS로 받습니다', 
            icon: Smartphone, 
            key: 'smsAlert',
            enabled: settings.notifications.smsAlert 
          },
          { 
            title: '이메일 알림', 
            desc: '모든 알림을 이메일로도 받습니다', 
            icon: Mail, 
            key: 'emailAlert',
            enabled: settings.notifications.emailAlert 
          }
        ].map((notification, index) => {
          const Icon = notification.icon;
          return (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: notification.enabled ? '#007bff' : '#6c757d',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <Icon size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {notification.desc}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={notification.enabled}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        [notification.key]: e.target.checked
                      }
                    }));
                  }}
                  style={{ transform: 'scale(1.2)' }}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 카테고리 트리 렌더링 함수
  const renderCategoryTree = (parentId = null, level = 0) => {
    const childCategories = categories.filter(cat => cat.parent_id === parentId);
    
    return childCategories.map(category => {
      const hasChildren = categories.some(cat => cat.parent_id === category.id);
      const isExpanded = expandedCategories.has(category.id);
      
      return (
        <div key={category.id} style={{ marginLeft: `${level * 20}px` }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              background: level % 2 === 0 ? '#f8f9fa' : 'white',
              borderRadius: '4px',
              marginBottom: '0.25rem'
            }}
          >
            {hasChildren ? (
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedCategories);
                  if (isExpanded) {
                    newExpanded.delete(category.id);
                  } else {
                    newExpanded.add(category.id);
                  }
                  setExpandedCategories(newExpanded);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div style={{ width: '20px' }} />
            )}
            
            {hasChildren ? (
              isExpanded ? <FolderOpen size={16} color="#007bff" /> : <Folder size={16} color="#007bff" />
            ) : (
              <Package size={14} color="#666" />
            )}
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: level === 0 ? '600' : 'normal' }}>
                {category.name}
              </div>
              {category.description && (
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {category.description}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => {
                  setSelectedCategory({ ...category });
                  setShowEditModal(true);
                }}
                className="btn btn-sm"
                style={{
                  background: 'transparent',
                  border: '1px solid #ddd',
                  padding: '0.25rem 0.5rem'
                }}
                title="수정"
              >
                <Edit3 size={12} />
              </button>
              
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="btn btn-sm"
                style={{
                  background: 'transparent',
                  border: '1px solid #dc3545',
                  color: '#dc3545',
                  padding: '0.25rem 0.5rem'
                }}
                title="삭제"
              >
                <Trash2 size={12} />
              </button>
              
              <button
                onClick={() => {
                  setNewCategory({
                    name: '',
                    description: '',
                    parent_id: category.id,
                    level: category.level + 1
                  });
                  setShowAddModal(true);
                }}
                className="btn btn-sm btn-primary"
                style={{ padding: '0.25rem 0.5rem' }}
                title="하위 카테고리 추가"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          
          {hasChildren && isExpanded && renderCategoryTree(category.id, level + 1)}
        </div>
      );
    });
  };

  // 카테고리 관리 컴포넌트
  const CategoryManagement = () => (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">카테고리 관리</h3>
        <button
          onClick={() => {
            setNewCategory({ name: '', description: '', parent_id: null, level: 1 });
            setShowAddModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          최상위 카테고리 추가
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          카테고리를 불러오는 중...
        </div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>등록된 카테고리가 없습니다.</p>
          <p>최상위 카테고리를 추가해보세요.</p>
        </div>
      ) : (
        <div style={{ padding: '1rem 0' }}>
          {renderCategoryTree()}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notification': return <NotificationSettings />;
      case 'security':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">보안 설정</h3>
            </div>
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              보안 설정 기능은 준비 중입니다.
            </p>
          </div>
        );
      case 'category': return isAdmin() ? <CategoryManagement /> : null;
      default: return <NotificationSettings />;
    }
  };

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="card">
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : ''}`}
                style={activeTab !== tab.id ? {
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd'
                } : {}}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {renderTabContent()}

      {/* 저장 버튼 - 카테고리 탭이 아닐 때만 표시 */}
      {activeTab !== 'category' && (
        <div style={{
          position: 'sticky',
          bottom: '2rem',
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          <button
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem' }}
            onClick={handleSaveSettings}
          >
            <Save size={16} />
            설정 저장
          </button>
        </div>
      )}

      {/* 카테고리 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={newCategory.parent_id ? "하위 카테고리 추가" : "최상위 카테고리 추가"}
      >
        <div className="form-group">
          <label>카테고리 이름 *</label>
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
            placeholder="카테고리 이름을 입력하세요"
          />
        </div>
        
        <div className="form-group">
          <label>설명</label>
          <textarea
            value={newCategory.description}
            onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
            placeholder="카테고리 설명을 입력하세요"
            rows="3"
          />
        </div>

        {newCategory.parent_id && (
          <div className="form-group">
            <label>상위 카테고리</label>
            <p style={{ margin: 0, color: '#666', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
              {categories.find(cat => cat.id === newCategory.parent_id)?.name || '알 수 없음'}
            </p>
          </div>
        )}
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleAddCategory}>
            추가
          </button>
        </div>
      </Modal>

      {/* 카테고리 수정 모달 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="카테고리 수정"
      >
        {selectedCategory && (
          <>
            <div className="form-group">
              <label>카테고리 이름 *</label>
              <input
                type="text"
                value={selectedCategory.name}
                onChange={(e) => setSelectedCategory({...selectedCategory, name: e.target.value})}
                placeholder="카테고리 이름을 입력하세요"
              />
            </div>
            
            <div className="form-group">
              <label>설명</label>
              <textarea
                value={selectedCategory.description || ''}
                onChange={(e) => setSelectedCategory({...selectedCategory, description: e.target.value})}
                placeholder="카테고리 설명을 입력하세요"
                rows="3"
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleEditCategory}>
                수정
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Settings;