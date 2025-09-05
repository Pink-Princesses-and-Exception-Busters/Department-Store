import React, { useState } from 'react';
import { 
  Activity,
  TrendingUp,
  BarChart3,
  Download,
  ArrowLeft,
  PieChart,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OperationsStatistics = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  // 상세 운영 효율성 통계 데이터 (mock data)
  const operationsData = {
    overview: {
      systemUptime: 99.8,
      averageProcessingTime: 2.1,
      taskCompletionRate: 96.5,
      errorRate: 0.3,
      efficiencyScore: 94.2
    },
    systemUsage: [
      { system: '입점사 관리', usage: 85, efficiency: 92, uptime: 99.9, errors: 2 },
      { system: '상품 승인', usage: 78, efficiency: 88, uptime: 99.7, errors: 5 },
      { system: '고객 서비스', usage: 92, efficiency: 95, uptime: 99.8, errors: 3 },
      { system: '매출 분석', usage: 65, efficiency: 89, uptime: 99.5, errors: 8 },
      { system: '정산 관리', usage: 88, efficiency: 91, uptime: 99.6, errors: 4 }
    ],
    performanceMetrics: [
      { metric: '업무 처리량', current: 156, target: 150, percentage: 104, trend: '+4%' },
      { metric: '응답 시간', current: 2.1, target: 2.5, percentage: 119, trend: '-19%' },
      { metric: '정확도', current: 98.5, target: 95, percentage: 103.7, trend: '+3.7%' },
      { metric: '고객 만족도', current: 4.2, target: 4.0, percentage: 105, trend: '+5%' }
    ],
    monthlyTrends: [
      { month: '1월', uptime: 99.5, efficiency: 91.2, errors: 12, completion: 94.2 },
      { month: '2월', uptime: 99.7, efficiency: 92.8, errors: 8, completion: 95.1 },
      { month: '3월', uptime: 99.6, efficiency: 91.9, errors: 10, completion: 94.8 },
      { month: '4월', uptime: 99.8, efficiency: 93.5, errors: 6, completion: 95.8 },
      { month: '5월', uptime: 99.9, efficiency: 94.1, errors: 4, completion: 96.2 },
      { month: '6월', uptime: 99.8, efficiency: 94.2, errors: 5, completion: 96.5 }
    ],
    errorAnalysis: [
      { type: '시스템 오류', count: 15, percentage: 37.5, severity: 'High', resolution: 2.3 },
      { type: '네트워크 지연', count: 12, percentage: 30.0, severity: 'Medium', resolution: 1.8 },
      { type: '데이터 불일치', count: 8, percentage: 20.0, severity: 'Medium', resolution: 3.2 },
      { type: '권한 오류', count: 3, percentage: 7.5, severity: 'Low', resolution: 0.5 },
      { type: '기타', count: 2, percentage: 5.0, severity: 'Low', resolution: 1.2 }
    ],
    efficiencyTrends: [
      { period: '1주차', efficiency: 91.2, uptime: 99.5, completion: 94.2 },
      { period: '2주차', efficiency: 92.1, uptime: 99.6, completion: 94.8 },
      { period: '3주차', efficiency: 93.5, uptime: 99.7, completion: 95.3 },
      { period: '4주차', efficiency: 94.2, uptime: 99.8, completion: 96.5 }
    ]
  };

  const views = [
    { id: 'overview', title: '개요', icon: Activity },
    { id: 'systemUsage', title: '시스템별', icon: BarChart3 },
    { id: 'performanceMetrics', title: '성과 지표', icon: Target },
    { id: 'monthlyTrends', title: '월별 트렌드', icon: TrendingUp },
    { id: 'errorAnalysis', title: '오류 분석', icon: AlertTriangle },
    { id: 'efficiencyTrends', title: '효율성 트렌드', icon: CheckCircle }
  ];

  const renderOverview = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">운영 효율성 개요</h3>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Activity size={32} color="#6f42c1" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#6f42c1' }}>{operationsData.overview.systemUptime}%</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>시스템 가동률</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <Clock size={32} color="#007bff" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#007bff' }}>{operationsData.overview.averageProcessingTime}시간</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>평균 처리시간</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <CheckCircle size={32} color="#28a745" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#28a745' }}>{operationsData.overview.taskCompletionRate}%</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>업무 완료율</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <AlertTriangle size={32} color="#dc3545" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0', color: '#dc3545' }}>{operationsData.overview.errorRate}%</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>오류 발생률</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemUsage = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">시스템별 사용률 및 효율성</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {operationsData.systemUsage.map((system, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < operationsData.systemUsage.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{system.system}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                가동률: {system.uptime}% | 오류: {system.errors}건
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#6f42c1' }}>
                사용률: {system.usage}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                효율성: {system.efficiency}%
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
        {operationsData.performanceMetrics.map((metric, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < operationsData.performanceMetrics.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{metric.metric}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                목표: {metric.target} | 달성률: {metric.percentage}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#6f42c1' }}>
                {metric.current}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#28a745' }}>
                {metric.trend}
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
        <h3 className="card-title">월별 운영 트렌드</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {operationsData.monthlyTrends.map((month, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < operationsData.monthlyTrends.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{month.month}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                오류: {month.errors}건 | 완료율: {month.completion}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#6f42c1' }}>
                가동률: {month.uptime}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                효율성: {month.efficiency}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderErrorAnalysis = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">오류 분석</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {operationsData.errorAnalysis.map((error, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < operationsData.errorAnalysis.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{error.type}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                심각도: {error.severity} | 해결시간: {error.resolution}시간
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#dc3545' }}>
                {error.count}건
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {error.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEfficiencyTrends = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">효율성 트렌드</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        {operationsData.efficiencyTrends.map((period, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: index < operationsData.efficiencyTrends.length - 1 ? '1px solid #eee' : 'none'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{period.period}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                완료율: {period.completion}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#6f42c1' }}>
                효율성: {period.efficiency}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                가동률: {period.uptime}%
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
      case 'systemUsage':
        return renderSystemUsage();
      case 'performanceMetrics':
        return renderPerformanceMetrics();
      case 'monthlyTrends':
        return renderMonthlyTrends();
      case 'errorAnalysis':
        return renderErrorAnalysis();
      case 'efficiencyTrends':
        return renderEfficiencyTrends();
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
            <h2 className="card-title" style={{ margin: 0 }}>운영 효율성 상세 통계</h2>
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
            <Activity size={16} />
            시스템별 분석
          </button>
          <button className="btn btn-warning">
            <AlertTriangle size={16} />
            오류 분석 리포트
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationsStatistics;
