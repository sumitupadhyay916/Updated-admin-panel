import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  badgeVariant = 'default',
  backHref,
  backLabel = 'Back',
  actions,
  icon: Icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 space-y-4', className)}>
      {backHref && (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <Link to={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
                <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {title}
              </h1>
              {badge && (
                <Badge variant={badgeVariant} className="mt-2">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
