import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { dashboardApi, productsApi, sellersApi } from '@/services/api';
import type { DashboardStats, ChartData, Order, Product } from '@/types';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Store,
  Clock,
  AlertTriangle,
  ArrowRight,
  Eye,
  Shield,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [ordersData, setOrdersData] = useState<ChartData[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [pendingProductsCount, setPendingProductsCount] = useState(0);
  const [activeSellersCount, setActiveSellersCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          statsRes,
          revenueRes,
          ordersRes,
          recentOrdersRes,
          pendingProductsRes,
          sellersRes,
        ] = await Promise.all([
          dashboardApi.getAdminDashboard(),
          dashboardApi.getRevenueChart(),
          dashboardApi.getOrdersChart(),
          dashboardApi.getRecentOrders(5),
          productsApi.getPendingProducts({ page: 1, limit: 5 }),
          sellersApi.getSellers({ status: 'active', page: 1, limit: 1 }),
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data as DashboardStats);
        }
        if (revenueRes.success && Array.isArray(revenueRes.data)) {
          setRevenueData(revenueRes.data as ChartData[]);
        }
        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          setOrdersData(ordersRes.data as ChartData[]);
        }
        if (recentOrdersRes.success && Array.isArray(recentOrdersRes.data)) {
          setRecentOrders(recentOrdersRes.data as Order[]);
        }
        if (pendingProductsRes.success) {
          if (Array.isArray(pendingProductsRes.data)) {
            setPendingProducts(pendingProductsRes.data as Product[]);
          }
          if (pendingProductsRes.meta?.total != null) {
            setPendingProductsCount(pendingProductsRes.meta.total);
          }
        }
        if (sellersRes.success) {
          if (sellersRes.meta?.total != null) {
            setActiveSellersCount(sellersRes.meta.total);
          } else if (Array.isArray(sellersRes.data)) {
            setActiveSellersCount(sellersRes.data.length);
          }
        }
      } catch (error) {
        console.error('Failed to load admin dashboard data', error);
      }
    };

    void loadData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Manage sellers, products, and orders"
        // badge="Admin"
        icon={Shield}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : 'Loading...'}
          change={stats?.revenueChange}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders.toLocaleString() || 'Loading...'}
          change={stats?.ordersChange}
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts.toLocaleString() || 'Loading...'}
          icon={Package}
        />
        <StatCard
          title="Active Sellers"
          value={activeSellersCount.toString()}
          icon={Store}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon={Clock}
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title="Pending Products"
          value={pendingProductsCount}
          icon={AlertTriangle}
          className="border-l-4 border-l-orange-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockProducts || 0}
          icon={AlertTriangle}
          className="border-l-4 border-l-red-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Revenue Overview</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Monthly revenue from all sellers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Orders Overview</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Monthly order count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="orders" name="Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Pending Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Recent Orders</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Latest orders from your sellers
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
              <Link to="/admin/orders">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Order</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Customer</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                      </td>
                      <td className="py-3">
                        <p className="text-sm text-gray-900 dark:text-white">{order.customerName}</p>
                      </td>
                      <td className="py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pending Products */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Pending Products</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Products awaiting approval
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
              <Link to="/admin/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.sellerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={product.stock} />
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/products`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {pendingProducts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No pending products</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
