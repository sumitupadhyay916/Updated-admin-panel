// ============================================
// ROLE & USER TYPES
// ============================================

export type UserRole = 'super_admin' | 'admin' | 'seller' | 'consumer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdmin extends User {
  role: 'super_admin';
  permissions: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
  createdBy: string;
}

export interface Seller extends User {
  role: 'seller';
  businessName: string;
  businessAddress: string;
  gstNumber?: string;
  commissionRate: number;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  createdBy: string;
  admin?: {
    id: string;
    name: string;
    email: string;
  };
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface Consumer extends User {
  role: 'consumer';
  addresses: Address[];
}

// ============================================
// ADDRESS & LOCATION
// ============================================

export interface Address {
  id: string;
  userId: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

// ============================================
// PRODUCT TYPES
// ============================================

export type Deity = 'Ganesh' | 'Krishna' | 'Shiva' | 'Durga' | 'Lakshmi' | 'Saraswati' | 'Hanuman' | 'Ram' | 'Vishnu' | 'Kali' | 'Other';
export type Material = 'Brass' | 'Marble' | 'Resin' | 'Clay' | 'Silver' | 'Wood' | 'Gold' | 'Panchdhatu' | 'Copper';
export type ReligionCategory = 'Hindu' | 'Buddhist' | 'Jain' | 'Sikh' | 'Universal';
export type PackagingType = 'Box' | 'Velvet Box' | 'Wooden Case' | 'Gift Wrap' | 'Standard';
export type Occasion = 'Diwali' | 'Puja' | 'Wedding' | 'Festival' | 'Housewarming' | 'Birthday' | 'Anniversary' | 'Corporate' | 'Daily Worship' | 'Tuesday Special' | 'Navratri' | 'Ganesh Chaturthi' | 'Vasant Panchami';

export interface Category {
  id: number;
  cid: string;
  name: string;
  status: 'active' | 'inactive';
  noOfProducts: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  pid: string;
  name: string;
  description: string;
  deity: Deity;
  material: Material;
  height: number;
  weight: number;
  handcrafted: boolean;
  occasion: Occasion[];
  religionCategory: ReligionCategory;
  packagingType: PackagingType;
  fragile: boolean;
  price: number;
  comparePrice?: number;
  stock: 'available' | 'unavailable';
  lowStockThreshold: number;
  images: string[];
  reviewCount: number;
  sellerId: string;
  sellerName: string;
  categoryId: number;
  categoryName: string;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// INVENTORY TYPES
// ============================================

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  deity: Deity;
  material: Material;
  height: number;
  weight: number;
  packagingType: PackagingType;
  fragile: boolean;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sellerId: string;
  sellerName: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  internalNotes?: string;
  sellerEarnings: number;
  platformCommission: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTimeline {
  id: string;
  orderId: string;
  status: OrderStatus;
  description: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// PAYOUT TYPES
// ============================================

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Payout {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  commissionDeduction: number;
  finalAmount: number;
  status: PayoutStatus;
  paymentMethod: string;
  accountDetails: string;
  transactionId?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

// ============================================
// COUPON TYPES
// ============================================

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  applicableTo: 'all' | 'specific_sellers' | 'specific_products';
  sellerIds?: string[];
  productIds?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// ============================================
// REPORT TYPES
// ============================================

export interface SalesReport {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalSellerEarnings: number;
  averageOrderValue: number;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  topSellers: { sellerId: string; sellerName: string; orders: number; revenue: number }[];
}

export interface CommissionReport {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  totalOrders: number;
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
  period: string;
}

// ============================================
// CONTACT QUERY TYPES
// ============================================

export type QueryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type QueryPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ContactQuery {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: string;
  status: QueryStatus;
  priority: QueryPriority;
  assignedTo?: string;
  responses: QueryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface QueryResponse {
  id: string;
  queryId: string;
  message: string;
  respondedBy: string;
  respondedByName: string;
  createdAt: string;
}

// ============================================
// SUPPORT PAGE TYPES
// ============================================

export interface SupportPage {
  id: string;
  slug: 'help-center' | 'faqs' | 'privacy-policy' | 'terms-conditions';
  title: string;
  content: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalSellers: number;
  totalAdmins: number;
  pendingOrders: number;
  lowStockProducts: number;
  pendingPayouts: number;
  openQueries: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
}

export interface ChartData {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// NAVIGATION TYPES
// ============================================

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface PlatformSettings {
  platformName: string;
  platformLogo?: string;
  supportEmail: string;
  supportPhone: string;
  defaultCommissionRate: number;
  minPayoutAmount: number;
  currency: string;
  timezone: string;
}
