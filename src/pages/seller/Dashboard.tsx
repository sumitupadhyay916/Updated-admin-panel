import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuthStore } from '@/store/authStore';
import { dashboardApi, sellersApi } from '@/services/api';
import type { Order } from '@/types';
import {
  ShoppingBag, Package, TrendingUp, ArrowRight,
  Store, IndianRupee, Star, CheckCircle,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface SellerDashData {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  myProducts: number;
  totalReviews: number;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  chartData: { name: string; sales: number; orders: number }[];
}

const EMPTY: SellerDashData = {
  totalOrders: 0, pendingOrders: 0, deliveredOrders: 0, myProducts: 0,
  totalReviews: 0, totalEarnings: 0, availableBalance: 0,
  pendingBalance: 0, chartData: [],
};

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const seller = user as any;
  const isStaff = user?.role === 'staff';
  const sellerId = isStaff ? (user as any).staffProfile?.sellerId : user?.id;

  const [dash, setDash] = useState<SellerDashData>(EMPTY);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (v: number | string | null | undefined) => {
    const val = typeof v === 'number' ? v : Number(v) || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(isNaN(val) ? 0 : val);
  };

  useEffect(() => {
    if (!user || (isStaff && !sellerId)) return;
    const load = async () => {
      setLoading(true);
      try {
        const [dashRes, ordersRes] = await Promise.all([
          dashboardApi.getSellerDashboard(),
          sellersApi.getSellerOrders(sellerId, { page: 1, limit: 5 }),
        ]);
        if (dashRes.success && dashRes.data) setDash(dashRes.data as SellerDashData);
        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          setRecentOrders((ordersRes.data as Order[]).slice(0, 5));
        }
      } catch (err) {
        console.error('Seller dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const hasChartData = (dash.chartData || []).some(d => d.sales > 0 || d.orders > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Dashboard"
        description={`Welcome back, ${seller?.name}`}
        icon={Store}
      />

      {/* Balance Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {fmt(dash?.totalEarnings)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <IndianRupee className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {fmt(dash.availableBalance)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {fmt(dash.pendingBalance)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Orders" value={dash.totalOrders} icon={ShoppingBag} />
        <StatCard title="My Products" value={dash.myProducts} icon={Package} />
        <StatCard title="Pending Orders" value={dash.pendingOrders} icon={TrendingUp} />
        <StatCard title="Delivered" value={dash.deliveredOrders} icon={CheckCircle} />
        <StatCard title="Total Reviews" value={dash.totalReviews} icon={Star} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Monthly Revenue</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Your actual sales earnings over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasChartData && !loading ? (
              <div className="flex h-[280px] items-center justify-center text-gray-400 dark:text-gray-500 flex-col gap-2">
                <IndianRupee className="h-10 w-10 opacity-30" />
                <p className="text-sm">No sales yet in the last 6 months</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dash.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                  <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    formatter={(v: number) => [fmt(v), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="sales" name="Revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Monthly Orders</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Number of orders received each month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasChartData && !loading ? (
              <div className="flex h-[280px] items-center justify-center text-gray-400 dark:text-gray-500 flex-col gap-2">
                <ShoppingBag className="h-10 w-10 opacity-30" />
                <p className="text-sm">No orders yet in the last 6 months</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dash.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                  <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    formatter={(v: number) => [v, 'Orders']}
                  />
                  <Bar dataKey="orders" name="Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="dark:text-white">Recent Orders</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Your latest 5 orders
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
            <Link to="/seller/orders">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Order #</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Product</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 font-medium text-gray-900 dark:text-white text-sm">{order.orderNumber}</td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                        {order.items?.find((i: any) => i.sellerId === sellerId)?.productName || order.items?.[0]?.productName || '—'}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {fmt(order.totalAmount)}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
