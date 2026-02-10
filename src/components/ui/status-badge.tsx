import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'active' | 'inactive' | 'pending' | 'suspended' | 'rejected'
  | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  | 'paid' | 'failed' | 'refunded'
  | 'fulfilled' | 'unfulfilled' | 'partial'
  | 'open' | 'in_progress' | 'resolved' | 'closed'
  | 'low' | 'medium' | 'high' | 'urgent'
  | 'completed';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; label: string }> = {
  // User statuses
  active: { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Active' },
  inactive: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300', label: 'Inactive' },
  suspended: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300', label: 'Suspended' },
  pending: { variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700', label: 'Pending' },
  rejected: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300', label: 'Rejected' },
  
  // Order statuses
  confirmed: { variant: 'default', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300', label: 'Confirmed' },
  processing: { variant: 'outline', className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700', label: 'Processing' },
  shipped: { variant: 'default', className: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300', label: 'Shipped' },
  delivered: { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Delivered' },
  cancelled: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300', label: 'Cancelled' },
  returned: { variant: 'destructive', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300', label: 'Returned' },
  
  // Payment statuses
  paid: { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Paid' },
  failed: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300', label: 'Failed' },
  refunded: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300', label: 'Refunded' },
  
  // Fulfillment statuses
  fulfilled: { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Fulfilled' },
  unfulfilled: { variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700', label: 'Unfulfilled' },
  partial: { variant: 'outline', className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700', label: 'Partial' },
  
  // Query statuses
  in_progress: { variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700', label: 'In Progress' },
  resolved: { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Resolved' },
  closed: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300', label: 'Closed' },
  open: { variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700', label: 'Open' },
  
  // Priority levels
  low: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300', label: 'Low' },
  medium: { variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700', label: 'Medium' },
  high: { variant: 'outline', className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700', label: 'High' },
  urgent: { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300', label: 'Urgent' },
  
  // Payout statuses
  completed: { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Completed' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Handle undefined or null status
  if (!status) {
    return (
      <Badge
        variant="secondary"
        className={cn('bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', className)}
      >
        Unknown
      </Badge>
    );
  }

  const config = statusConfig[status.toLowerCase()] || {
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    label: status,
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
