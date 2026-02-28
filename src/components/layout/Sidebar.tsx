import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore, useRole } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  Warehouse,
  BarChart3,
  Wallet,
  Ticket,
  MessageSquare,
  Settings,
  FileText,
  LogOut,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  HelpCircle,
  Shield,
  BookOpen,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  permissions?: string[];
  children?: NavItem[];
}

// Super Admin Navigation
const superAdminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard, roles: ['super_admin'] },
  {
    label: 'Admin Management',
    href: '/super-admin/admins',
    icon: Shield,
    roles: ['super_admin'],
  },
  {
    label: 'Seller Management',
    href: '/super-admin/sellers',
    icon: Store,
    roles: ['super_admin'],
  },
  {
    label: 'Products',
    href: '/super-admin/products',
    icon: Package,
    roles: ['super_admin'],
  },
  {
    label: 'My Products',
    href: '/super-admin/my-products',
    icon: Package,
    roles: ['super_admin'],
  },
  {
    label: 'Orders',
    href: '/super-admin/orders',
    icon: ShoppingCart,
    roles: ['super_admin'],
  },
  {
    label: 'Categories',
    href: '/super-admin/categories',
    icon: Warehouse,
    roles: ['super_admin'],
  },
  // {
  //   label: 'Sales Reports',
  //   href: '/super-admin/reports',
  //   icon: BarChart3,
  //   roles: ['super_admin'],
  // },
  {
    label: 'Payout Management',
    href: '/super-admin/payouts',
    icon: Wallet,
    roles: ['super_admin'],
  },
  // {
  //   label: 'Coupons',
  //   href: '/super-admin/coupons',
  //   icon: Ticket,
  //   roles: ['super_admin'],
  // },
  {
    label: 'Contact Queries',
    href: '/super-admin/queries',
    icon: MessageSquare,
    roles: ['super_admin'],
  },
];

// Admin Navigation
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
  {
    label: 'Seller Management',
    href: '/admin/sellers',
    icon: Store,
    roles: ['admin'],
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    roles: ['admin'],
  },
  {
    label: 'My Products',
    href: '/admin/my-products',
    icon: Package,
    roles: ['admin'],
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    roles: ['admin'],
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: Warehouse,
    roles: ['admin'],
  },
  // {
  //   label: 'Sales Reports',
  //   href: '/admin/reports',
  //   icon: BarChart3,
  //   roles: ['admin'],
  // },
  {
    label: 'Payouts',
    href: '/admin/payouts',
    icon: Wallet,
    roles: ['admin'],
  },
  {
    label: 'Coupons',
    href: '/admin/coupons',
    icon: Ticket,
    roles: ['admin'],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['admin'],
    children: [

      { label: 'FAQs', href: '/admin/support-pages/faqs', icon: HelpCircle, roles: ['admin'] },
      { label: 'Privacy Policy', href: '/admin/support-pages/privacy-policy', icon: Shield, roles: ['admin'] },
      { label: 'Terms & Conditions', href: '/admin/support-pages/terms-conditions', icon: FileText, roles: ['admin'] },
    ],
  },
];

// Seller Navigation
const sellerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/seller', icon: LayoutDashboard, roles: ['seller', 'staff'] },
  {
    label: 'My Products',
    href: '/seller/products',
    icon: Package,
    roles: ['seller', 'staff'],
    permissions: ['manage_products'],
  },
  {
    label: 'Inventory',
    href: '/seller/inventory',
    icon: Warehouse,
    roles: ['seller', 'staff'],
    permissions: ['manage_inventory'],
  },
  {
    label: 'My Orders',
    href: '/seller/orders',
    icon: ShoppingCart,
    roles: ['seller', 'staff'],
    permissions: ['manage_orders'],
  },
  {
    label: 'Abandoned Carts',
    href: '/seller/abandoned-carts',
    icon: ShoppingCart,
    roles: ['seller', 'staff'],
    permissions: ['manage_orders'],
  },
  {
    label: 'My Staff',
    href: '/seller/staff',
    icon: Users,
    roles: ['seller', 'staff'],
    permissions: ['manage_staff'],
  },
  {
    label: 'My Payouts',
    href: '/seller/payouts',
    icon: Wallet,
    roles: ['seller'],
  },
  {
    label: 'Coupons',
    href: '/seller/coupons',
    icon: Ticket,
    roles: ['seller', 'staff'],
    permissions: ['manage_coupons'],
    children: [
      { label: 'List Coupon', href: '/seller/coupons', icon: Ticket, roles: ['seller', 'staff'], permissions: ['manage_coupons'] },
      { label: 'Create Coupon ', href: '/seller/coupons/create', icon: ShoppingCart, roles: ['seller', 'staff'], permissions: ['manage_coupons'] },
    ],
  },
  {
    label: 'Settings',
    href: '/seller/settings',
    icon: Settings,
    roles: ['seller', 'staff'],
    permissions: ['manage_settings'],
    children: [
      { label: 'FAQs', href: '/seller/settings/faqs', icon: HelpCircle, roles: ['seller', 'staff'], permissions: ['manage_settings'] },
      { label: 'Privacy Policy', href: '/seller/settings/privacy-policy', icon: Shield, roles: ['seller', 'staff'], permissions: ['manage_settings'] },
      { label: 'Terms & Conditions', href: '/seller/settings/terms-conditions', icon: FileText, roles: ['seller', 'staff'], permissions: ['manage_settings'] },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between px-4 py-2 text-sm font-medium transition-colors',
              isActive && 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
              !isActive && 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            )}
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2 dark:border-gray-700">
            {item.children?.map((child) => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link to={item.href}>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start px-4 py-2 text-sm font-medium transition-colors',
          isActive && 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
          !isActive && 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
        )}
      >
        <span className="flex items-center gap-3">
          <item.icon className="h-4 w-4" />
          {item.label}
        </span>
      </Button>
    </Link>
  );
}

function SidebarContent() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isSuperAdmin, isAdmin, isSeller, isStaff } = useRole();

  const userPermissions = (user as any)?.permissions || (user as any)?.staffProfile?.permissions || [];

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.map(item => ({ ...item })).filter(item => {
      // 1. Check Role
      if (!item.roles.includes(user?.role || '')) return false;
      
      // 2. Check Permissions for Staff
      if (user?.role === 'staff' && item.permissions) {
         if (!item.permissions.some(p => userPermissions.includes(p)) && !userPermissions.includes('all')) {
           return false;
         }
      }
      
      // Filter children
      if (item.children) {
        item.children = filterNavItems(item.children);
        if (item.children.length === 0) return false;
      }
      return true;
    });
  };

  const baseItems = isSuperAdmin
    ? superAdminNavItems
    : isAdmin
      ? adminNavItems
      : (isSeller || isStaff)
        ? sellerNavItems
        : [];

  const navItems = filterNavItems(baseItems);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6 dark:border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
            <span className="text-lg font-bold text-white">D</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            Divine<span className="text-orange-500">Market</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 dark:border-gray-800">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <img
            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            alt={user?.name}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="flex-1"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-[2] justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-white lg:block dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
