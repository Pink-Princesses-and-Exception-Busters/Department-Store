import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Download,
  FileText,
  Building2,
  CheckCircle,
  Activity,
  PieChart
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { useNavigate } from 'react-router-dom';


const StatisticsHQ = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('tenants');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');

  // 카테고리별 통계 데이터
  const categoryData = {
    tenants: {
      title: '입점사 관리',
      icon: Building2,
      color: '#007bff',
      stats: [
        { title: '총 입점사', value: '156', change: '+3', isPositive: true },
        { title: '신규 입점사', value: '12', change: '+2', isPositive: true },
        { title: '평균 매출', value: '₩2,450,000', change: '+8.5%', isPositive: true },
        { title: '만족도', value: '4.2/5.0', change: '+0.3', isPositive: true }
      ],
      details: {
        topTenants: [
          { name: '삼성전자', sales: 125000000, products: 45, satisfaction: 4.5 },
          { name: 'LG전자', sales: 98000000, products: 38, satisfaction: 4.3 },
          { name: '애플코리아', sales: 156000000, products: 52, satisfaction: 4.7 },
          { name: '현대자동차', sales: 67000000, products: 23, satisfaction: 4.1 },
          { name: '기아자동차', sales: 89000000, products: 31, satisfaction: 4.2 }
        ],
        categoryDistribution: [
          { category: '전자제품', count: 45, percentage: 28.8 },
          { category: '패션의류', count: 38, percentage: 24.4 },
          { category: '화장품', count: 25, percentage: 16.0 },
          { category: '식품', count: 22, percentage: 14.1 },
          { category: '가구', count: 15, percentage: 9.6 },
          { category: '기타', count: 11, percentage: 7.1 }
        ]
      }
    },
    products: {
      title: '상품 승인 관리',
      icon: CheckCircle,
      color: '#28a745',
      stats: [
        { title: '승인 대기', value: '23', change: '-5', isPositive: true },
        { title: '승인 완료', value: '156', change: '+12', isPositive: true },
        { title: '반려 건수', value: '8', change: '-2', isPositive: true },
        { title: '평균 처리시간', value: '2.3일', change: '-0.5일', isPositive: true }
      ],
      details: {
        approvalStatus: [
          { status: '승인 완료', count: 156, percentage: 83.4 },
          { status: '승인 대기', count: 23, percentage: 12.3 },
          { status: '반려', count: 8, percentage: 4.3 }
        ],
        categoryApproval: [
          { category: '전자제품', approved: 45, pending: 5, rejected: 2 },
          { category: '패션의류', approved: 38, pending: 8, rejected: 3 },
          { category: '화장품', approved: 25, pending: 4, rejected: 1 },
          { category: '식품', approved: 22, pending: 3, rejected: 1 },
          { category: '가구', approved: 15, pending: 2, rejected: 1 },
          { category: '기타', approved: 11, pending: 1, rejected: 0 }
        ]
      }
    },

    sales: {
      title: '매출 분석',
      icon: DollarSign,
      color: '#dc3545',
      stats: [
        { title: '총 매출', value: '₩45,670,000', change: '+12.5%', isPositive: true },
        { title: '총 주문', value: '1,234', change: '+8.3%', isPositive: true },
        { title: '평균 주문액', value: '₩37,000', change: '+3.8%', isPositive: true },
        { title: '고객 수', value: '892', change: '+15.2%', isPositive: true }
      ],
      details: {
        monthlySales: [
          { month: '1월', sales: 42000000, orders: 1150, customers: 820 },
          { month: '2월', sales: 45670000, orders: 1234, customers: 892 },
          { month: '3월', sales: 38900000, orders: 1056, customers: 756 },
          { month: '4월', sales: 52300000, orders: 1423, customers: 1023 },
          { month: '5월', sales: 47800000, orders: 1298, customers: 945 },
          { month: '6월', sales: 51200000, orders: 1389, customers: 987 }
        ],
        categorySales: [
          { category: '전자제품', sales: 15600000, percentage: 34.2 },
          { category: '패션의류', sales: 12300000, percentage: 26.9 },
          { category: '화장품', sales: 8900000, percentage: 19.5 },
          { category: '식품', sales: 6700000, percentage: 14.7 },
          { category: '가구', sales: 2100000, percentage: 4.7 }
        ]
      }
    },
    operations: {
      title: '운영 효율성',
      icon: Activity,
      color: '#6f42c1',
      stats: [
        { title: '시스템 가동률', value: '99.8%', change: '+0.2%', isPositive: true },
        { title: '평균 처리시간', value: '2.1시간', change: '-0.3시간', isPositive: true },
        { title: '업무 완료율', value: '96.5%', change: '+2.1%', isPositive: true },
        { title: '오류 발생률', value: '0.3%', change: '-0.1%', isPositive: true }
      ],
      details: {
        systemUsage: [
          { system: '입점사 관리', usage: 85, efficiency: 92 },
          { system: '상품 승인', usage: 78, efficiency: 88 },
          { system: '고객 서비스', usage: 92, efficiency: 95 },
          { system: '매출 분석', usage: 65, efficiency: 89 },
          { system: '정산 관리', usage: 88, efficiency: 91 }
        ],
        performanceMetrics: [
          { metric: '업무 처리량', current: 156, target: 150, percentage: 104 },
          { metric: '응답 시간', current: 2.1, target: 2.5, percentage: 119 },
          { metric: '정확도', current: 98.5, target: 95, percentage: 103.7 },
          { metric: '고객 만족도', current: 4.2, target: 4.0, percentage: 105 }
        ]
      }
    }
  };

  const currentCategory = categoryData[selectedCategory];

  // 리포트 생성 함수들
  const handleGenerateReport = (type) => {
    setReportType(type);
    setShowReportModal(true);
  };

  const handleDownloadReport = () => {
    let reportData = '';
    const currentDate = new Date().toISOString().split('T')[0];
    
    switch (reportType) {
      case 'category':
        reportData = [
          ['카테고리', '통계 데이터'].join(','),
          ['선택된 카테고리', currentCategory.title].join(','),
          ['기간', selectedPeriod === 'week' ? '주간' : '월간'].join(','),
          ...currentCategory.stats.map(stat => [stat.title, stat.value].join(','))
        ].join('\n');
        break;
      case 'detailed':
        const details = currentCategory.details;
        if (selectedCategory === 'tenants') {
          reportData = [
            ['입점사명', '매출', '상품수', '만족도'].join(','),
            ...details.topTenants.map(tenant => [
              tenant.name, 
              tenant.sales, 
              tenant.products, 
              tenant.satisfaction
            ].join(','))
          ].join('\n');
        } else if (selectedCategory === 'products') {
          reportData = [
            ['상태', '건수', '비율(%)'].join(','),
            ...details.approvalStatus.map(status => [
              status.status, 
              status.count, 
              status.percentage
            ].join(','))
          ].join('\n');
        }
        break;
      case 'comprehensive':
        reportData = [
          ['구분', '값', '변화율'].join(','),
          ...Object.values(categoryData).map(cat => 
            cat.stats.map(stat => [
              `${cat.title} - ${stat.title}`, 
              stat.value, 
              stat.change
            ].join(','))
          ).flat()
        ].join('\n');
        break;
      default:
        reportData = '리포트 데이터가 없습니다.';
    }

    const blob = new Blob([reportData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_리포트_${currentDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowReportModal(false);
    alert('리포트가 다운로드되었습니다.');
  };

  return (
    <div>
      {/* 기간 선택 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">본사 통계 분석</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${selectedPeriod === 'week' ? 'btn-primary' : ''}`}
              style={selectedPeriod !== 'week' ? { background: '#f8f9fa', color: '#333', border: '1px solid #ddd' } : {}}
              onClick={() => setSelectedPeriod('week')}
            >
              주간
            </button>
            <button 
              className={`btn ${selectedPeriod === 'month' ? 'btn-primary' : ''}`}
              style={selectedPeriod !== 'month' ? { background: '#f8f9fa', color: '#333', border: '1px solid #ddd' } : {}}
              onClick={() => setSelectedPeriod('month')}
            >
              월간
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(categoryData).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`btn ${selectedCategory === key ? 'btn-primary' : ''}`}
                style={selectedCategory !== key ? { 
                  background: '#f8f9fa', 
                  color: '#333', 
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                } : {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Icon size={16} />
                {category.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 카테고리 통계 */}
      <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
        {currentCategory.stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div 
              className="stat-icon" 
              style={{ backgroundColor: currentCategory.color }}
            >
              <currentCategory.icon size={24} />
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
              <small style={{ 
                color: stat.isPositive ? '#28a745' : '#dc3545', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {stat.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.change}
              </small>
            </div>
          </div>
        ))}
      </div>

      

             {/* 상세 통계 */}
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
         {/* 주요 지표 */}
         <div className="card">
                       <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">
                {selectedCategory === 'tenants' && '입점사별 매출 현황'}
                {selectedCategory === 'products' && '상품 승인 현황'}
                {selectedCategory === 'sales' && '카테고리별 매출'}
                {selectedCategory === 'operations' && '시스템별 사용률'}
              </h3>
              <button 
                className="btn btn-sm"
                style={{ 
                  background: currentCategory.color, 
                  color: 'white', 
                  border: 'none',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem'
                }}
                onClick={() => {
                  if (selectedCategory === 'tenants') {
                    navigate('/tenant-statistics');
                  } else if (selectedCategory === 'products') {
                    navigate('/product-management');
                  } else if (selectedCategory === 'sales') {
                    navigate('/sales-statistics');
                  } else if (selectedCategory === 'operations') {
                    navigate('/operations-statistics');
                  }
                }}
              >
                자세히 보기
              </button>
            </div>
          
          <div style={{ padding: '1rem 0' }}>
            {selectedCategory === 'tenants' && currentCategory.details.topTenants.map((tenant, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.topTenants.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{tenant.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    상품: {tenant.products}개 | 만족도: {tenant.satisfaction}/5.0
                  </div>
                </div>
                <div style={{ fontWeight: '600', color: currentCategory.color }}>
                  ₩{tenant.sales.toLocaleString()}
                </div>
              </div>
            ))}

            {selectedCategory === 'products' && currentCategory.details.approvalStatus.map((status, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.approvalStatus.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: status.status === '승인 완료' ? '#28a745' : 
                                   status.status === '승인 대기' ? '#ffc107' : '#dc3545'
                  }} />
                  <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{status.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: '600' }}>{status.count}건</span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>{status.percentage}%</span>
                </div>
              </div>
            ))}

            

            {selectedCategory === 'sales' && currentCategory.details.categorySales.map((category, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.categorySales.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{category.category}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: '600', color: currentCategory.color }}>
                    ₩{category.sales.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>{category.percentage}%</span>
                </div>
              </div>
            ))}

            {selectedCategory === 'operations' && currentCategory.details.systemUsage.map((system, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.systemUsage.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{system.system}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>사용률: {system.usage}%</span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>효율성: {system.efficiency}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

                 {/* 추가 분석 */}
         <div className="card">
                       <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">
                {selectedCategory === 'tenants' && '카테고리별 입점사 분포'}
                {selectedCategory === 'products' && '카테고리별 승인 현황'}
                {selectedCategory === 'sales' && '월별 매출 트렌드'}
                {selectedCategory === 'operations' && '성과 지표'}
              </h3>
              <button 
                className="btn btn-sm"
                style={{ 
                  background: currentCategory.color, 
                  color: 'white', 
                  border: 'none',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem'
                }}
                onClick={() => {
                  if (selectedCategory === 'tenants') {
                    navigate('/tenant-statistics');
                  } else if (selectedCategory === 'products') {
                    navigate('/product-management');
                  } else if (selectedCategory === 'sales') {
                    navigate('/sales-statistics');
                  } else if (selectedCategory === 'operations') {
                    navigate('/operations-statistics');
                  }
                }}
              >
                자세히 보기
              </button>
            </div>
          
          <div style={{ padding: '1rem 0' }}>
            {selectedCategory === 'tenants' && currentCategory.details.categoryDistribution.map((cat, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.categoryDistribution.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{cat.category}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: '600' }}>{cat.count}개</span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>{cat.percentage}%</span>
                </div>
              </div>
            ))}

            {selectedCategory === 'products' && currentCategory.details.categoryApproval.map((cat, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.categoryApproval.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{cat.category}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#28a745' }}>승인: {cat.approved}</span>
                  <span style={{ fontSize: '0.75rem', color: '#ffc107' }}>대기: {cat.pending}</span>
                  <span style={{ fontSize: '0.75rem', color: '#dc3545' }}>반려: {cat.rejected}</span>
                </div>
              </div>
            ))}

            

            {selectedCategory === 'sales' && currentCategory.details.monthlySales.map((month, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.monthlySales.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{month.month}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: '600', color: currentCategory.color }}>
                    ₩{month.sales.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    {month.orders}주문
                  </span>
                </div>
              </div>
            ))}

            {selectedCategory === 'operations' && currentCategory.details.performanceMetrics.map((metric, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < currentCategory.details.performanceMetrics.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{metric.metric}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: '600' }}>{metric.current}</span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    목표: {metric.target} ({metric.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 리포트 생성 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">리포트 생성</h3>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => handleGenerateReport('category')}
          >
            <BarChart3 size={16} />
            카테고리 리포트
          </button>
          <button 
            className="btn btn-success"
            onClick={() => handleGenerateReport('detailed')}
          >
            <PieChart size={16} />
            상세 분석
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => handleGenerateReport('comprehensive')}
          >
            <FileText size={16} />
            종합 리포트
          </button>
        </div>
      </div>

      {/* 리포트 생성 모달 */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="리포트 생성"
        size="medium"
      >
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <FileText size={48} color={currentCategory.color} style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
              {reportType === 'category' && `${currentCategory.title} 리포트`}
              {reportType === 'detailed' && `${currentCategory.title} 상세 분석`}
              {reportType === 'comprehensive' && '종합 통계 리포트'}
            </h3>
            <p style={{ color: '#666', margin: 0 }}>
              {reportType === 'category' && `${currentCategory.title}의 주요 통계 데이터를 CSV 파일로 다운로드합니다.`}
              {reportType === 'detailed' && `${currentCategory.title}의 상세 분석 데이터를 CSV 파일로 다운로드합니다.`}
              {reportType === 'comprehensive' && '모든 카테고리의 통계 데이터를 종합하여 CSV 파일로 다운로드합니다.'}
            </p>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>포함될 데이터:</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {reportType === 'category' && (
                <>
                  <li>카테고리별 주요 지표</li>
                  <li>변화율 및 성장률</li>
                  <li>기간별 비교 데이터</li>
                </>
              )}
              {reportType === 'detailed' && (
                <>
                  <li>상세 분석 데이터</li>
                  <li>분류별 세부 통계</li>
                  <li>비율 및 분포 정보</li>
                </>
              )}
              {reportType === 'comprehensive' && (
                <>
                  <li>전체 카테고리 통계</li>
                  <li>종합 성과 지표</li>
                  <li>비교 분석 데이터</li>
                </>
              )}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={handleDownloadReport}
            >
              <Download size={16} />
              다운로드
            </button>
            <button 
              className="btn" 
              style={{ background: '#6c757d', color: 'white' }}
              onClick={() => setShowReportModal(false)}
            >
              취소
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StatisticsHQ;