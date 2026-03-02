import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout, AuthLayout } from '@/components/layout/Layout';
import { Toaster } from '@/components/ui/sonner';

// Auth Pages
import Login from '@/pages/auth/Login';

// Super Admin Pages
import SuperAdminDashboard from '@/pages/super-admin/Dashboard';
import AdminManagement from '@/pages/super-admin/AdminManagement';
import SellerManagement from '@/pages/super-admin/SellerManagement';
import ProductsManagement from '@/pages/super-admin/Products';
import OrdersManagement from '@/pages/super-admin/Orders';
import PayoutsManagement from '@/pages/super-admin/Payouts';
import Categories from '@/pages/super-admin/Categories';
import SupportPages from '@/pages/super-admin/SupportPages';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';

// Seller Pages
import SellerDashboard from '@/pages/seller/Dashboard';
import ListCoupon from '@/pages/seller/Coupons/ListCoupon';
import CreateCoupon from '@/pages/seller/Coupons/CreateCoupon';
import AbandonedCarts from '@/pages/seller/AbandonedCarts';
import SellerSupportPages from '@/pages/seller/SellerSupportPages';
import SellerInventory from '@/pages/seller/Inventory';
import StaffManagement from '@/pages/seller/staff/StaffManagement';

// Protected Route Component
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role || '')) {
    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case 'super_admin':
        return <Navigate to="/super-admin" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'seller':
      case 'staff':
        return <Navigate to="/seller" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

// Public Route - redirects to dashboard if already logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    switch (user?.role) {
      case 'super_admin':
        return <Navigate to="/super-admin" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'seller':
      case 'staff':
        return <Navigate to="/seller" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
        </Route>

        {/* Super Admin Routes */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/admins" element={<AdminManagement />} />
          <Route path="/super-admin/sellers" element={<SellerManagement />} />
          <Route path="/super-admin/products" element={<ProductsManagement />} />
          <Route path="/super-admin/my-products" element={<ProductsManagement />} />
          <Route path="/super-admin/orders" element={<OrdersManagement />} />
          <Route path="/super-admin/categories" element={<Categories />} />
          <Route path="/super-admin/payouts" element={<PayoutsManagement />} />
          <Route path="/super-admin/support-pages" element={<SupportPages />} />
          <Route path="/super-admin/support-pages/:slug" element={<SupportPages />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/sellers" element={<SellerManagement />} />
          <Route path="/admin/products" element={<ProductsManagement />} />
          <Route path="/admin/my-products" element={<ProductsManagement />} />
          <Route path="/admin/orders" element={<OrdersManagement />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/payouts" element={<PayoutsManagement />} />
          <Route path="/admin/support-pages" element={<SupportPages />} />
          <Route path="/admin/support-pages/:slug" element={<SupportPages />} />
        </Route>

        {/* Seller & Staff Routes */}
        <Route 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'seller', 'staff']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/inventory" element={<SellerInventory />} />
          <Route path="/seller/products" element={<ProductsManagement />} />
          <Route path="/seller/orders" element={<OrdersManagement />} />
          <Route path="/seller/payouts" element={<PayoutsManagement />} />
          <Route path="/seller/coupons" element={<ListCoupon />} />
          <Route path="/seller/coupons/create" element={<CreateCoupon />} />
          <Route path="/seller/abandoned-carts" element={<AbandonedCarts />} />
          <Route path="/seller/staff" element={<StaffManagement />} />
          <Route path="/seller/support-pages" element={<SellerSupportPages />} />
          <Route path="/seller/support-pages/:slug" element={<SellerSupportPages />} />
          {/* Settings routes — sidebar Settings parent highlights for /seller/settings/* */}
          <Route path="/seller/settings" element={<SellerSupportPages />} />
          <Route path="/seller/settings/faqs" element={<SellerSupportPages />} />
          <Route path="/seller/settings/privacy-policy" element={<SellerSupportPages />} />
          <Route path="/seller/settings/terms-conditions" element={<SellerSupportPages />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
