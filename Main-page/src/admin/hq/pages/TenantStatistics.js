import React, { useState } from 'react';
import { 
  Building2,
  DollarSign,
  Users,
  Star,
  BarChart3,
  Download,
  ArrowLeft,
  PieChart,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TenantStatistics = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  // 상세 입점사 통계 데이터 (mock data)
  const tenantData = {
    overview: {
      totalTenants: 156,
      newTenants: 12,
      averageSales: 2450000,
      satisfaction: 4.2,
      growthRate: 8.5
    },
    topTenants: [
      { name: '삼성전자', sales: 125000000, products: 45, satisfaction: 4.5, growth: 12.3 },
      { name: 'LG전자', sales: 98000000, products: 38, satisfaction: 4.3, growth: 8.7 },
      { name: '애플코리아', sales: 156000000, products: 52, satisfaction: 4.7, growth: 15.2 },
      { name: '현대자동차', sales: 67000000, products: 23, satisfaction: 4.1, growth: 5.8 },
      { name: '기아자동차', sales: 89000000, products: 31, satisfaction: 4.2, growth: 9.1 }
    ],
    categoryDistribution: [
      { category: '전자제품', count: 45, percentage: 28.8, sales: 156000000 },
      { category: '패션의류', count: 38, percentage: 24.4, sales: 123000000 },
      { category: '화장품', count: 25, percentage: 16.0, sales: 89000000 },
      { category: '식품', count: 22, percentage: 14.1, sales: 67000000 },
      { category: '가구', count: 15, percentage: 9.6, sales: 45000000 },
      { category: '기타', count: 11, percentage: 7.1, sales: 32000000 }
    ],
    monthlyTrends: [
      { month: '1월', newTenants: 8, totalSales: 420000000, satisfaction: 4.1 },
      { month: '2월', newTenants: 12, totalSales: 456700000, satisfaction: 4.2 },
      { month: '3월', newTenants: 15, totalSales: 389000000, satisfaction: 4.0 },
      { month: '4월', newTenants: 10, totalSales: 523000000, satisfaction: 4.3 },
      { month: '5월', newTenants: 18, totalSales: 478000000, satisfaction: 4.2 },
      { month: '6월', newTenants: 12, totalSales: 512000000, satisfaction: 4.2 }
    ],
    performanceMetrics: [
      { metric: '평균 매출', value: '₩2,450,000', target: '₩2,200,000', percentage: 111.4 },
      { metric: '상품 다양성', value: '32개', target: '28개', percentage: 114.3 },
      { metric: '고객 만족도', value: '4.2/5.0', target: '4.0/5.0', percentage: 105.0 },
      { metric: '재계약율', value: '94.2%', target: '90.0%', percentage: 104.7 }
    ]
  };

  const views = [
    { id: 'overview', title: '개요', icon: Activity },
    { id: 'topTenants', title: 'TOP 입점사', icon: Star },
    { id: 'categoryDistribution', title: '카테고리 분포', icon: PieChart },
    { id: 'monthlyTrends', title: '월별 트렌드', icon: BarChart3 },
    { id: 'performanceMetrics', title: '성과 지표', icon: Building2 }
  ];

  const renderOverview = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">입점사 관리 개요</h3>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Building2 size={32} color="#007bff" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#007bff' }}>{tenantData.overview.totalTenants}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>총 입점사</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Users size={32} color="#28a745" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#28a745' }}>{tenantData.overview.newTenants}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>신규 입점사</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <DollarSign size={32} color="#ffc107" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#ffc107' }}>₩{tenantData.overview.averageSales.toLocaleString()}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>평균 매출</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Star size={32} color="#dc3545" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#dc3545' }}>{tenantData.overview.satisfaction}/5.0</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>평균 만족도</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTopTenants = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">TOP 입점사 현황</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {tenantData.topTenants.map((tenant, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < tenantData.topTenants.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#007bff',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {index + 1}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{tenant.name}</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  상품: {tenant.products}개 | 만족도: {tenant.satisfaction}/5.0
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                ₩{tenant.sales.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#28a745' }}>
                +{tenant.growth}% 성장
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoryDistribution = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">카테고리별 입점사 분포</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {tenantData.categoryDistribution.map((cat, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < tenantData.categoryDistribution.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{cat.category}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {cat.count}개 입점사 ({cat.percentage}%)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                ₩{cat.sales.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                총 매출
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthlyTrends = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">월별 입점사 트렌드</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {tenantData.monthlyTrends.map((month, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < tenantData.monthlyTrends.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{month.month}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                신규 입점사: {month.newTenants}개
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                ₩{month.totalSales.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                만족도: {month.satisfaction}/5.0
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformanceMetrics = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">성과 지표</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {tenantData.performanceMetrics.map((metric, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < tenantData.performanceMetrics.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{metric.metric}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                {metric.value}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                목표: {metric.target} ({metric.percentage}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'overview':
        return renderOverview();
      case 'topTenants':
        return renderTopTenants();
      case 'categoryDistribution':
        return renderCategoryDistribution();
      case 'monthlyTrends':
        return renderMonthlyTrends();
      case 'performanceMetrics':
        return renderPerformanceMetrics();
      default:
        return renderOverview();
    }
  };

  return (
    <div>
      {/* Header with back button and period selection */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn"
              onClick={() => navigate('/statistics')}
              style={{ background: '#f8f9fa', border: '1px solid #ddd' }}
            >
              <ArrowLeft size={16} />
              뒤로가기
            </button>
            <h2 className="card-title" style={{ margin: 0 }}>입점사 관리 상세 통계</h2>
          </div>
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

      {/* View selection buttons */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={`btn ${selectedView === view.id ? 'btn-primary' : ''}`}
                style={selectedView !== view.id ? { 
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
                {view.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div style={{ marginTop: '1.5rem' }}>
        {renderContent()}
      </div>

      {/* Report download section */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">리포트 다운로드</h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">
            <Download size={16} />
            전체 리포트 다운로드
          </button>
          <button className="btn btn-success">
            <BarChart3 size={16} />
            TOP 입점사 리포트
          </button>
          <button className="btn btn-warning">
            <PieChart size={16} />
            카테고리별 분석
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantStatistics;
