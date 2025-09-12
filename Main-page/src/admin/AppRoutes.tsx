import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './shared/contexts/AuthContext';
import Layout from './shared/components/Layout';

// 공통 페이지
import Orders from './shared/pages/Orders';
import Settlements from './shared/pages/Settlements';
import Settings from './shared/pages/Settings';

// HQ 전용 페이지
import ProfileHQ from './shared/pages/Profile';
import NoticeHQ from './shared/pages/Notice';
import HQDashboard from './hq/pages/HQDashboard';
import StatisticsHQ from './hq/pages/StatisticsHQ';
import ProductManagement from './hq/pages/ProductManagement';
import ProductApproval from './hq/pages/ProductApproval';
import ProductSettings from './hq/pages/ProductSettings';

import Tenants from './hq/pages/Tenants';
import TenantStatistics from './hq/pages/TenantStatistics';
import OperationsStatistics from './hq/pages/OperationsStatistics';
import CustomerService from './hq/pages/CustomerService';
import ProductStatistics from './hq/pages/ProductStatistics';
import SalesStatistics from './hq/pages/SalesStatistics';

// Merchant 전용 페이지
import ProfileMerchant from './merchant/pages/Profile';
import NoticeMerchant from './merchant/pages/Notice';
import DashboardMerchant from './merchant/pages/DashboardMerchant';
import StatisticsMerchant from './merchant/pages/StatisticsMerchant';
import Products from './merchant/pages/Products';
import Customers from './merchant/pages/Customers';
import CustomerServiceMerchant from './merchant/pages/CustomerService';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  
  // 사용자 role 가져오기 (user_metadata 또는 추가 DB 조회)
  const userRole = user?.user_metadata?.role || 'merchant'; // 기본값은 merchant
  
  const renderHQRoutes = () => (
    <Routes>
      <Route path="/" element={<HQDashboard />} />
      <Route path="/dashboard" element={<HQDashboard />} />
      <Route path="/statistics" element={<StatisticsHQ />} />
      <Route path="/product-management" element={<ProductManagement />} />
      <Route path="/product-approval" element={<ProductApproval />} />
      <Route path="/product-settings" element={<ProductSettings />} />

      <Route path="/tenants" element={<Tenants />} />
      <Route path="/tenant-statistics" element={<TenantStatistics />} />
      <Route path="/operations-statistics" element={<OperationsStatistics />} />
      <Route path="/customer-service" element={<CustomerService />} />
      <Route path="/product-statistics" element={<ProductStatistics />} />
      <Route path="/sales-statistics" element={<SalesStatistics />} />
      
      {/* 공통 페이지 */}
      <Route path="/profile" element={<ProfileHQ />} />
      <Route path="/notice" element={<NoticeHQ />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/settlements" element={<Settlements />} />
      <Route path="/settings" element={<Settings />} />
      
      {/* 잘못된 경로는 대시보드로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
  
  const renderMerchantRoutes = () => (
    <Routes>
      <Route path="/" element={<DashboardMerchant />} />
      <Route path="/dashboard" element={<DashboardMerchant />} />
      <Route path="/statistics" element={<StatisticsMerchant />} />
      <Route path="/products" element={<Products />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/customer-service" element={<CustomerServiceMerchant />} />
      
      {/* 공통 페이지 */}
      <Route path="/profile" element={<ProfileMerchant />} />
      <Route path="/notice" element={<NoticeMerchant />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/settlements" element={<Settlements />} />
      <Route path="/settings" element={<Settings />} />
      
      {/* 잘못된 경로는 대시보드로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );

  return (
    <Layout userRole={userRole}>
      {userRole === 'admin' || userRole === 'hq' ? renderHQRoutes() : renderMerchantRoutes()}
    </Layout>
  );
};

export default AppRoutes;
