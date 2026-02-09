import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import type { User, UserRole, SuperAdmin } from "@/types";
import { mockAdmins, mockSellers } from "@/services/mockData";

// Toggle this flag via env to switch between mock auth and real backend auth
// Defaults to real backend when not explicitly set
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      localStorage.removeItem("token");
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Generic API response type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  errors?: Array<{ field?: string; message: string }>;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================
// AUTH API
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// MOCK AUTH IMPLEMENTATION
// ============================================

const mockSuperAdmin: SuperAdmin = {
  id: "sa-001",
  email: "super@divine.com",
  name: "Super Admin",
  role: "super_admin",
  avatar:
    "https://api.dicebear.com/7.x/avataaars/svg?seed=super-admin",
  phone: "+91-9876543210",
  status: "active",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  permissions: [
    "manage_sellers",
    "manage_products",
    "manage_orders",
    "view_reports",
    "all",
  ],
};

type MockAuthUser = {
  email: string;
  password: string;
  role: UserRole;
  user: User;
};

const mockAuthUsers: MockAuthUser[] = [
  {
    email: "super@divine.com",
    password: "admin123",
    role: "super_admin",
    user: mockSuperAdmin,
  },
  {
    email: "admin@divine.com",
    password: "admin123",
    role: "admin",
    user: mockAdmins[0] as User,
  },
  {
    email: "seller@divine.com",
    password: "seller123",
    role: "seller",
    user: mockSellers[0] as User,
  },
];

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<{ user: unknown; token: string }>> => {
    if (USE_MOCK_AUTH) {
      const match = mockAuthUsers.find(
        (u) =>
          u.email === data.email &&
          u.password === data.password &&
          (!data.role || u.role === data.role),
      );

      if (!match) {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      const token = `mock-token-${match.user.id}`;
      localStorage.setItem("token", token);

      return {
        success: true,
        message: "Login successful",
        data: {
          user: match.user,
          token,
        },
      };
    }

    const response = await apiClient.post("/auth/login", data);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem("token", response.data.data.token);
    }
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<{ user: unknown; token: string }>> => {
    const response = await apiClient.post('/auth/register', data);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
  },
};

// ============================================
// USERS API
// ============================================

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  status?: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  status?: string;
  avatar?: string;
}

export const usersApi = {
  getUsers: async (params?: PaginationParams & { role?: string; status?: string }): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  toggleUserStatus: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/users/${id}/toggle-status`);
    return response.data;
  },
};

// ============================================
// SELLERS API
// ============================================

export interface CreateSellerRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  businessName: string;
  businessAddress: string;
  gstNumber?: string;
  commissionRate?: number;
  adminEmail: string;
}

export interface UpdateSellerRequest {
  businessName?: string;
  businessAddress?: string;
  gstNumber?: string;
  commissionRate?: number;
  status?: string;
  name?: string;
  phone?: string;
}

export const sellersApi = {
  getSellers: async (params?: PaginationParams & { status?: string }): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/sellers', { params });
    return response.data;
  },

  getSellerById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/sellers/${id}`);
    return response.data;
  },

  createSeller: async (data: CreateSellerRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/sellers', data);
    return response.data;
  },

  updateSeller: async (id: string, data: UpdateSellerRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/sellers/${id}`, data);
    return response.data;
  },

  deleteSeller: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/sellers/${id}`);
    return response.data;
  },

  toggleSellerStatus: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/sellers/${id}/toggle-status`);
    return response.data;
  },

  getSellerProducts: async (id: string, params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get(`/sellers/${id}/products`, { params });
    return response.data;
  },

  getSellerOrders: async (id: string, params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get(`/sellers/${id}/orders`, { params });
    return response.data;
  },

  getSellerPayouts: async (id: string, params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get(`/sellers/${id}/payouts`, { params });
    return response.data;
  },

  getSellerStats: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/sellers/${id}/stats`);
    return response.data;
  },
};

// ============================================
// PRODUCTS API
// ============================================

export interface CreateProductRequest {
  name: string;
  categoryId?: number;
  description?: string;
  price: number;
  stock?: 'available' | 'unavailable';
  sellerId?: string;
  // Optional fields for full product creation
  deity?: string;
  material?: string;
  height?: number;
  weight?: number;
  handcrafted?: boolean;
  occasion?: string[];
  religionCategory?: string;
  packagingType?: string;
  fragile?: boolean;
  comparePrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  images?: string[];
  tags?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  categoryId?: number;
  description?: string;
  price?: number;
  stock?: 'available' | 'unavailable';
  deity?: string;
  material?: string;
  height?: number;
  weight?: number;
  handcrafted?: boolean;
  occasion?: string[];
  religionCategory?: string;
  packagingType?: string;
  fragile?: boolean;
  comparePrice?: number;
  lowStockThreshold?: number;
  images?: string[];
  tags?: string[];
  isFeatured?: boolean;
}


export const productsApi = {
  getProducts: async (params?: PaginationParams & { 
    deity?: string; 
    material?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    status?: string;
    sellerId?: string;
    isFeatured?: boolean;
  }): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  updateProduct: async (id: string | number, data: UpdateProductRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string | number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  approveProduct: async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/products/${id}/approve`);
    return response.data;
  },

  rejectProduct: async (id: string | number, reason?: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/products/${id}/reject`, { reason });
    return response.data;
  },

  updateStock: async (id: string | number, stock: 'available' | 'unavailable'): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/products/${id}/stock`, { stock });
    return response.data;
  },

  getInventoryMovements: async (id: string | number): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get(`/products/${id}/inventory`);
    return response.data;
  },

  getLowStockProducts: async (params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/products/low-stock', { params });
    return response.data;
  },

  getPendingProducts: async (params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/products/pending', { params });
    return response.data;
  },
};

// ============================================
// ORDERS API
// ============================================

export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerId: string;
  shippingAddressId: string;
  billingAddressId: string;
  items: OrderItemRequest[];
  couponCode?: string;
  paymentMethod: string;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
  description?: string;
  trackingNumber?: string;
  carrier?: string;
}

export const ordersApi = {
  getOrders: async (params?: PaginationParams & { 
    status?: string; 
    paymentStatus?: string;
    sellerId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: CreateOrderRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  updateOrderStatus: async (id: string, data: UpdateOrderStatusRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.patch(`/orders/${id}/status`, data);
    return response.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  getOrderTimeline: async (id: string): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get(`/orders/${id}/timeline`);
    return response.data;
  },

  getRecentOrders: async (limit?: number): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/orders/recent', { params: { limit } });
    return response.data;
  },
};

// ============================================
// PAYOUTS API
// ============================================

export interface CreatePayoutRequest {
  sellerId: string;
  amount: number;
  paymentMethod: string;
  accountDetails: string;
}

export interface ProcessPayoutRequest {
  status: 'completed' | 'rejected';
  notes?: string;
  transactionId?: string;
}

export const payoutsApi = {
  getPayouts: async (params?: PaginationParams & { status?: string; sellerId?: string }): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/payouts', { params });
    return response.data;
  },

  getPayoutById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/payouts/${id}`);
    return response.data;
  },

  createPayout: async (data: CreatePayoutRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/payouts', data);
    return response.data;
  },

  processPayout: async (id: string, data: ProcessPayoutRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/payouts/${id}/process`, data);
    return response.data;
  },

  getPendingPayouts: async (params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/payouts/pending', { params });
    return response.data;
  },
};

// ============================================
// COUPONS API
// ============================================

export interface CreateCouponRequest {
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  applicableTo?: string;
  sellerIds?: string[];
  productIds?: string[];
}

export const couponsApi = {
  getCoupons: async (params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/coupons', { params });
    return response.data;
  },

  getCouponById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/coupons/${id}`);
    return response.data;
  },

  createCoupon: async (data: CreateCouponRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/coupons', data);
    return response.data;
  },

  updateCoupon: async (id: string, data: Partial<CreateCouponRequest>): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/coupons/${id}`, data);
    return response.data;
  },

  deleteCoupon: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/coupons/${id}`);
    return response.data;
  },

  toggleCouponStatus: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post(`/coupons/${id}/toggle`);
    return response.data;
  },

  validateCoupon: async (code: string, orderAmount: number): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/coupons/validate', { code, orderAmount });
    return response.data;
  },
};

// ============================================
// CATEGORIES API
// ============================================

export interface CreateCategoryRequest {
  name: string;
  status?: 'active' | 'inactive';
}

export interface UpdateCategoryRequest {
  name?: string;
  status?: 'active' | 'inactive';
}

export const categoriesApi = {
  getCategories: async (params?: PaginationParams): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/categories', { params });
    return response.data;
  },

  getCategoryById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};

// ============================================
// ADMIN CATEGORIES API
// ============================================

export const adminCategoriesApi = {
  getAdminCategories: async (adminId: string): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get(`/admin-categories/${adminId}`);
    return response.data;
  },

  assignCategoriesToAdmin: async (adminId: string, categoryIds: number[]): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.post(`/admin-categories/${adminId}`, { categoryIds });
    return response.data;
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardApi = {
  getSuperAdminDashboard: async (): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get('/dashboard/super-admin');
    return response.data;
  },

  getAdminDashboard: async (): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get('/dashboard/admin');
    return response.data;
  },

  getSellerDashboard: async (): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get('/dashboard/seller');
    return response.data;
  },

  getRevenueChart: async (period?: string): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/dashboard/charts/revenue', { params: { period } });
    return response.data;
  },

  getOrdersChart: async (period?: string): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/dashboard/charts/orders', { params: { period } });
    return response.data;
  },

  getCategoryChart: async (): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/dashboard/charts/categories');
    return response.data;
  },

  getRecentOrders: async (limit?: number): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/dashboard/widgets/recent-orders', { params: { limit } });
    return response.data;
  },

  getPendingProducts: async (limit?: number): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/dashboard/widgets/pending-products', { params: { limit } });
    return response.data;
  },

  getPendingPayouts: async (limit?: number): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/dashboard/widgets/pending-payouts', { params: { limit } });
    return response.data;
  },

  getOpenQueries: async (limit?: number): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/dashboard/widgets/open-queries', { params: { limit } });
    return response.data;
  },
};

// ============================================
// SUPPORT API
// ============================================

export interface UpdateSupportPageRequest {
  title?: string;
  content: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  category: string;
  order?: number;
}

export const supportApi = {
  // Support Pages
  getSupportPages: async (): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/support/pages');
    return response.data;
  },

  getSupportPageBySlug: async (slug: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/support/pages/${slug}`);
    return response.data;
  },

  updateSupportPage: async (slug: string, data: UpdateSupportPageRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/support/pages/${slug}`, data);
    return response.data;
  },

  // FAQs
  getFAQs: async (category?: string): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/support/faqs', { params: { category } });
    return response.data;
  },

  getFAQById: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get(`/support/faqs/${id}`);
    return response.data;
  },

  createFAQ: async (data: CreateFAQRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.post('/support/faqs', data);
    return response.data;
  },

  updateFAQ: async (id: string, data: CreateFAQRequest): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/support/faqs/${id}`, data);
    return response.data;
  },

  deleteFAQ: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/support/faqs/${id}`);
    return response.data;
  },

  // Platform Settings
  getPlatformSettings: async (): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get('/support/settings');
    return response.data;
  },

  updatePlatformSettings: async (data: unknown): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put('/support/settings', data);
    return response.data;
  },
};

export default apiClient;
