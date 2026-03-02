import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ordersApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { Order } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  ShoppingCart,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function OrdersManagement() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Sellers must only see orders that include their own items
        const params: any = { page: 1, limit: 100 };
        if (user?.role === 'seller' && user?.id) {
          params.sellerId = user.id;
        }
        const response = await ordersApi.getOrders(params);
        if (response.success && Array.isArray(response.data)) {
          setOrders(response.data as Order[]);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Failed to load orders', error);
        setOrders([]);
      }
    };

    void loadOrders();
  }, [user?.id, user?.role]);

  const handleUpdateStatus = async (orderId: string, status: Order['orderStatus']) => {
    try {
      const response = await ordersApi.updateOrderStatus(orderId, { status });
      if (response.success && response.data) {
        const updated = response.data as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    } catch (error) {
      console.error('Failed to update order status', error);
    }
  };

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: 'orderNumber',
      header: 'Order',
      cell: ({ row }: { row: { original: Order } }) => {
        const order = row.original;
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }: { row: { original: Order } }) => {
        const order = row.original;
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{order.customerEmail}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }: { row: { original: Order } }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.original.items.length} item(s)
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }: { row: { original: Order } }) => (
        <p className="font-medium text-gray-900 dark:text-white">
          {formatCurrency(row.original.totalAmount)}
        </p>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }: { row: { original: Order } }) => <StatusBadge status={row.original.paymentStatus} />,
    },
    {
      accessorKey: 'orderStatus',
      header: 'Status',
      cell: ({ row }: { row: { original: Order } }) => <StatusBadge status={row.original.orderStatus} />,
    },
    // {
    //   accessorKey: 'fulfillmentStatus',
    //   header: 'Fulfillment',
    //   cell: ({ row }: { row: { original: Order } }) => (
    //     <div className="flex items-center gap-2">
    //       <StatusBadge status={row.original.fulfillmentStatus} />
    //     </div>
    //   ),
    // },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Order } }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:border-gray-700 dark:bg-gray-800">
              <DropdownMenuLabel className="dark:text-gray-300">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              <DropdownMenuItem onClick={() => openViewDialog(order)} className="dark:text-gray-300">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {order.orderStatus === 'pending' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmed')} className="dark:text-gray-300">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Order
                </DropdownMenuItem>
              )}
              {order.orderStatus === 'confirmed' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'processing')} className="dark:text-gray-300">
                  <Package className="mr-2 h-4 w-4" />
                  Start Processing
                </DropdownMenuItem>
              )}
              {order.orderStatus === 'processing' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')} className="dark:text-gray-300">
                  <Truck className="mr-2 h-4 w-4" />
                  Mark Shipped
                </DropdownMenuItem>
              )}
              {order.orderStatus === 'shipped' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')} className="dark:text-gray-300">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Delivered
                </DropdownMenuItem>
              )}
              {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing'].includes(o.orderStatus)).length,
    shipped: orders.filter(o => o.orderStatus === 'shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
    revenue: orders.filter(o => o.orderStatus !== 'cancelled').reduce((acc, o) => acc + o.totalAmount, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Manage all orders across the marketplace"
        icon={ShoppingCart}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{orderStats.total}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{orderStats.pending}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orderStats.processing}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Shipped</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{orderStats.shipped}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{orderStats.delivered}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(orderStats.revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={orders}
            searchKey="orderNumber"
            searchPlaceholder="Search orders..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] dark:border-gray-700 dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={selectedOrder.orderStatus} />
                  <StatusBadge status={selectedOrder.paymentStatus} />
                </div>
              </div>

              {/* Customer & Shipping */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Customer</p>
                  <p className="text-gray-700 dark:text-gray-300">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.customerPhone}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Shipping Address</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedOrder.shippingAddress.street}<br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}<br />
                    {selectedOrder.shippingAddress.pincode}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Order Items</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border dark:border-gray-700">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs dark:border-gray-600">{item.deity}</Badge>
                          <Badge variant="outline" className="text-xs dark:border-gray-600">{item.material}</Badge>
                          <Badge variant="outline" className="text-xs dark:border-gray-600">{item.height}"</Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Seller: {item.sellerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Order Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.shippingAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.taxAmount)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="text-green-600">-{formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 dark:border-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Total</span>
                      <span className="font-bold text-orange-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Split */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seller Earnings</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedOrder.sellerEarnings)}
                  </p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Platform Commission</p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(selectedOrder.platformCommission)}
                  </p>
                </div>
              </div>

              {/* Tracking */}
              {selectedOrder.trackingNumber && (
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tracking Information</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedOrder.carrier} - {selectedOrder.trackingNumber}
                  </p>
                </div>
              )}

              {/* Order Timeline */}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Order Timeline</p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Order Placed</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.orderStatus !== 'pending' && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Order Confirmed</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(selectedOrder.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
