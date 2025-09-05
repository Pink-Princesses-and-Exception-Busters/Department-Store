import React, { useState } from 'react';
import { 
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Download,
  ArrowLeft,
  PieChart,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductStatistics = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  // 상세 상품 승인 통계 데이터 (mock data)
  const productData = {
    overview: {
      pendingApproval: 23,
      approved: 156,
      rejected: 8,
      averageProcessingTime: 2.3,
      approvalRate: 83.4
    },
    approvalDetails: [
      { status: '승인 완료', count: 156, percentage: 83.4, avgTime: 2.1 },
      { status: '승인 대기', count: 23, percentage: 12.3, avgTime: 0 },
      { status: '반려', count: 8, percentage: 4.3, avgTime: 1.8 }
    ],
    categoryApproval: [
      { category: '전자제품', approved: 45, pending: 5, rejected: 2, rate: 86.5 },
      { category: '패션의류', approved: 38, pending: 8, rejected: 3, rate: 77.6 },
      { category: '화장품', approved: 25, pending: 4, rejected: 1, rate: 83.3 },
      { category: '식품', approved: 22, pending: 3, rejected: 1, rate: 84.6 },
      { category: '가구', approved: 15, pending: 2, rejected: 1, rate: 83.3 },
      { category: '기타', approved: 11, pending: 1, rejected: 0, rate: 91.7 }
    ],
    monthlyTrends: [
      { month: '1월', submitted: 45, approved: 38, rejected: 3, avgTime: 2.5 },
      { month: '2월', submitted: 52, approved: 45, rejected: 4, avgTime: 2.3 },
      { month: '3월', submitted: 38, approved: 32, rejected: 2, avgTime: 2.8 },
      { month: '4월', submitted: 67, approved: 58, rejected: 5, avgTime: 2.1 },
      { month: '5월', submitted: 58, approved: 49, rejected: 4, avgTime: 2.2 },
      { month: '6월', submitted: 62, approved: 53, rejected: 3, avgTime: 2.0 }
    ],
    rejectionReasons: [
      { reason: '품질 기준 미달', count: 15, percentage: 37.5 },
      { reason: '서류 불완전', count: 12, percentage: 30.0 },
      { reason: '가격 정책 위반', count: 8, percentage: 20.0 },
      { reason: '브랜드 정책 위반', count: 3, percentage: 7.5 },
      { reason: '기타', count: 2, percentage: 5.0 }
    ],
    processingTime: [
      { time: '1일 이내', count: 45, percentage: 24.1 },
      { time: '1-2일', count: 78, percentage: 41.7 },
      { time: '2-3일', count: 34, percentage: 18.2 },
      { time: '3-5일', count: 20, percentage: 10.7 },
      { time: '5일 이상', count: 10, percentage: 5.3 }
    ]
  };

  const views = [
    { id: 'overview', title: '개요', icon: Package },
    { id: 'approvalDetails', title: '승인 현황', icon: CheckCircle },
    { id: 'categoryApproval', title: '카테고리별', icon: PieChart },
    { id: 'monthlyTrends', title: '월별 트렌드', icon: BarChart3 },
    { id: 'rejectionReasons', title: '반려 사유', icon: XCircle },
    { id: 'processingTime', title: '처리 시간', icon: Clock }
  ];

  const renderOverview = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">상품 승인 관리 개요</h3>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Clock size={32} color="#ffc107" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#ffc107' }}>{productData.overview.pendingApproval}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>승인 대기</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <CheckCircle size={32} color="#28a745" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#28a745' }}>{productData.overview.approved}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>승인 완료</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <XCircle size={32} color="#dc3545" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#dc3545' }}>{productData.overview.rejected}</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>반려</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <BarChart3 size={32} color="#007bff" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#007bff' }}>{productData.overview.approvalRate}%</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>승인율</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApprovalDetails = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">승인 현황 상세</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {productData.approvalDetails.map((status, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < productData.approvalDetails.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: status.status === '승인 완료' ? '#28a745' : 
                               status.status === '승인 대기' ? '#ffc107' : '#dc3545'
              }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{status.status}</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  평균 처리시간: {status.avgTime}일
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                {status.count}건
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {status.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoryApproval = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">카테고리별 승인 현황</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {productData.categoryApproval.map((cat, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < productData.categoryApproval.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{cat.category}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                승인율: {cat.rate}%
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#28a745' }}>승인: {cat.approved}</span>
              <span style={{ fontSize: '0.875rem', color: '#ffc107' }}>대기: {cat.pending}</span>
              <span style={{ fontSize: '0.875rem', color: '#dc3545' }}>반려: {cat.rejected}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthlyTrends = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">월별 승인 트렌드</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {productData.monthlyTrends.map((month, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < productData.monthlyTrends.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{month.month}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                제출: {month.submitted}건
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                승인: {month.approved}건
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                반려: {month.rejected}건 | 평균: {month.avgTime}일
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRejectionReasons = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">반려 사유 분석</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {productData.rejectionReasons.map((reason, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < productData.rejectionReasons.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{reason.reason}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#dc3545' }}>
                {reason.count}건
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {reason.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProcessingTime = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">처리 시간 분포</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {productData.processingTime.map((time, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < productData.processingTime.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{time.time}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#007bff' }}>
                {time.count}건
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {time.percentage}%
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
      case 'approvalDetails':
        return renderApprovalDetails();
      case 'categoryApproval':
        return renderCategoryApproval();
      case 'monthlyTrends':
        return renderMonthlyTrends();
      case 'rejectionReasons':
        return renderRejectionReasons();
      case 'processingTime':
        return renderProcessingTime();
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
            <h2 className="card-title" style={{ margin: 0 }}>상품 승인 관리 상세 통계</h2>
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
            <CheckCircle size={16} />
            승인 현황 리포트
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

export default ProductStatistics;
