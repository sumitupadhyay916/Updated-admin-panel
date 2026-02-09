import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  className?: string;
}

export function Layout({ className }: LayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-950', className)}>
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:ml-64">
        <Header />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Compact layout for auth pages
export function AuthLayout({ className }: LayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900',
        className
      )}
    >
      <Outlet />
    </div>
  );
}
