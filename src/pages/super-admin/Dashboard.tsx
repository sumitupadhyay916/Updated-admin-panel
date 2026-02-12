import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { dashboardApi } from '@/services/api';
import type { DashboardStats, ChartData, Order, Payout, ContactQuery } from '@/types';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Store,
  Clock,
  AlertTriangle,
  Wallet,
  MessageSquare,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#f97316', '#fbbf24', '#f59e0b', '#d97706', '#92400e'];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [ordersData, setOrdersData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<Payout[]>([]);
  const [openQueries, setOpenQueries] = useState<ContactQuery[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          statsRes,
          revenueRes,
          ordersRes,
          categoryRes,
          recentOrdersRes,
          pendingPayoutsRes,
          openQueriesRes,
        ] = await Promise.all([
          dashboardApi.getSuperAdminDashboard(),
          dashboardApi.getRevenueChart(),
          dashboardApi.getOrdersChart(),
          dashboardApi.getCategoryChart(),
          dashboardApi.getRecentOrders(5),
          dashboardApi.getPendingPayouts(5),
          dashboardApi.getOpenQueries(5),
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
        if (categoryRes.success && Array.isArray(categoryRes.data)) {
          setCategoryData(categoryRes.data as ChartData[]);
        }
        if (recentOrdersRes.success && Array.isArray(recentOrdersRes.data)) {
          setRecentOrders(recentOrdersRes.data as Order[]);
        }
        if (pendingPayoutsRes.success && Array.isArray(pendingPayoutsRes.data)) {
          setPendingPayouts(pendingPayoutsRes.data as Payout[]);
        }
        if (openQueriesRes.success && Array.isArray(openQueriesRes.data)) {
          setOpenQueries(openQueriesRes.data as ContactQuery[]);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
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
        title="Super Admin Dashboard"
        description="Welcome back! Here's an overview of your marketplace."
        // badge="Super Admin"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : '₹0'}
          change={stats?.revenueChange}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders.toLocaleString() || '0'}
          change={stats?.ordersChange}
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts.toLocaleString() || '0'}
          icon={Package}
        />
        <StatCard
          title="Total Sellers"
          value={stats?.totalSellers.toString() || '0'}
          icon={Store}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon={Clock}
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title="Total Admins"
          value={stats?.totalAdmins || 0}
          icon={AlertTriangle}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="Pending Payouts"
          value={stats?.pendingPayouts || 0}
          icon={Wallet}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Total Category"
          value={stats?.totalCategories || 0}
          icon={MessageSquare}
          className="border-l-4 border-l-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Revenue & Commission</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Monthly revenue and platform commission
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
                <Line 
                  type="monotone" 
                  dataKey="commission" 
                  name="Commission" 
                  stroke="#fbbf24" 
                  strokeWidth={2}
                  dot={{ fill: '#fbbf24' }}
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

      {/* Category Distribution & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Distribution */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Sales by Each Category</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Product category distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Recent Orders</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Latest orders across all sellers
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
              <Link to="/super-admin/orders">
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
                    <th className="pb-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="group">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
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
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/super-admin/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts & Queries */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Payouts */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Pending Payouts</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Payout requests awaiting approval
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
              <Link to="/super-admin/payouts">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayouts.map((payout) => (
                <div 
                  key={payout.id} 
                  className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{payout.sellerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Requested {new Date(payout.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(payout.amount)}
                    </p>
                    <StatusBadge status={payout.status} />
                  </div>
                </div>
              ))}
              {pendingPayouts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No pending payouts</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Open Queries */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Open Queries</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Customer support tickets
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
              <Link to="/super-admin/queries">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {openQueries.map((query) => (
                <div 
                  key={query.id} 
                  className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{query.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {query.name} • {new Date(query.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={query.priority} />
                    <StatusBadge status={query.status} />
                  </div>
                </div>
              ))}
              {openQueries.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No open queries</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
