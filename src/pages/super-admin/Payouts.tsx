import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { payoutsApi } from '@/services/api';
import type { Payout } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  Wallet,
  CheckCircle,
  XCircle,
  Eye,
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function PayoutsManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadPayouts = async () => {
      try {
        const response = await payoutsApi.getPayouts({ page: 1, limit: 100 });
        if (response.success && Array.isArray(response.data)) {
          setPayouts(response.data as Payout[]);
        } else {
          setPayouts([]);
        }
      } catch (error) {
        console.error('Failed to load payouts', error);
        setPayouts([]);
      }
    };

    void loadPayouts();
  }, []);

  const handleApprovePayout = async (payoutId: string) => {
    try {
      const response = await payoutsApi.processPayout(payoutId, { status: 'completed', notes, transactionId: undefined });
      if (response.success && response.data) {
        const updated = response.data as Payout;
        setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch (error) {
      console.error('Failed to approve payout', error);
    } finally {
      setIsProcessDialogOpen(false);
      setNotes('');
    }
  };

  const handleRejectPayout = async (payoutId: string) => {
    try {
      const response = await payoutsApi.processPayout(payoutId, { status: 'rejected', notes, transactionId: undefined });
      if (response.success && response.data) {
        const updated = response.data as Payout;
        setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch (error) {
      console.error('Failed to reject payout', error);
    } finally {
      setIsProcessDialogOpen(false);
      setNotes('');
    }
  };

  const openViewDialog = (payout: Payout) => {
    setSelectedPayout(payout);
    setIsViewDialogOpen(true);
  };

  const openProcessDialog = (payout: Payout) => {
    setSelectedPayout(payout);
    setIsProcessDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: ColumnDef<Payout>[] = useMemo(() => [
    {
      accessorKey: 'sellerName',
      header: 'Seller',
      cell: ({ row }: { row: { original: Payout } }) => {
        const payout = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {payout.sellerName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{payout.sellerName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{payout.paymentMethod}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: { row: { original: Payout } }) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(row.original.amount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Commission: {formatCurrency(row.original.commissionDeduction)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'finalAmount',
      header: 'Final Amount',
      cell: ({ row }: { row: { original: Payout } }) => (
        <p className="font-bold text-green-600 dark:text-green-400">
          {formatCurrency(row.original.finalAmount)}
        </p>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Payout } }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested',
      cell: ({ row }: { row: { original: Payout } }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.original.requestedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Payout } }) => {
        const payout = row.original;
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
              <DropdownMenuItem onClick={() => openViewDialog(payout)} className="dark:text-gray-300">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {payout.status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => openProcessDialog(payout)} className="text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProcessDialog(payout)} className="text-red-600">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const payoutStats = {
    total: payouts.length,
    pending: payouts.filter(p => p.status === 'pending').length,
    processing: payouts.filter(p => p.status === 'processing').length,
    completed: payouts.filter(p => p.status === 'completed').length,
    totalAmount: payouts.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.finalAmount, 0),
    pendingAmount: payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.finalAmount, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Management"
        description="Manage seller payouts and commissions"
        icon={Wallet}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Payouts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{payoutStats.total}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{payoutStats.pending}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{payoutStats.completed}</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(payoutStats.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(payoutStats.pendingAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payouts Table */}
      <Card className="dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={payouts}
            searchKey="sellerName"
            searchPlaceholder="Search payouts..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* View Payout Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Payout Details</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <span className="text-lg font-medium text-orange-600 dark:text-orange-400">
                    {selectedPayout.sellerName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPayout.sellerName}</p>
                  <StatusBadge status={selectedPayout.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Requested Amount</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(selectedPayout.amount)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Commission</p>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(selectedPayout.commissionDeduction)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedPayout.finalAmount)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPayout.paymentMethod}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPayout.accountDetails}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Requested</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedPayout.requestedAt).toLocaleString()}
                  </p>
                </div>
                {selectedPayout.processedAt && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Processed</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedPayout.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedPayout.transactionId && (
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</p>
                  <p className="font-medium text-blue-600 dark:text-blue-400">{selectedPayout.transactionId}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Process Payout</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Seller</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedPayout.sellerName}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount to Pay</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(selectedPayout.finalAmount)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this payout..."
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsProcessDialogOpen(false)}
                  className="dark:border-gray-700 dark:text-white"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectPayout(selectedPayout.id)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                  onClick={() => handleApprovePayout(selectedPayout.id)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
