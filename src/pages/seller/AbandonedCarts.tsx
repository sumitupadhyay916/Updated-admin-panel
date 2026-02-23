import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Search,
  ChevronDown,
  Eye,
  Mail,
  Tag,
  Clock,
  RefreshCw,
  Trash2,
  TrendingUp,
  IndianRupee,
} from 'lucide-react';
import {
  abandonedCartsApi,
  type AbandonedCart,
  type AbandonedCartStats,
} from '@/services/api';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AbandonedCart['status'],
  { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }
> = {
  abandoned: { label: 'Abandoned', variant: 'destructive' },
  recovered: { label: 'Recovered', variant: 'default' },
  expired:   { label: 'Expired',   variant: 'secondary' },
};

const EMAIL_STATUS_CONFIG: Record<
  AbandonedCart['emailStatus'],
  { label: string; className: string }
> = {
  not_sent: { label: 'Not Sent', className: 'text-muted-foreground' },
  sent:     { label: 'Sent',     className: 'text-blue-600' },
  opened:   { label: 'Opened',   className: 'text-green-600' },
};

function fmt(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Cart Detail Dialog ──────────────────────────────────────────────────────

function CartDetailDialog({
  cart,
  open,
  onClose,
}: {
  cart: AbandonedCart | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!cart) return null;
  const emailCfg = EMAIL_STATUS_CONFIG[cart.emailStatus];
  const statusCfg = STATUS_CONFIG[cart.status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>#{cart.cartNumber.slice(0, 8).toUpperCase()}</DialogTitle>
          <DialogDescription>Cart details and items</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{cart.customerName}</p>
              <p className="text-muted-foreground">{cart.customerEmail}</p>
              {cart.customerPhone && <p className="text-muted-foreground">{cart.customerPhone}</p>}
            </div>
            <div className="text-right">
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              <p className="mt-1 text-sm font-medium">{fmt(cart.cartValue)}</p>
              <p className={`text-xs ${emailCfg.className}`}>{emailCfg.label}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-2 rounded-md border p-3 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{fmtDate(cart.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reminder Sent</p>
              <p>{fmtDate(cart.reminderSentAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recovered</p>
              <p>{fmtDate(cart.recoveredAt)}</p>
            </div>
          </div>

          {/* Coupon */}
          {cart.couponCode && (
            <div className="rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Attached Coupon: </span>
              <span className="font-mono font-semibold">{cart.couponCode}</span>
            </div>
          )}

          {/* Items */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <span className="font-medium">{item.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{fmt(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {cart.notes && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {cart.notes}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AbandonedCarts() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<AbandonedCartStats>({
    totalCarts: 0,
    recoveredCarts: 0,
    totalPotentialRevenue: 0,
    recoveryRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  // Detail Dialog
  const [detailCart, setDetailCart] = useState<AbandonedCart | null>(null);

  // ── Fetch ──
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await abandonedCartsApi.list({
        page,
        limit: LIMIT,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setCarts(res.data ?? []);
      setStats(res.stats ?? { totalCarts: 0, recoveredCarts: 0, totalPotentialRevenue: 0, recoveryRate: 0 });
      setTotal(res.meta?.total ?? 0);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  // Reset to p1 on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // ── Actions ──
  const handleSendReminder = async (id: string) => {
    setActionLoading(id + ':reminder');
    try {
      await abandonedCartsApi.sendReminder(id);
      toast.success('Reminder marked as sent');
      fetch();
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkRecovered = async (id: string) => {
    setActionLoading(id + ':recover');
    try {
      await abandonedCartsApi.update(id, { status: 'recovered' });
      toast.success('Cart marked as recovered');
      fetch();
    } catch {
      toast.error('Failed to update cart');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkExpired = async (id: string) => {
    setActionLoading(id + ':expire');
    try {
      await abandonedCartsApi.markExpired(id);
      toast.success('Cart marked as expired');
      fetch();
    } catch {
      toast.error('Failed to update cart');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this cart record?')) return;
    setActionLoading(id + ':delete');
    try {
      await abandonedCartsApi.delete(id);
      toast.success('Cart deleted');
      fetch();
    } catch {
      toast.error('Failed to delete cart');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Abandoned Carts"
        description="Customers who added your products but didn't complete checkout."
        icon={ShoppingCart}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Abandoned</p>
              <p className="text-3xl font-bold">{stats.totalCarts}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Potential Revenue</p>
              <p className="text-3xl font-bold text-orange-500">
                {fmt(stats.totalPotentialRevenue)}
              </p>
            </div>
            <IndianRupee className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Recovered Carts</p>
              <p className="text-3xl font-bold text-green-600">{stats.recoveredCarts}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Recovery Rate</p>
              <p className="text-3xl font-bold">{stats.recoveryRate}%</p>
            </div>
            <RefreshCw className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cart ID, email, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
            <SelectItem value="recovered">Recovered</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={fetch}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cart ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Cart Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : carts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    No abandoned carts found.
                  </TableCell>
                </TableRow>
              ) : (
                carts.map((cart) => {
                  const statusCfg = STATUS_CONFIG[cart.status];
                  const emailCfg = EMAIL_STATUS_CONFIG[cart.emailStatus];
                  const busy = (suffix: string) =>
                    actionLoading === `${cart.id}:${suffix}`;

                  return (
                    <TableRow key={cart.id}>
                      <TableCell className="font-mono text-xs">
                        #{cart.cartNumber.slice(0, 8).toUpperCase()}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{cart.customerName}</div>
                        <div className="text-xs text-muted-foreground">{cart.customerEmail}</div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {cart.customerPhone ?? '—'}
                      </TableCell>

                      <TableCell className="text-center">{cart.itemCount}</TableCell>

                      <TableCell className="text-right font-semibold">
                        {fmt(cart.cartValue)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </TableCell>

                      <TableCell>
                        <span className={`text-xs font-medium ${emailCfg.className}`}>
                          {emailCfg.label}
                        </span>
                        {cart.reminderSentAt && (
                          <div className="text-xs text-muted-foreground">
                            {fmtDate(cart.reminderSentAt)}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs">{fmtDate(cart.createdAt)}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setDetailCart(cart)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Cart
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={busy('reminder')}
                              onClick={() => handleSendReminder(cart.id)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              {busy('reminder') ? 'Sending…' : 'Send Reminder'}
                            </DropdownMenuItem>

                            {cart.status === 'abandoned' && (
                              <DropdownMenuItem
                                disabled={busy('recover')}
                                onClick={() => handleMarkRecovered(cart.id)}
                              >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                {busy('recover') ? 'Updating…' : 'Mark Recovered'}
                              </DropdownMenuItem>
                            )}

                            {cart.status !== 'expired' && (
                              <DropdownMenuItem
                                disabled={busy('expire')}
                                onClick={() => handleMarkExpired(cart.id)}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {busy('expire') ? 'Updating…' : 'Mark as Expired'}
                              </DropdownMenuItem>
                            )}

                            {cart.couponCode ? (
                              <DropdownMenuItem disabled>
                                <Tag className="mr-2 h-4 w-4" />
                                Coupon: {cart.couponCode}
                              </DropdownMenuItem>
                            ) : null}

                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={busy('delete')}
                              onClick={() => handleDelete(cart.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {busy('delete') ? 'Deleting…' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} entries
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={page === p ? 'default' : 'outline'}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <CartDetailDialog
        cart={detailCart}
        open={!!detailCart}
        onClose={() => setDetailCart(null)}
      />
    </div>
  );
}
