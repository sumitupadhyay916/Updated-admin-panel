import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/authStore';
import { dashboardApi, sellersApi } from '@/services/api';
import type { Order, Product, ChartData } from '@/types';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  ArrowRight,
  Eye,
  Store,
  IndianRupee,
  Wallet,
  Star,
  Clock,
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

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const seller = user as any; // Type assertion for seller data
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<ChartData[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = {
    totalOrders: sellerOrders.length,
    totalProducts: sellerProducts.length,
    totalRevenue: seller?.totalEarnings || 0,
    availableBalance: seller?.availableBalance || 0,
    pendingBalance: seller?.pendingBalance || 0,
    pendingOrders: sellerOrders.filter(o => o.orderStatus === 'pending').length,
    lowStockProducts: sellerProducts.filter(p => p.stockQuantity <= p.lowStockThreshold).length,
    averageRating: sellerProducts.reduce((acc, p) => acc + p.rating, 0) / (sellerProducts.length || 1),
  };

  const recentOrders = sellerOrders.slice(0, 5);
  const lowStockItems = sellerProducts.filter(p => p.stockQuantity <= p.lowStockThreshold).slice(0, 5);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [ordersRes, productsRes, revenueRes, ordersChartRes] = await Promise.all([
          sellersApi.getSellerOrders(user.id, { page: 1, limit: 50 }),
          sellersApi.getSellerProducts(user.id, { page: 1, limit: 100 }),
          dashboardApi.getRevenueChart(),
          dashboardApi.getOrdersChart(),
        ]);

        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          setSellerOrders(ordersRes.data as Order[]);
        }
        if (productsRes.success && Array.isArray(productsRes.data)) {
          setSellerProducts(productsRes.data as Product[]);
        }
        if (
          revenueRes.success &&
          Array.isArray(revenueRes.data) &&
          ordersChartRes.success &&
          Array.isArray(ordersChartRes.data)
        ) {
          const byName = new Map<string, { name: string; sales?: number; orders?: number }>();

          (revenueRes.data as ChartData[]).forEach((item) => {
            const name = item.name;
            const existing = byName.get(name) || { name };
            const sales = typeof (item as any).revenue === 'number' ? (item as any).revenue : (item.value as number | undefined) || 0;
            byName.set(name, { ...existing, sales });
          });

          (ordersChartRes.data as ChartData[]).forEach((item) => {
            const name = item.name;
            const existing = byName.get(name) || { name };
            const orders = typeof (item as any).orders === 'number' ? (item as any).orders : (item.value as number | undefined) || 0;
            byName.set(name, { ...existing, orders });
          });

          setSalesData(Array.from(byName.values()));
        }
      } catch (error) {
        console.error('Failed to load seller dashboard data', error);
      }
    };

    void loadData();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Dashboard"
        description={`Welcome back, ${seller?.businessName || seller?.name}`}
        badge="Seller"
        icon={Store}
      />

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Available Balance</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.availableBalance)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-4 w-full bg-white text-green-600 hover:bg-green-50"
              asChild
            >
              <Link to="/seller/payouts">Request Payout</Link>
            </Button>
          </CardContent>
        </Card> */}

        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(stats.pendingBalance)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <IndianRupee className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={TrendingUp}
          className="border-l-4 border-l-yellow-500"
        />
        <StatCard
          title="Average Rating"
          value={`${stats.averageRating.toFixed(1)} ★`}
          icon={Star}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Sales Overview</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Monthly sales performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
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
                  dataKey="sales" 
                  name="Sales" 
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
              <BarChart data={salesData}>
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

      {/* Recent Orders & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Recent Orders</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Latest orders for your products
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
              <Link to="/seller/orders">
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
                    <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Product</th>
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
                        <p className="text-sm text-gray-900 dark:text-white">
                          {order.items.find(i => i.sellerId === user?.id)?.productName}
                        </p>
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

        {/* Low Stock Alert */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="dark:text-white">Low Stock Alert</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Products running low on inventory
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="dark:border-gray-700 dark:text-white">
              <Link to="/seller/inventory">
                Manage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((product) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/50'}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Only {product.stockQuantity} left (threshold: {product.lowStockThreshold})
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/seller/inventory">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No low stock items</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Info */}
      <Card className="dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Commission Rate</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Platform commission deducted from each sale
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {seller?.commissionRate || 15}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">per transaction</p>
              </div>
              <div className="w-32">
                <Progress value={(seller?.commissionRate || 15) * 2} className="h-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
