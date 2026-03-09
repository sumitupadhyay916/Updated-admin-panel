import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  onClick,
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
        onClick && 'cursor-pointer hover:border-orange-300 dark:hover:border-orange-700',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
          <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        
        {description && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact stat card for smaller spaces
interface CompactStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

export function CompactStatCard({ title, value, icon: Icon, className }: CompactStatCardProps) {
  return (
    <Card className={cn('dark:border-gray-700 dark:bg-gray-800', className)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
          <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
