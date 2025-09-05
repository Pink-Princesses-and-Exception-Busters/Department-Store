import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar,
  BarChart3,
  Download,
  FileText
} from 'lucide-react';
import Modal from '../../shared/components/Modal';

const StatisticsMerchant = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');

  // 샘플 통계 데이터
  const salesData = {
    week: [
      { date: '01/08', sales: 1200000, orders: 45 },
      { date: '01/09', sales: 1500000, orders: 52 },
      { date: '01/10', sales: 980000, orders: 38 },
      { date: '01/11', sales: 1800000, orders: 67 },
      { date: '01/12', sales: 2100000, orders: 78 },
      { date: '01/13', sales: 1650000, orders: 61 },
      { date: '01/14', sales: 1900000, orders: 72 }
    ],
    month: [
      { date: '12월', sales: 45000000, orders: 1250 },
      { date: '1월', sales: 52000000, orders: 1420 }
    ]
  };

  const topProducts = [
    { name: '스마트폰 케이스', sales: 156, revenue: 3900000, growth: 12 },
    { name: '무선 이어폰', sales: 89, revenue: 7921000, growth: -5 },
    { name: '노트북 스탠드', sales: 67, revenue: 3015000, growth: 8 },
    { name: '블루투스 스피커', sales: 45, revenue: 5400000, growth: 15 },
    { name: '휴대폰 충전기', sales: 234, revenue: 3510000, growth: 3 }
  ];

  const customerStats = [
    { metric: '신규 고객', value: 45, change: 12, period: '이번 주' },
    { metric: '재구매 고객', value: 123, change: -3, period: '이번 주' },
    { metric: '고객 유지율', value: '78%', change: 5, period: '이번 달' },
    { metric: '평균 주문액', value: '₩85,000', change: 8, period: '이번 달' }
  ];

  const overallStats = [
    {
      title: '총 매출',
      value: '₩12,450,000',
      change: '+15.3%',
      icon: DollarSign,
      color: '#28a745',
      isPositive: true
    },
    {
      title: '총 주문',
      value: '456',
      change: '+8.7%',
      icon: ShoppingCart,
      color: '#007bff',
      isPositive: true
    },
    {
      title: '신규 고객',
      value: '89',
      change: '+12.1%',
      icon: Users,
      color: '#ffc107',
      isPositive: true
    },
    {
      title: '상품 판매',
      value: '1,234',
      change: '-2.3%',
      icon: Package,
      color: '#dc3545',
      isPositive: false
    }
  ];

  const currentData = salesData[selectedPeriod];
  const totalSales = currentData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = currentData.reduce((sum, item) => sum + item.orders, 0);

  // 리포트 생성 함수들
  const handleGenerateReport = (type) => {
    setReportType(type);
    setShowReportModal(true);
  };

  const handleDownloadReport = () => {
    let reportData = '';
    const currentDate = new Date().toISOString().split('T')[0];
    
    switch (reportType) {
      case 'sales':
        reportData = [
          ['날짜', '매출', '주문수'].join(','),
          ...currentData.map(item => [item.date, item.sales, item.orders].join(','))
        ].join('\n');
        break;
      case 'products':
        reportData = [
          ['상품명', '판매량', '매출', '성장률'].join(','),
          ...topProducts.map(product => [
            product.name, 
            product.sales, 
            product.revenue, 
            `${product.growth}%`
          ].join(','))
        ].join('\n');
        break;
      case 'customers':
        reportData = [
          ['지표', '값', '변화율', '기간'].join(','),
          ...customerStats.map(stat => [
            stat.metric, 
            stat.value, 
            `${stat.change}%`, 
            stat.period
          ].join(','))
        ].join('\n');
        break;
      case 'monthly':
        reportData = [
          ['구분', '값'].join(','),
          ['총 매출', totalSales],
          ['총 주문', totalOrders],
          ['평균 주문액', Math.round(totalSales / totalOrders)],
          ...overallStats.map(stat => [stat.title, stat.value].join(','))
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
          <h2 className="card-title">통계 분석</h2>
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

      {/* 전체 통계 */}
      <div className="stats-grid">
        {overallStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div 
                className="stat-icon" 
                style={{ backgroundColor: stat.color }}
              >
                <Icon size={24} />
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
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* 매출 차트 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {selectedPeriod === 'week' ? '주간' : '월간'} 매출 현황
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              총 매출: ₩{totalSales.toLocaleString()} | 총 주문: {totalOrders}건
            </div>
          </div>
          
          {/* 간단한 차트 시뮬레이션 */}
          <div style={{ padding: '1rem 0' }}>
            {currentData.map((item, index) => {
              const maxSales = Math.max(...currentData.map(d => d.sales));
              const height = (item.sales / maxSales) * 200;
              
              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'end', 
                  marginBottom: '1rem',
                  gap: '1rem'
                }}>
                  <div style={{ width: '60px', fontSize: '0.875rem', color: '#666' }}>
                    {item.date}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'end', gap: '0.5rem' }}>
                    <div 
                      style={{
                        height: `${Math.max(height / 10, 20)}px`,
                        backgroundColor: '#007bff',
                        borderRadius: '4px',
                        minWidth: '40px',
                        position: 'relative'
                      }}
                    />
                    <div style={{ fontSize: '0.875rem' }}>
                      ₩{item.sales.toLocaleString()} ({item.orders}건)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 인기 상품 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">인기 상품 TOP 5</h3>
          </div>
          
          <div>
            {topProducts.map((product, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < topProducts.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ 
                      background: '#007bff', 
                      color: 'white', 
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </span>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {product.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginLeft: '1.5rem' }}>
                    판매: {product.sales}개 | ₩{product.revenue.toLocaleString()}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '0.75rem',
                  color: product.growth > 0 ? '#28a745' : '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {product.growth > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(product.growth)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 고객 통계 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">고객 분석</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {customerStats.map((stat, index) => (
            <div key={index} style={{ 
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#333',
                marginBottom: '0.5rem'
              }}>
                {stat.value}
              </h4>
              <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                {stat.metric}
              </p>
              <small style={{ 
                color: stat.change > 0 ? '#28a745' : '#dc3545',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                {stat.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stat.change)}% ({stat.period})
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 리포트 */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">리포트 생성</h3>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => handleGenerateReport('sales')}
          >
            <BarChart3 size={16} />
            매출 리포트
          </button>
          <button 
            className="btn btn-success"
            onClick={() => handleGenerateReport('products')}
          >
            <Package size={16} />
            상품 분석
          </button>
          <button 
            className="btn btn-warning"
            onClick={() => handleGenerateReport('customers')}
          >
            <Users size={16} />
            고객 분석
          </button>
          <button 
            className="btn" 
            style={{ background: '#6f42c1', color: 'white' }}
            onClick={() => handleGenerateReport('monthly')}
          >
            <Calendar size={16} />
            월간 리포트
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
            <FileText size={48} color="#007bff" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
              {reportType === 'sales' && '매출 리포트'}
              {reportType === 'products' && '상품 분석 리포트'}
              {reportType === 'customers' && '고객 분석 리포트'}
              {reportType === 'monthly' && '월간 종합 리포트'}
            </h3>
            <p style={{ color: '#666', margin: 0 }}>
              {reportType === 'sales' && `${selectedPeriod === 'week' ? '주간' : '월간'} 매출 데이터를 CSV 파일로 다운로드합니다.`}
              {reportType === 'products' && '인기 상품 TOP 5 데이터를 CSV 파일로 다운로드합니다.'}
              {reportType === 'customers' && '고객 분석 통계를 CSV 파일로 다운로드합니다.'}
              {reportType === 'monthly' && '월간 종합 통계를 CSV 파일로 다운로드합니다.'}
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
              {reportType === 'sales' && (
                <>
                  <li>날짜별 매출 현황</li>
                  <li>주문 건수</li>
                  <li>총 매출 및 주문 통계</li>
                </>
              )}
              {reportType === 'products' && (
                <>
                  <li>상품별 판매량</li>
                  <li>매출 현황</li>
                  <li>성장률 분석</li>
                </>
              )}
              {reportType === 'customers' && (
                <>
                  <li>신규/재구매 고객 수</li>
                  <li>고객 유지율</li>
                  <li>평균 주문액</li>
                </>
              )}
              {reportType === 'monthly' && (
                <>
                  <li>전체 매출 통계</li>
                  <li>주문 및 고객 현황</li>
                  <li>주요 지표 요약</li>
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

export default StatisticsMerchant;