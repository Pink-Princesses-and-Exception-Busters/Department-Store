// 결제 및 정산 관련 유틸리티 함수들

// 수수료 계산
export const calculateCommission = (amount, paymentMethod, paymentProvider) => {
  const baseRate = 0.025; // 기본 수수료율 2.5%
  let commission = amount * baseRate;
  
  // 결제 수단별 추가 수수료
  switch (paymentMethod) {
    case '신용카드':
      commission += amount * 0.01; // 추가 1%
      break;
    case '카카오페이':
      commission += amount * 0.005; // 추가 0.5%
      break;
    case '네이버페이':
      commission += amount * 0.008; // 추가 0.8%
      break;
    default:
      break;
  }
  
  // 결제사별 추가 수수료
  switch (paymentProvider) {
    case '토스페이먼츠':
      commission += 100; // 고정 수수료 100원
      break;
    case '카카오페이':
      commission += 50; // 고정 수수료 50원
      break;
    default:
      break;
  }
  
  return Math.round(commission);
};

// 정산일 계산
export const calculateSettlementDate = (orderDate, paymentMethod, paymentProvider) => {
  const order = new Date(orderDate);
  let daysToAdd = 7; // 기본 7일 후 정산
  
  // 결제 수단별 정산일 조정
  switch (paymentMethod) {
    case '신용카드':
      daysToAdd = 3; // 3일 후 정산
      break;
    case '카카오페이':
      daysToAdd = 1; // 1일 후 정산
      break;
    case '네이버페이':
      daysToAdd = 2; // 2일 후 정산
      break;
    default:
      break;
  }
  
  const settlementDate = new Date(order);
  settlementDate.setDate(order.getDate() + daysToAdd);
  
  return settlementDate.toISOString().split('T')[0];
};

// 정산 상태 가져오기
export const getSettlementStatus = (orderDate, paymentMethod, paymentProvider) => {
  const today = new Date();
  const settlementDate = new Date(calculateSettlementDate(orderDate, paymentMethod, paymentProvider));
  
  if (today > settlementDate) {
    return 'completed';
  } else if (today.getTime() === settlementDate.getTime()) {
    return 'processing';
  } else {
    return 'scheduled';
  }
};

// 정산 데이터 검증
export const validateSettlementData = (data) => {
  const errors = [];
  
  if (!data.amount || data.amount <= 0) {
    errors.push('주문금액은 0보다 커야 합니다.');
  }
  
  if (!data.paymentMethod) {
    errors.push('결제수단을 선택해주세요.');
  }
  
  if (!data.paymentProvider) {
    errors.push('결제사를 선택해주세요.');
  }
  
  return errors;
};

// 정산 데이터 포맷팅
export const formatSettlementData = (settlement) => {
  return {
    ...settlement,
    commission: calculateCommission(settlement.amount, settlement.paymentMethod, settlement.paymentProvider),
    netAmount: settlement.amount - calculateCommission(settlement.amount, settlement.paymentMethod, settlement.paymentProvider),
    settlementDate: calculateSettlementDate(settlement.orderDate, settlement.paymentMethod, settlement.paymentProvider),
    status: getSettlementStatus(settlement.orderDate, settlement.paymentMethod, settlement.paymentProvider)
  };
};

// 상태 텍스트 가져오기
export const getStatusText = (status) => {
  const statusMap = {
    'completed': '정산완료',
    'processing': '정산처리중',
    'scheduled': '정산예정',
    'pending': '정산대기'
  };
  return statusMap[status] || '알 수 없음';
};

// 정산 요약 계산
export const calculateSettlementSummary = (settlements) => {
  const summary = {
    total: 0,
    totalCommission: 0,
    pendingAmount: 0,
    statusCounts: {
      completed: 0,
      processing: 0,
      scheduled: 0,
      pending: 0
    }
  };
  
  settlements.forEach(settlement => {
    summary.total += settlement.amount;
    summary.totalCommission += settlement.commission;
    
    if (settlement.status === 'pending') {
      summary.pendingAmount += settlement.netAmount;
    }
    
    summary.statusCounts[settlement.status] = (summary.statusCounts[settlement.status] || 0) + 1;
  });
  
  return summary;
};

// CSV 내보내기용 데이터 포맷팅
export const formatSettlementsForCSV = (settlements) => {
  const headers = ['정산ID', '주문ID', '고객명', '주문금액', '수수료', '정산금액', '결제수단', '주문일', '정산일', '상태'];
  
  const rows = settlements.map(settlement => [
    settlement.id,
    settlement.orderId,
    settlement.customerName,
    settlement.amount,
    settlement.commission,
    settlement.netAmount,
    settlement.paymentMethod,
    settlement.orderDate,
    settlement.settlementDate,
    getStatusText(settlement.status)
  ]);
  
  return [headers, ...rows];
};

const paymentUtils = {
  calculateCommission,
  calculateSettlementDate,
  getSettlementStatus,
  validateSettlementData,
  formatSettlementData,
  getStatusText,
  calculateSettlementSummary,
  formatSettlementsForCSV
};

export default paymentUtils;
