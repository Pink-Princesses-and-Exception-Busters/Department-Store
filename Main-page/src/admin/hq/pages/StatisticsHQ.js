import React, { useState, useEffect } from 'react';
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
  PieChart,
  RefreshCw,
  Loader,
  X,
  XCircle
} from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';

// CSS 스타일 추가
const tenantCardStyles = `
  .tenant-card {
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease !important;
  }
  
  .tenant-card:hover {
    background-color: #e0f2fe !important;
    border-color: #3b82f6 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
  }
  
  .tenant-card:hover > div {
    background-color: #e0f2fe !important;
    transition: none !important;
  }
  
  .tenant-card > div {
    transition: none !important;
  }
`;

// 스타일을 DOM에 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = tenantCardStyles;
  document.head.appendChild(styleElement);
}


const StatisticsHQ = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('tenants');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailModalType, setDetailModalType] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [showTenantDetailModal, setShowTenantDetailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDetailLoading, setTenantDetailLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalData, setCategoryModalData] = useState(null);
  const [categoryModalLoading, setCategoryModalLoading] = useState(false);
  const [selectedCategoryTenants, setSelectedCategoryTenants] = useState(null);
  const [showSalesCategoryModal, setShowSalesCategoryModal] = useState(false);
  const [salesCategoryModalData, setSalesCategoryModalData] = useState(null);
  const [salesCategoryModalLoading, setSalesCategoryModalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // 실시간 통계 데이터
  const [realTimeStats, setRealTimeStats] = useState({
    totalTenants: 0,
    newTenantsMonth: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    soldoutProducts: 0,
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    monthlySales: 0
  });

  // 2단계: 카테고리별 상세 데이터
  const [detailData, setDetailData] = useState({
    topBrands: [],
    categoryDistribution: [],
    approvalStatus: [],
    categorySales: []
  });

  // 3단계: 고급 분석 데이터
  const [advancedData, setAdvancedData] = useState({
    monthlyTrends: [],
    systemMetrics: {},
    performanceIndicators: []
  });

  // 데이터 로드
  useEffect(() => {
    loadStatisticsData();
  }, [selectedPeriod]);

  // 통계 데이터 로드
  const loadStatisticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1-3단계: 모든 통계 데이터를 병렬로 로드
      const [basicStats, topBrands, categoryDist, approvalStats, monthlyTrends, systemMetrics, categorySales] = await Promise.all([
        getBasicStatistics(),
        getTopBrands(),
        getCategoryDistribution(),
        getApprovalStatus(),
        getMonthlyTrends(),
        getSystemMetrics(),
        getCategorySalesDistribution()
      ]);

      setRealTimeStats(basicStats);
      setDetailData({
        topBrands,
        categoryDistribution: categoryDist,
        approvalStatus: approvalStats,
        categorySales
      });

      // 3단계: 고급 분석 데이터 설정
      const performanceIndicators = await getPerformanceIndicators();
      setAdvancedData({
        monthlyTrends,
        systemMetrics,
        performanceIndicators
      });

      console.log('통계 데이터 로드 완료 - 기본:', basicStats, '상세:', { topBrands, categoryDist, approvalStats }, '고급:', { monthlyTrends, systemMetrics, performanceIndicators });
    } catch (err) {
      console.error('통계 데이터 로드 오류:', err);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기본 통계 조회
  const getBasicStatistics = async () => {
    const [tenantsData, productsData, ordersData, salesData] = await Promise.all([
      // 입점사 통계
      supabase.from('brand_admins').select('id, joined_at').eq('status', 'active'),
      // 상품 통계
      supabase.from('products').select('id, status'),
      // 주문 통계
      supabase.from('orders').select('id, user_id, total_amount, created_at'),
      // 월간 매출
      supabase.from('orders')
        .select('total_amount')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    // 신규 입점사 계산 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newTenants = tenantsData.data?.filter(tenant => 
      new Date(tenant.joined_at) >= thirtyDaysAgo
    ).length || 0;

    // 상품별 통계 계산
    const productStats = productsData.data?.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // 고유 고객 수 계산
    const uniqueCustomers = new Set(ordersData.data?.map(order => order.user_id) || []).size;

    // 총 매출 계산
    const totalRevenue = ordersData.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const monthlyRevenue = salesData.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    return {
      totalTenants: tenantsData.data?.length || 0,
      newTenantsMonth: newTenants,
      pendingProducts: productStats.hidden || 0,
      approvedProducts: productStats.forsale || 0,
      soldoutProducts: productStats.soldout || 0,
      totalSales: totalRevenue,
      totalOrders: ordersData.data?.length || 0,
      totalCustomers: uniqueCustomers,
      monthlySales: monthlyRevenue
    };
  };

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatisticsData();
    setRefreshing(false);
  };

  // 브랜드별 매출 순위 조회
  const getTopBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('items');

      if (error) throw error;

      // 브랜드별 매출 계산
      const brandStats = {};
      data?.forEach(order => {
        order.items?.forEach(item => {
          const brand = item.brand;
          const revenue = item.price * item.quantity;
          if (!brandStats[brand]) {
            brandStats[brand] = { sales: 0, products: 0, orders: 0 };
          }
          brandStats[brand].sales += revenue;
          brandStats[brand].orders += 1;
        });
      });

      // 상위 5개 브랜드 정렬
      const topBrands = Object.entries(brandStats)
        .sort(([,a], [,b]) => b.sales - a.sales)
        .slice(0, 5)
        .map(([brand, stats]) => ({
          name: brand,
          sales: stats.sales,
          products: 0, // 별도 조회 필요
          satisfaction: 4.5 // 임시값
        }));

      return topBrands;
    } catch (err) {
      console.error('브랜드 매출 조회 오류:', err);
      return [];
    }
  };

  // 카테고리별 매출 모달 데이터 로드
  const loadSalesCategoryModalData = async () => {
    setSalesCategoryModalLoading(true);
    try {
      const salesData = await getCategorySalesDistribution();
      setSalesCategoryModalData(salesData);
    } catch (err) {
      console.error('카테고리별 매출 모달 데이터 로드 오류:', err);
    } finally {
      setSalesCategoryModalLoading(false);
    }
  };

  // 카테고리별 매출 분포 조회 (간단한 방법)
  const getCategorySalesDistribution = async () => {
    try {
      // 1. 모든 주문 조회 (유효한 상태만)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('items')
        .in('status', ['배송완료', '결제완료', '상품준비', '배송중']);

      if (ordersError) throw ordersError;

      // 2. 모든 상품과 카테고리 정보 조회
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          categories (name)
        `);

      if (productsError) throw productsError;

      // 3. 상품 ID로 카테고리 매핑 생성
      const productCategoryMap = {};
      products?.forEach(product => {
        if (product.categories && product.categories.name) {
          productCategoryMap[product.id] = product.categories.name;
        }
      });

      // 4. 카테고리별 매출 계산
      const categorySales = {};
      
      orders?.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const category = productCategoryMap[item.product_id];
            if (category) {
              const sales = item.price * item.quantity;
              categorySales[category] = (categorySales[category] || 0) + sales;
            }
          });
        }
      });

      // 5. 분포 데이터 생성
      const distribution = Object.entries(categorySales)
        .map(([category, sales]) => ({
          category,
          sales,
          percentage: 0
        }))
        .sort((a, b) => b.sales - a.sales);

      // 6. 전체 매출 대비 비율 계산
      const totalSales = distribution.reduce((sum, cat) => sum + cat.sales, 0);
      distribution.forEach(cat => {
        cat.percentage = totalSales > 0 ? ((cat.sales / totalSales) * 100).toFixed(1) : 0;
      });

      return distribution;
    } catch (err) {
      console.error('카테고리별 매출 분포 조회 오류:', err);
      return [];
    }
  };

  // 카테고리별 입점사 분포 모달 데이터 로드
  const loadCategoryModalData = async () => {
    setCategoryModalLoading(true);
    try {
      const distribution = await getCategoryDistribution();
      setCategoryModalData(distribution);
    } catch (err) {
      console.error('카테고리 모달 데이터 로드 오류:', err);
    } finally {
      setCategoryModalLoading(false);
    }
  };

  // 특정 카테고리의 입점사 목록 조회 (최적화된 버전)
  const getTenantsByCategory = async (categoryName) => {
    try {
      // 1. 해당 카테고리의 상품들을 가진 브랜드들 조회
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          brand,
          categories (name)
        `)
        .not('brand', 'is', null);

      if (productsError) throw productsError;

      // 2. 브랜드별 카테고리 분포 계산
      const brandCategories = {};
      
      products?.forEach(product => {
        if (product.brand && product.categories && product.categories.name) {
          const brand = product.brand;
          const category = product.categories.name;
          
          if (!brandCategories[brand]) {
            brandCategories[brand] = {};
          }
          
          brandCategories[brand][category] = (brandCategories[brand][category] || 0) + 1;
        }
      });

      // 3. 해당 카테고리가 주요 카테고리인 브랜드들 필터링
      const targetBrands = Object.entries(brandCategories)
        .filter(([brand, categories]) => {
          const mainCategory = Object.keys(categories).reduce((a, b) => 
            categories[a] > categories[b] ? a : b
          );
          return mainCategory === categoryName;
        })
        .map(([brand, categories]) => ({
          brand,
          totalProducts: Object.values(categories).reduce((sum, count) => sum + count, 0),
          categoryProducts: categories[categoryName] || 0
        }));

      // 4. 브랜드 정보 조회
      if (targetBrands.length === 0) return [];

      const brandNames = targetBrands.map(b => b.brand);
      const { data: tenants, error: tenantsError } = await supabase
        .from('brand_admins')
        .select('id, name, email, grade, status')
        .in('name', brandNames)
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      // 5. 데이터 결합
      const categoryTenants = tenants?.map(tenant => {
        const brandData = targetBrands.find(b => b.brand === tenant.name);
        return {
          ...tenant,
          productCount: brandData?.totalProducts || 0,
          categoryProductCount: brandData?.categoryProducts || 0
        };
      }) || [];

      return categoryTenants;
    } catch (err) {
      console.error('카테고리별 입점사 조회 오류:', err);
      return [];
    }
  };

  // 카테고리별 입점사 분포 조회 (최적화된 버전)
  const getCategoryDistribution = async () => {
    try {
      // 한 번의 쿼리로 모든 상품과 카테고리 정보를 가져오기
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          brand,
          categories (name)
        `)
        .not('brand', 'is', null);

      if (productsError) throw productsError;

      // 브랜드별 카테고리 분포 계산
      const brandCategories = {};
      
      products?.forEach(product => {
        if (product.brand && product.categories && product.categories.name) {
          const brand = product.brand;
          const category = product.categories.name;
          
          if (!brandCategories[brand]) {
            brandCategories[brand] = {};
          }
          
          brandCategories[brand][category] = (brandCategories[brand][category] || 0) + 1;
        }
      });

      // 각 브랜드의 주요 카테고리 결정
      const categoryDistribution = {};
      
      Object.entries(brandCategories).forEach(([brand, categories]) => {
        const mainCategory = Object.keys(categories).reduce((a, b) => 
          categories[a] > categories[b] ? a : b
        );
        
        categoryDistribution[mainCategory] = (categoryDistribution[mainCategory] || 0) + 1;
      });

      // 분포 데이터 생성
      const distribution = Object.entries(categoryDistribution)
        .map(([category, count]) => ({
          category,
          count,
          percentage: 0
        }))
        .sort((a, b) => b.count - a.count);

      // 전체 입점사 수 대비 비율 계산
      const totalTenants = distribution.reduce((sum, cat) => sum + cat.count, 0);
      distribution.forEach(cat => {
        cat.percentage = totalTenants > 0 ? ((cat.count / totalTenants) * 100).toFixed(1) : 0;
      });

      return distribution;
    } catch (err) {
      console.error('카테고리별 입점사 분포 조회 오류:', err);
      return [];
    }
  };

  // 상품 승인 현황 조회
  const getApprovalStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('status');

      if (error) throw error;

      const statusCounts = data?.reduce((acc, product) => {
        const status = product.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

      const approvalStatus = [
        {
          status: '승인 완료',
          count: statusCounts.forsale || 0,
          percentage: total > 0 ? ((statusCounts.forsale || 0) / total * 100).toFixed(1) : 0
        },
        {
          status: '승인 대기',
          count: statusCounts.hidden || 0,
          percentage: total > 0 ? ((statusCounts.hidden || 0) / total * 100).toFixed(1) : 0
        },
        {
          status: '품절',
          count: statusCounts.soldout || 0,
          percentage: total > 0 ? ((statusCounts.soldout || 0) / total * 100).toFixed(1) : 0
        }
      ];

      return approvalStatus;
    } catch (err) {
      console.error('승인 현황 조회 오류:', err);
      return [];
    }
  };

  // 3단계: 월별 매출 트렌드 조회
  const getMonthlyTrends = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, user_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 월별 데이터 집계
      const monthlyData = {};
      data?.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = `${date.getMonth() + 1}월`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            sales: 0,
            orders: 0,
            customers: new Set()
          };
        }
        
        monthlyData[monthKey].sales += order.total_amount || 0;
        monthlyData[monthKey].orders += 1;
        monthlyData[monthKey].customers.add(order.user_id);
      });

      // 최근 6개월 데이터 정렬
      const trends = Object.entries(monthlyData)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6)
        .reverse()
        .map(([key, data]) => ({
          month: data.month,
          sales: data.sales,
          orders: data.orders,
          customers: data.customers.size
        }));

      return trends;
    } catch (err) {
      console.error('월별 트렌드 조회 오류:', err);
      return [];
    }
  };

  // 시스템 성과 지표 조회
  const getSystemMetrics = async () => {
    try {
      const [tenantsData, productsData, ordersData, usersData] = await Promise.all([
        supabase.from('brand_admins').select('id').eq('status', 'active'),
        supabase.from('products').select('id, status'),
        supabase.from('orders').select('id, status'),
        supabase.from('users').select('id')
      ]);

      const totalProducts = productsData.data?.length || 0;
      const approvedProducts = productsData.data?.filter(p => p.status === 'forsale').length || 0;
      const totalOrders = ordersData.data?.length || 0;
      const completedOrders = ordersData.data?.filter(o => o.status === '배송완료').length || 0;

      const metrics = {
        systemUptime: 99.8, // 고정값
        avgProcessingTime: 2.1, // 고정값
        approvalRate: totalProducts > 0 ? ((approvedProducts / totalProducts) * 100).toFixed(1) : 0,
        completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
        errorRate: 0.3, // 고정값
        efficiency: 96.5 // 고정값
      };

      return metrics;
    } catch (err) {
      console.error('시스템 지표 조회 오류:', err);
      return {
        systemUptime: 99.8,
        avgProcessingTime: 2.1,
        approvalRate: 0,
        completionRate: 0,
        errorRate: 0.3,
        efficiency: 96.5
      };
    }
  };

  // 성과 지표 계산
  const getPerformanceIndicators = async () => {
    try {
      const currentStats = realTimeStats;
      
      const indicators = [
        {
          metric: '업무 처리량',
          current: currentStats.totalOrders,
          target: Math.max(15, currentStats.totalOrders),
          percentage: currentStats.totalOrders >= 15 ? 
            ((currentStats.totalOrders / 15) * 100).toFixed(0) : 
            ((currentStats.totalOrders / 15) * 100).toFixed(0)
        },
        {
          metric: '상품 승인률',
          current: currentStats.totalTenants > 0 ? 
            ((currentStats.approvedProducts / (currentStats.approvedProducts + currentStats.pendingProducts + currentStats.soldoutProducts)) * 100).toFixed(1) : 0,
          target: 95,
          percentage: currentStats.totalTenants > 0 ? 
            (((currentStats.approvedProducts / (currentStats.approvedProducts + currentStats.pendingProducts + currentStats.soldoutProducts)) * 100) / 95 * 100).toFixed(0) : 0
        },
        {
          metric: '고객 만족도',
          current: 4.2,
          target: 4.0,
          percentage: ((4.2 / 4.0) * 100).toFixed(0)
        },
        {
          metric: '매출 목표',
          current: Math.round(currentStats.totalSales / 10000),
          target: Math.max(500, Math.round(currentStats.totalSales / 10000)),
          percentage: currentStats.totalSales > 0 ? 
            ((currentStats.totalSales / 10000) / Math.max(500, Math.round(currentStats.totalSales / 10000)) * 100).toFixed(0) : 0
        }
      ];

      return indicators;
    } catch (err) {
      console.error('성과 지표 계산 오류:', err);
      return [];
    }
  };

  // 모달용 상세 데이터 로드 함수
  const loadModalData = async (type) => {
    try {
      setModalLoading(true);
      console.log(`${type} 모달 데이터 로드 시작...`);

      if (type === 'tenants') {
        // 모든 입점사 데이터 조회
        const { data: tenants, error: tenantsError } = await supabase
          .from('brand_admins')
          .select('*')
          .eq('status', 'active')
          .order('joined_at', { ascending: false });

        if (tenantsError) {
          console.error('입점사 데이터 조회 실패:', tenantsError);
          throw tenantsError;
        }

        console.log('입점사 데이터:', tenants?.length || 0, '개');

        // 주문 데이터 조회 (매출 계산용)
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('items, total_amount, order_date, status')
          .in('status', ['배송완료', '결제완료', '상품준비', '배송중']);

        if (ordersError) {
          console.error('주문 데이터 조회 실패:', ordersError);
        }

        console.log('주문 데이터:', orders?.length || 0, '개');

        // 상품 데이터 조회 (상품 수 계산용)
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('brand, status, price, sales')
          .eq('status', 'forsale');

        if (productsError) {
          console.error('상품 데이터 조회 실패:', productsError);
        }

        console.log('상품 데이터:', products?.length || 0, '개');

        // 입점사별 매출 계산 (공통 함수 사용)
        const tenantSales = {};
        const tenantOrderCounts = {};
        if (orders) {
          tenants.forEach(tenant => {
            const { totalSales, orderCount } = calculateBrandSales(orders, tenant.name);
            tenantSales[tenant.name] = totalSales;
            tenantOrderCounts[tenant.name] = orderCount;
          });
        }

        // 입점사별 상품 수 계산
        const tenantProducts = {};
        if (products) {
          products.forEach(product => {
            if (product.brand) {
              tenantProducts[product.brand] = (tenantProducts[product.brand] || 0) + 1;
            }
          });
        }

        // 입점사 데이터 가공
        const processedTenants = tenants.map(tenant => {
          const sales = tenantSales[tenant.name] || 0;
          const productCount = tenantProducts[tenant.name] || 0;
          const orderCount = tenantOrderCounts[tenant.name] || 0;
          const satisfaction = 4.0 + Math.random() * 0.8; // 임시 만족도
          const growth = Math.random() * 30 - 5; // -5% ~ +25% 성장률

          return {
            id: tenant.id,
            name: tenant.name,
            email: tenant.email,
            business_number: tenant.business_number,
            joined_at: tenant.joined_at,
            sales: sales,
            products: productCount,
            orderCount: orderCount,
            satisfaction: satisfaction,
            growth: growth
          };
        }).sort((a, b) => b.sales - a.sales); // 매출 순으로 정렬

        setModalData({
          type: 'tenants',
          data: processedTenants,
          totalCount: processedTenants.length,
          totalSales: processedTenants.reduce((sum, tenant) => sum + tenant.sales, 0)
        });

      } else if (type === 'sales') {
        // 매출 관련 데이터는 기존 mock 데이터 사용
        setModalData({
          type: 'sales',
          data: currentCategory.details
        });
      }

      console.log('모달 데이터 로드 완료:', modalData);
    } catch (error) {
      console.error('모달 데이터 로드 실패:', error);
      setModalData(null);
    } finally {
      setModalLoading(false);
    }
  };

  // 브랜드별 매출 계산 공통 함수
  const calculateBrandSales = (orders, brandName) => {
    let totalSales = 0;
    let orderCount = 0;
    
    // 매출에 포함할 주문 상태들
    const validStatuses = ['배송완료', '결제완료', '상품준비', '배송중'];
    
    if (orders) {
      orders.forEach(order => {
        // 주문 상태가 유효한 경우만 계산
        if (validStatuses.includes(order.status)) {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              if (item.brand === brandName) {
                totalSales += (item.price * item.quantity);
                orderCount += 1;
              }
            });
          }
        }
      });
    }
    
    return { totalSales, orderCount };
  };

  // 입점사 클릭 핸들러
  const handleTenantClick = async (tenant) => {
    setTenantDetailLoading(true);
    try {
      // 실제 DB에서 입점사 정보 조회
      const { data: tenantData, error: tenantError } = await supabase
        .from('brand_admins')
        .select('*')
        .eq('id', tenant.id)
        .single();

      if (tenantError) {
        console.error('입점사 정보 조회 오류:', tenantError);
        alert('입점사 정보를 불러오는 중 오류가 발생했습니다.');
        return;
      }

      // 상품 수 조회
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('brand', tenantData.name);

      if (productsError) {
        console.error('상품 수 조회 오류:', productsError);
      }

      // 주문 데이터 조회 (매출 계산용)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) {
        console.error('주문 데이터 조회 오류:', ordersError);
      }

      // 매출 계산 (공통 함수 사용)
      const { totalSales, orderCount } = calculateBrandSales(orders, tenantData.name);

      // 통합된 입점사 데이터 생성
      const fullTenantData = {
        id: tenantData.id,
        name: tenantData.name,
        companyName: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        businessNumber: tenantData.business_number,
        address: tenantData.address,
        grade: tenantData.grade || 1,
        status: tenantData.status === 'active' ? '승인됨' : 
               tenantData.status === 'suspended' ? '일시정지' : 
               tenantData.status === 'terminated' ? '계약종료' : '승인대기',
        originalStatus: tenantData.status,
        joinDate: new Date(tenantData.joined_at).toLocaleDateString(),
        joined_at: tenantData.joined_at,
        terminatedAt: tenantData.terminated_at,
        logoUrl: tenantData.logo_url,
        commission: tenantData.grade === 1 ? 5.0 : tenantData.grade === 2 ? 4.0 : 3.0,
        productCount: products ? products.length : 0,
        products: products ? products.length : 0,
        totalSales: totalSales,
        sales: totalSales,
        orderCount: orderCount,
        description: tenantData.description || '',
        // 모달에서 가져온 추가 데이터 (성장률, 만족도는 샘플 데이터)
        growth: tenant.growth || 0,
        satisfaction: tenant.satisfaction || 0
      };

      setSelectedTenant(fullTenantData);
      setShowTenantDetailModal(true);
      
    } catch (error) {
      console.error('입점사 정보 로드 오류:', error);
      alert('입점사 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setTenantDetailLoading(false);
    }
  };

  // 상태 배지 스타일 함수
  const getStatusBadge = (status) => {
    const statusMap = {
      '승인대기': 'badge-warning',
      '승인됨': 'badge-success',
      '일시정지': 'badge-warning',
      '계약종료': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  };

  // 카테고리별 통계 데이터 (실시간 데이터)
  const categoryData = {
    tenants: {
      title: '입점사 관리',
      icon: Building2,
      color: '#007bff',
      stats: [
        { 
          title: '총 입점사', 
          value: realTimeStats.totalTenants.toString(), 
          change: `+${realTimeStats.newTenantsMonth}`, 
          isPositive: true 
        },
        { 
          title: '신규 입점사', 
          value: realTimeStats.newTenantsMonth.toString(), 
          change: '최근 30일', 
          isPositive: true 
        },
        { 
          title: '평균 매출', 
          value: realTimeStats.totalTenants > 0 ? `₩${Math.round(realTimeStats.totalSales / realTimeStats.totalTenants).toLocaleString()}` : '₩0', 
          change: '입점사당', 
          isPositive: true 
        },
        { 
          title: '활성 상태', 
          value: '100%', 
          change: '모든 입점사', 
          isPositive: true 
        }
      ],
      details: {
        topTenants: detailData.topBrands,
        categoryDistribution: detailData.categoryDistribution
      }
    },
    products: {
      title: '상품 승인 관리',
      icon: CheckCircle,
      color: '#28a745',
      stats: [
        { 
          title: '승인 대기', 
          value: realTimeStats.pendingProducts.toString(), 
          change: '숨김 상품', 
          isPositive: realTimeStats.pendingProducts === 0 
        },
        { 
          title: '승인 완료', 
          value: realTimeStats.approvedProducts.toString(), 
          change: '판매 중', 
          isPositive: true 
        },
        { 
          title: '품절 상품', 
          value: realTimeStats.soldoutProducts.toString(), 
          change: '재고 없음', 
          isPositive: false 
        },
        { 
          title: '총 상품', 
          value: (realTimeStats.approvedProducts + realTimeStats.soldoutProducts + realTimeStats.pendingProducts).toString(), 
          change: '전체', 
          isPositive: true 
        }
      ],
      details: {
        approvalStatus: detailData.approvalStatus,
        categoryApproval: detailData.categoryDistribution.map(cat => ({
          category: cat.category,
          approved: cat.count,
          pending: 0,
          rejected: 0
        }))
      }
    },

    sales: {
      title: '매출 분석',
      icon: DollarSign,
      color: '#dc3545',
      stats: [
        { 
          title: '총 매출', 
          value: `₩${Math.round(realTimeStats.totalSales / 10000).toLocaleString()}만`, 
          change: '전체 기간', 
          isPositive: true 
        },
        { 
          title: '총 주문', 
          value: realTimeStats.totalOrders.toLocaleString(), 
          change: '누적 주문', 
          isPositive: true 
        },
        { 
          title: '평균 주문액', 
          value: realTimeStats.totalOrders > 0 ? `₩${Math.round(realTimeStats.totalSales / realTimeStats.totalOrders).toLocaleString()}` : '₩0', 
          change: '주문당', 
          isPositive: true 
        },
        { 
          title: '고객 수', 
          value: realTimeStats.totalCustomers.toString(), 
          change: '구매 고객', 
          isPositive: true 
        }
      ],
      details: {
        monthlySales: advancedData.monthlyTrends.length > 0 ? advancedData.monthlyTrends : [
          { 
            month: '이번 달', 
            sales: realTimeStats.monthlySales, 
            orders: realTimeStats.totalOrders, 
            customers: realTimeStats.totalCustomers 
          }
        ],
        categorySales: detailData.categorySales
      }
    },
    operations: {
      title: '운영 효율성',
      icon: Activity,
      color: '#6f42c1',
      stats: [
        { 
          title: '시스템 가동률', 
          value: `${advancedData.systemMetrics.systemUptime || 99.8}%`, 
          change: '+0.2%', 
          isPositive: true 
        },
        { 
          title: '평균 처리시간', 
          value: `${advancedData.systemMetrics.avgProcessingTime || 2.1}시간`, 
          change: '-0.3시간', 
          isPositive: true 
        },
        { 
          title: '상품 승인률', 
          value: `${advancedData.systemMetrics.approvalRate || 0}%`, 
          change: '실시간', 
          isPositive: true 
        },
        { 
          title: '오류 발생률', 
          value: `${advancedData.systemMetrics.errorRate || 0.3}%`, 
          change: '-0.1%', 
          isPositive: true 
        }
      ],
      details: {
        systemUsage: [
          { 
            system: '입점사 관리', 
            usage: Math.round((realTimeStats.totalTenants / 15) * 100), 
            efficiency: Math.round(advancedData.systemMetrics.efficiency || 92) 
          },
          { 
            system: '상품 승인', 
            usage: Math.round((realTimeStats.approvedProducts / 200) * 100), 
            efficiency: Math.round(parseFloat(advancedData.systemMetrics.approvalRate || 88)) 
          },
          { 
            system: '고객 서비스', 
            usage: Math.round((realTimeStats.totalCustomers / 10) * 100), 
            efficiency: 95 
          },
          { 
            system: '매출 분석', 
            usage: Math.round((realTimeStats.totalOrders / 30) * 100), 
            efficiency: 89 
          },
          { 
            system: '정산 관리', 
            usage: 88, 
            efficiency: 91 
          }
        ],
        performanceMetrics: advancedData.performanceIndicators
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

  // 로딩 중일 때 표시
  if (loading) {
    return (
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
          통계 데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 기간 선택 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">본사 통계 분석</h2>
            <p style={{ color: '#666', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              실시간 데이터 기반 통계 분석 ({realTimeStats.totalTenants}개 입점사, {realTimeStats.totalOrders}건 주문)
            </p>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '새로고침 중...' : '새로고침'}
          </button>
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
              onClick={loadStatisticsData}
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

        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>기간 선택</h3>
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
                onClick={async () => {
                  if (selectedCategory === 'tenants') {
                    setDetailModalType('tenants');
                    await loadModalData('tenants');
                    setShowDetailModal(true);
                  } else if (selectedCategory === 'products') {
                    navigate('/product-management');
                  } else if (selectedCategory === 'sales') {
                    await loadSalesCategoryModalData();
                    setShowSalesCategoryModal(true);
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
                onClick={async () => {
                  if (selectedCategory === 'tenants') {
                    await loadCategoryModalData();
                    setShowCategoryModal(true);
                  } else if (selectedCategory === 'products') {
                    navigate('/product-management');
                  } else if (selectedCategory === 'sales') {
                    setDetailModalType('sales');
                    await loadModalData('sales');
                    setShowDetailModal(true);
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
                  <span style={{ fontWeight: '600' }}>{cat.count}개 입점사</span>
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

      {/* 상세 통계 모달 */}
      {showDetailModal && (
        <div 
          style={{
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
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '800px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <h2 style={{ 
                  margin: 0, 
                  color: '#1f2937',
                  fontSize: '1.125rem',
                  fontWeight: '600'
                }}>
                  {detailModalType === 'tenants' ? '입점사별 상세 통계' : '매출별 상세 통계'}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px',
                    color: '#6b7280'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* 내용 영역 */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              padding: '1rem'
            }}>
          
          {modalLoading && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '2rem',
              flexDirection: 'column'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '4px solid #f3f4f6', 
                borderTop: '4px solid #3b82f6', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}></div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {detailModalType === 'tenants' ? '입점사 데이터를 불러오는 중...' : '매출 데이터를 불러오는 중...'}
              </p>
            </div>
          )}

          {!modalLoading && detailModalType === 'tenants' && modalData && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.125rem' }}>
                    전체 입점사 현황
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                    총 {modalData.totalCount}개 입점사
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#059669', fontSize: '1.25rem', fontWeight: '600' }}>
                    ₩{modalData.totalSales.toLocaleString()}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                    총 매출
                  </p>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>입점사별 매출 현황</h3>
              
              {/* 임시 데이터 안내 */}
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: '#92400e',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ fontWeight: '600' }}>📝 참고사항:</span>
                  <span>만족도와 성장률은 현재 샘플 데이터입니다. 실제 데이터 연동 시 업데이트 예정입니다.</span>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                {modalData.data.map((tenant, index) => (
                  <div 
                    key={tenant.id || index} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTenantClick(tenant);
                    }}
                    className="tenant-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      backgroundColor: index < 3 ? '#f0f9ff' : '#f9fafb',
                      cursor: 'pointer',
                      gap: '1rem'
                    }}
                  >
                    {/* 왼쪽: 기본 정보 */}
                    <div style={{ 
                      flex: '2', 
                      minWidth: '0', 
                      backgroundColor: index < 3 ? '#f0f9ff' : '#f9fafb'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ 
                          fontWeight: '600', 
                          color: '#1f2937',
                          fontSize: '1rem'
                        }}>
                          {tenant.name}
                        </span>
                        <span style={{
                          backgroundColor: index < 3 ? '#3b82f6' : '#6b7280',
                          color: 'white',
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          {index < 3 ? `TOP ${index + 1}` : `${index + 1}위`}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        {tenant.email}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        상품 {tenant.products || 0}개 | 만족도 {(tenant.satisfaction || 0).toFixed(1)}/5.0 | 
                        가입일: {tenant.joined_at ? new Date(tenant.joined_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>

                    {/* 중앙: 매출 정보 */}
                    <div style={{ 
                      flex: '1', 
                      textAlign: 'center', 
                      minWidth: '100px', 
                      backgroundColor: index < 3 ? '#f0f9ff' : '#f9fafb'
                    }}>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '1.125rem',
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        ₩{(tenant.sales || 0).toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        총 매출
                      </div>
                    </div>

                    {/* 오른쪽: 성장률 */}
                    <div style={{ 
                      flex: '0 0 auto', 
                      textAlign: 'right', 
                      minWidth: '80px', 
                      backgroundColor: index < 3 ? '#f0f9ff' : '#f9fafb'
                    }}>
                      <div style={{ 
                        fontSize: '1rem',
                        color: (tenant.growth || 0) >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: '600',
                        marginBottom: '0.25rem'
                      }}>
                        {(tenant.growth || 0) >= 0 ? '+' : ''}{(tenant.growth || 0).toFixed(1)}%
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        성장률
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!modalLoading && detailModalType === 'sales' && modalData && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>월별 매출 트렌드</h3>
              <div style={{ marginBottom: '2rem' }}>
                {(modalData.data?.monthlySales || []).map((month, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{month.month}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        주문 {month.orders || 0}건 | 고객 {month.customers || 0}명
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: '#059669' }}>
                        ₩{(month.sales || 0).toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: (month.growth || 0) >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {(month.growth || 0) >= 0 ? '+' : ''}{(month.growth || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ marginBottom: '1rem', color: '#374151' }}>카테고리별 매출 현황</h3>
              <div>
                {(modalData.data?.categorySales || []).map((cat, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontWeight: '500' }}>{cat.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: '#6b7280' }}>{cat.orders || 0}건</span>
                      <span style={{ 
                        color: '#059669', 
                        fontWeight: '600',
                        minWidth: '80px',
                        textAlign: 'right'
                      }}>
                        ₩{(cat.sales || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

            </div>
            
            {/* 푸터 */}
            <div style={{ 
              padding: '0.75rem 1rem',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end' 
              }}>
                <button 
                  className="btn" 
                  style={{ background: '#3b82f6', color: 'white' }}
                  onClick={() => setShowDetailModal(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 입점사 상세 정보 모달 */}
      {showTenantDetailModal && (
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
                onClick={() => {
                  setShowTenantDetailModal(false);
                  setSelectedTenant(null);
                  setTenantDetailLoading(false);
                }}
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
              {tenantDetailLoading ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '2rem',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <Loader className="animate-spin" size={32} />
                  <p style={{ color: '#6b7280', margin: 0 }}>입점사 정보를 불러오는 중...</p>
                </div>
              ) : selectedTenant ? (
                <div className="tenant-details">
                  <div className="detail-section">
                    <h3>기본 정보</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>회사명</label>
                        <span>{selectedTenant.name || selectedTenant.companyName}</span>
                      </div>
                      <div className="detail-item">
                        <label>등급</label>
                        <span style={{ 
                          fontWeight: '600',
                          color: (selectedTenant.grade || 1) === 1 ? '#dc3545' : (selectedTenant.grade || 1) === 2 ? '#ffc107' : '#28a745'
                        }}>
                          {selectedTenant.grade || 1}등급
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>이메일</label>
                        <span>{selectedTenant.email}</span>
                      </div>
                      <div className="detail-item">
                        <label>전화번호</label>
                        <span>{selectedTenant.phone || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>사업자등록번호</label>
                        <span>{selectedTenant.businessNumber || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>등록된 상품 수</label>
                        <span style={{ 
                          fontWeight: '600',
                          color: (selectedTenant.products || selectedTenant.productCount || 0) > 10 ? '#28a745' : (selectedTenant.products || selectedTenant.productCount || 0) > 0 ? '#ffc107' : '#6c757d'
                        }}>
                          {(selectedTenant.products || selectedTenant.productCount || 0).toLocaleString()}개
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>주소</label>
                        <span>{selectedTenant.address || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>입점일</label>
                        <span>{selectedTenant.joined_at ? new Date(selectedTenant.joined_at).toLocaleDateString() : selectedTenant.joinDate || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>상태</label>
                        <span className={`badge ${getStatusBadge(selectedTenant.status)}`}>
                          {selectedTenant.status}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>수수료율</label>
                        <span>{selectedTenant.commission || ((selectedTenant.grade || 1) === 1 ? 5.0 : (selectedTenant.grade || 1) === 2 ? 4.0 : 3.0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h3>매출 정보</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>총 매출</label>
                        <span style={{ 
                          fontWeight: '600',
                          color: '#3b82f6'
                        }}>
                          ₩{(selectedTenant.sales || selectedTenant.totalSales || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>주문 수</label>
                        <span style={{ 
                          fontWeight: '600',
                          color: '#10b981'
                        }}>
                          {selectedTenant.orderCount || 0}건
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>성장률</label>
                        <span style={{ 
                          fontWeight: '600',
                          color: (selectedTenant.growth || 0) >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {(selectedTenant.growth || 0) >= 0 ? '+' : ''}{(selectedTenant.growth || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>만족도</label>
                        <span style={{ 
                          fontWeight: '600',
                          color: '#f59e0b'
                        }}>
                          {(selectedTenant.satisfaction || 0).toFixed(1)}/5.0
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTenant.description && (
                    <div className="detail-section">
                      <h3>설명</h3>
                      <p>{selectedTenant.description}</p>
                    </div>
                  )}
                </div>
              ) : null}
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
                {selectedTenant?.status === '승인됨' && (
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setShowTenantDetailModal(false);
                      alert('일시정지 기능은 입점사 관리 페이지에서 이용해주세요.');
                    }}
                    title="일시정지"
                  >
                    <XCircle size={14} /> 일시정지
                  </button>
                )}
                {selectedTenant?.status === '일시정지' && (
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setShowTenantDetailModal(false);
                      alert('활성화 기능은 입점사 관리 페이지에서 이용해주세요.');
                    }}
                    title="활성화"
                  >
                    <CheckCircle size={14} /> 활성화
                  </button>
                )}
                {(selectedTenant?.status === '승인됨' || selectedTenant?.status === '일시정지') && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      setShowTenantDetailModal(false);
                      alert('계약 종료 기능은 입점사 관리 페이지에서 이용해주세요.');
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
                onClick={() => {
                  setShowTenantDetailModal(false);
                  setSelectedTenant(null);
                  setTenantDetailLoading(false);
                }}
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

      {/* 카테고리별 입점사 분포 모달 */}
      {showCategoryModal && (
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
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                카테고리별 입점사 분포
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryModalData(null);
                  setSelectedCategoryTenants(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X />
              </button>
            </div>

            {/* 모달 내용 */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              {categoryModalLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div>데이터를 불러오는 중...</div>
                </div>
              ) : selectedCategoryTenants ? (
                // 특정 카테고리의 입점사 목록
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => setSelectedCategoryTenants(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        color: '#3b82f6',
                        marginRight: '0.5rem'
                      }}
                    >
                      ← 뒤로
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
                      {selectedCategoryTenants.category} 카테고리 입점사
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedCategoryTenants.tenants.map((tenant, index) => (
                      <div key={tenant.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                            {tenant.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {tenant.email}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            등급: {tenant.grade}등급
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            상품: {tenant.productCount}개
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // 카테고리별 분포 목록
                <div>
                  <div style={{ marginBottom: '1rem', color: '#6b7280' }}>
                    각 카테고리를 클릭하면 해당 카테고리의 입점사 목록을 확인할 수 있습니다.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {categoryModalData && categoryModalData.length > 0 ? (
                      categoryModalData.map((cat, index) => (
                        <div
                          key={index}
                          onClick={async () => {
                            setCategoryModalLoading(true);
                            try {
                              const tenants = await getTenantsByCategory(cat.category);
                              setSelectedCategoryTenants({
                                category: cat.category,
                                tenants: tenants
                              });
                            } finally {
                              setCategoryModalLoading(false);
                            }
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            backgroundColor: '#f9fafb'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f9fafb';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                              {cat.category}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {cat.count}개 입점사
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#3b82f6' }}>
                              {cat.percentage}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              클릭하여 상세보기
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        카테고리별 입점사 분포 데이터가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryModalData(null);
                  setSelectedCategoryTenants(null);
                }}
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

      {/* 카테고리별 매출 모달 */}
      {showSalesCategoryModal && (
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
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                카테고리별 매출 현황
              </h2>
              <button
                onClick={() => {
                  setShowSalesCategoryModal(false);
                  setSalesCategoryModalData(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X />
              </button>
            </div>

            {/* 모달 내용 */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1
            }}>
              {salesCategoryModalLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div>데이터를 불러오는 중...</div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1rem', color: '#6b7280' }}>
                    각 카테고리별 매출 현황을 확인할 수 있습니다.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {salesCategoryModalData && salesCategoryModalData.length > 0 ? (
                      salesCategoryModalData.map((cat, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: '#f9fafb'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                              {cat.category}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              매출 비율: {cat.percentage}%
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#28a745' }}>
                              ₩{cat.sales.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              총 매출
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        카테고리별 매출 데이터가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                onClick={() => {
                  setShowSalesCategoryModal(false);
                  setSalesCategoryModalData(null);
                }}
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
    </div>
  );
};

export default StatisticsHQ;