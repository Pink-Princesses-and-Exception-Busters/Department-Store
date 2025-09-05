import React, { useState } from 'react';
import { 
  DollarSign,
  TrendingUp,
  BarChart3,
  Download,
  ArrowLeft,
  PieChart,
  Activity,
  ShoppingCart,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SalesStatistics = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  // 상세 매출 통계 데이터 (mock data)
  const salesData = {
    overview: {
      totalSales: 456700000,
      totalOrders: 1234,
      averageOrderValue: 370000,
      totalCustomers: 892,
      growthRate: 12.5
    },
    monthlySales: [
      { month: '1월', sales: 42000000, orders: 1150, customers: 820, growth: 8.2 },
      { month: '2월', sales: 45670000, orders: 1234, customers: 892, growth: 12.5 },
      { month: '3월', sales: 38900000, orders: 1056, customers: 756, growth: -2.1 },
      { month: '4월', sales: 52300000, orders: 1423, customers: 1023, growth: 18.7 },
      { month: '5월', sales: 47800000, orders: 1298, customers: 945, growth: 15.3 },
      { month: '6월', sales: 51200000, orders: 1389, customers: 987, growth: 22.1 }
    ],
    categorySales: [
      { category: '전자제품', sales: 156000000, percentage: 34.2, orders: 423, avgOrder: 368000 },
      { category: '패션의류', sales: 123000000, percentage: 26.9, orders: 332, avgOrder: 370000 },
      { category: '화장품', sales: 89000000, percentage: 19.5, orders: 245, avgOrder: 363000 },
      { category: '식품', sales: 67000000, percentage: 14.7, orders: 178, avgOrder: 376000 },
      { category: '가구', sales: 21000000, percentage: 4.7, orders: 56, avgOrder: 375000 }
    ],
    customerAnalysis: [
      { segment: 'VIP 고객', count: 89, sales: 156000000, percentage: 34.2, avgOrder: 1750000 },
      { segment: '일반 고객', count: 456, sales: 234000000, percentage: 51.2, avgOrder: 513000 },
      { segment: '신규 고객', count: 347, sales: 66700000, percentage: 14.6, avgOrder: 192000 }
    ],
    performanceMetrics: [
      { metric: '총 매출', value: '₩456,700,000', target: '₩400,000,000', percentage: 114.2 },
      { metric: '평균 주문액', value: '₩370,000', target: '₩350,000', percentage: 105.7 },
      { metric: '고객 수', value: '892명', target: '800명', percentage: 111.5 },
      { metric: '재구매율', value: '78.5%', target: '75.0%', percentage: 104.7 }
    ]
  };

  const views = [
    { id: 'overview', title: '개요', icon: Activity },
    { id: 'monthlySales', title: '월별 매출', icon: BarChart3 },
    { id: 'categorySales', title: '카테고리별', icon: PieChart },
    { id: 'customerAnalysis', title: '고객 분석', icon: Users },
    { id: 'performanceMetrics', title: '성과 지표', icon: TrendingUp }
  ];

  const renderOverview = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">매출 분석 개요</h3>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <DollarSign size={32} color="#dc3545" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#dc3545' }}>₩{salesData.overview.totalSales.toLocaleString()}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>총 매출</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <ShoppingCart size={32} color="#007bff" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#007bff' }}>{salesData.overview.totalOrders}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>총 주문</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <TrendingUp size={32} color="#28a745" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#28a745' }}>₩{salesData.overview.averageOrderValue.toLocaleString()}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>평균 주문액</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Users size={32} color="#ffc107" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#ffc107' }}>{salesData.overview.totalCustomers}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>총 고객</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonthlySales = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">월별 매출 트렌드</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {salesData.monthlySales.map((month, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < salesData.monthlySales.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{month.month}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                주문: {month.orders}건 | 고객: {month.customers}명
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#dc3545' }}>
                ₩{month.sales.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: month.growth >= 0 ? '#28a745' : '#dc3545' }}>
                {month.growth >= 0 ? '+' : ''}{month.growth}% 성장
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategorySales = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">카테고리별 매출 현황</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {salesData.categorySales.map((cat, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < salesData.categorySales.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{cat.category}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                주문: {cat.orders}건 | 평균: ₩{cat.avgOrder.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#dc3545' }}>
                ₩{cat.sales.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {cat.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomerAnalysis = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">고객 세그먼트 분석</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {salesData.customerAnalysis.map((segment, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < salesData.customerAnalysis.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{segment.segment}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {segment.count}명 | 평균: ₩{segment.avgOrder.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#dc3545' }}>
                ₩{segment.sales.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {segment.percentage}%
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
        {salesData.performanceMetrics.map((metric, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < salesData.performanceMetrics.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{metric.metric}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#dc3545' }}>
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
      case 'monthlySales':
        return renderMonthlySales();
      case 'categorySales':
        return renderCategorySales();
      case 'customerAnalysis':
        return renderCustomerAnalysis();
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
            <h2 className="card-title" style={{ margin: 0 }}>매출 분석 상세 통계</h2>
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
            월별 매출 리포트
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

export default SalesStatistics;
