import type {
  User, Admin, Seller, Consumer, Product, Order,
  Payout, Coupon, ContactQuery, InventoryMovement,
  SupportPage, FAQ, DashboardStats, ChartData,
  PlatformSettings, OrderTimeline,
} from '@/types';

// ============================================
// MOCK ADMINS
// ============================================

export const mockAdmins: Admin[] = [
  {
    id: 'ad-001',
    email: 'admin@divine.com',
    name: 'Platform Admin',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    phone: '+91-9876543211',
    status: 'active',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    permissions: ['manage_sellers', 'manage_products', 'manage_orders', 'view_reports'],
    createdBy: 'sa-001',
  },
  {
    id: 'ad-002',
    email: 'admin2@divine.com',
    name: 'Rahul Sharma',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
    phone: '+91-9876543220',
    status: 'active',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    permissions: ['manage_sellers', 'manage_orders'],
    createdBy: 'sa-001',
  },
  {
    id: 'ad-003',
    email: 'admin3@divine.com',
    name: 'Priya Patel',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    phone: '+91-9876543221',
    status: 'suspended',
    createdAt: '2024-03-15',
    updatedAt: '2024-04-01',
    permissions: ['manage_sellers'],
    createdBy: 'sa-001',
  },
];

// ============================================
// MOCK SELLERS
// ============================================

export const mockSellers: Seller[] = [
  {
    id: 'se-001',
    email: 'seller@divine.com',
    name: 'Divine Creations',
    role: 'seller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller',
    phone: '+91-9876543212',
    status: 'active',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
    businessName: 'Divine Creations Pvt Ltd',
    businessAddress: '123 Craft Street, Jaipur, Rajasthan',
    gstNumber: '08ABCDE1234F1Z5',
    commissionRate: 15,
    totalEarnings: 125000,
    availableBalance: 45000,
    pendingBalance: 8000,
    createdBy: 'ad-001',
  },
  {
    id: 'se-002',
    email: 'seller2@divine.com',
    name: 'Sacred Arts',
    role: 'seller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller2',
    phone: '+91-9876543213',
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
    businessName: 'Sacred Arts & Crafts',
    businessAddress: '456 Temple Road, Varanasi, UP',
    gstNumber: '09FGHIJ5678K2Z6',
    commissionRate: 12,
    totalEarnings: 85000,
    availableBalance: 28000,
    pendingBalance: 5000,
    createdBy: 'sa-001',
  },
  {
    id: 'se-003',
    email: 'brass@divine.com',
    name: 'Brass Heritage',
    role: 'seller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brass',
    phone: '+91-9876543214',
    status: 'active',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    businessName: 'Brass Heritage Works',
    businessAddress: '789 Metal Market, Moradabad, UP',
    gstNumber: '09KLMNO9012P3Z7',
    commissionRate: 10,
    totalEarnings: 210000,
    availableBalance: 75000,
    pendingBalance: 12000,
    createdBy: 'ad-001',
  },
  {
    id: 'se-004',
    email: 'marble@divine.com',
    name: 'Marble Masters',
    role: 'seller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marble',
    phone: '+91-9876543215',
    status: 'inactive',
    createdAt: '2024-03-15',
    updatedAt: '2024-04-01',
    businessName: 'Marble Masters Jaipur',
    businessAddress: '321 Stone Street, Jaipur, Rajasthan',
    gstNumber: '08QRSTU3456V4Z8',
    commissionRate: 15,
    totalEarnings: 45000,
    availableBalance: 5000,
    pendingBalance: 2000,
    createdBy: 'ad-002',
  },
];

// ============================================
// MOCK CONSUMERS
// ============================================

export const mockConsumers: Consumer[] = [
  {
    id: 'cu-001',
    email: 'customer1@gmail.com',
    name: 'Amit Kumar',
    role: 'consumer',
    phone: '+91-9876543230',
    status: 'active',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-10',
    addresses: [
      {
        id: 'addr-001',
        userId: 'cu-001',
        type: 'home',
        street: '45 Green Valley, Sector 12',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        country: 'India',
        isDefault: true,
      },
    ],
  },
  {
    id: 'cu-002',
    email: 'customer2@gmail.com',
    name: 'Sunita Devi',
    role: 'consumer',
    phone: '+91-9876543231',
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20',
    addresses: [
      {
        id: 'addr-002',
        userId: 'cu-002',
        type: 'home',
        street: '78 Lake View Apartments',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
        isDefault: true,
      },
    ],
  },
  {
    id: 'cu-003',
    email: 'customer3@gmail.com',
    name: 'Rajesh Gupta',
    role: 'consumer',
    phone: '+91-9876543232',
    status: 'active',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05',
    addresses: [
      {
        id: 'addr-003',
        userId: 'cu-003',
        type: 'home',
        street: '23 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        country: 'India',
        isDefault: true,
      },
    ],
  },
];

// ============================================
// MOCK PRODUCTS
// ============================================

export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Brass Ganesha Idol - Blessing Pose',
    description: 'Beautiful handcrafted brass Ganesha idol in blessing pose. Perfect for home temple and gifts.',
    deity: 'Ganesh',
    material: 'Brass',
    height: 8,
    weight: 450,
    handcrafted: true,
    occasion: ['Puja', 'Diwali', 'Housewarming'],
    religionCategory: 'Hindu',
    packagingType: 'Velvet Box',
    fragile: false,
    price: 2499,
    comparePrice: 2999,
    stockQuantity: 25,
    lowStockThreshold: 5,
    images: ['https://images.unsplash.com/photo-1567593810070-7a3d471af022?w=400'],
    rating: 4.8,
    reviewCount: 124,
    sellerId: 'se-001',
    sellerName: 'Divine Creations',
    status: 'active',
    isFeatured: true,
    tags: ['ganesh', 'brass', 'handcrafted'],
    createdAt: '2024-02-05',
    updatedAt: '2024-04-01',
  },
  {
    id: 'prod-002',
    name: 'Marble Krishna with Flute',
    description: 'Exquisite white marble Krishna idol playing flute. Hand-painted details.',
    deity: 'Krishna',
    material: 'Marble',
    height: 12,
    weight: 1200,
    handcrafted: true,
    occasion: ['Puja', 'Festival', 'Wedding'],
    religionCategory: 'Hindu',
    packagingType: 'Wooden Case',
    fragile: true,
    price: 5499,
    comparePrice: 6499,
    stockQuantity: 8,
    lowStockThreshold: 3,
    images: ['https://images.unsplash.com/photo-1606293459339-fed7f6d4c6c0?w=400'],
    rating: 4.9,
    reviewCount: 89,
    sellerId: 'se-002',
    sellerName: 'Sacred Arts',
    status: 'active',
    isFeatured: true,
    tags: ['krishna', 'marble', 'flute'],
    createdAt: '2024-02-10',
    updatedAt: '2024-03-20',
  },
  {
    id: 'prod-003',
    name: 'Panchdhatu Shiva Lingam',
    description: 'Sacred Panchdhatu (five metal) Shiva Lingam for daily worship.',
    deity: 'Shiva',
    material: 'Panchdhatu',
    height: 6,
    weight: 800,
    handcrafted: true,
    occasion: ['Puja', 'Daily Worship'],
    religionCategory: 'Hindu',
    packagingType: 'Box',
    fragile: false,
    price: 1899,
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: ['https://images.unsplash.com/photo-1615796153287-98eacf0abb13?w=400'],
    rating: 4.7,
    reviewCount: 156,
    sellerId: 'se-003',
    sellerName: 'Brass Heritage',
    status: 'active',
    isFeatured: false,
    tags: ['shiva', 'lingam', 'panchdhatu'],
    createdAt: '2024-02-15',
    updatedAt: '2024-03-25',
  },
  {
    id: 'prod-004',
    name: 'Silver Lakshmi-Ganesh Pair',
    description: 'Pure silver Lakshmi and Ganesha idol pair for Diwali puja.',
    deity: 'Lakshmi',
    material: 'Silver',
    height: 4,
    weight: 150,
    handcrafted: true,
    occasion: ['Diwali', 'Puja', 'Corporate'],
    religionCategory: 'Hindu',
    packagingType: 'Gift Wrap',
    fragile: true,
    price: 8999,
    stockQuantity: 12,
    lowStockThreshold: 3,
    images: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400'],
    rating: 4.9,
    reviewCount: 67,
    sellerId: 'se-001',
    sellerName: 'Divine Creations',
    status: 'active',
    isFeatured: true,
    tags: ['lakshmi', 'ganesh', 'silver', 'diwali'],
    createdAt: '2024-02-20',
    updatedAt: '2024-04-05',
  },
  {
    id: 'prod-005',
    name: 'Wooden Hanuman Murti',
    description: 'Hand-carved teak wood Hanuman idol in blessing pose.',
    deity: 'Hanuman',
    material: 'Wood',
    height: 10,
    weight: 600,
    handcrafted: true,
    occasion: ['Puja', 'Tuesday Special'],
    religionCategory: 'Hindu',
    packagingType: 'Box',
    fragile: false,
    price: 3299,
    stockQuantity: 3,
    lowStockThreshold: 5,
    images: ['https://images.unsplash.com/photo-1604608672516-b0315e6f5b67?w=400'],
    rating: 4.6,
    reviewCount: 45,
    sellerId: 'se-002',
    sellerName: 'Sacred Arts',
    status: 'active',
    isFeatured: false,
    tags: ['hanuman', 'wood', 'handcarved'],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-30',
  },
  {
    id: 'prod-006',
    name: 'Resin Durga Maa Idol',
    description: 'Colorful resin Durga idol with detailed ornaments.',
    deity: 'Durga',
    material: 'Resin',
    height: 14,
    weight: 900,
    handcrafted: false,
    occasion: ['Festival', 'Navratri'],
    religionCategory: 'Hindu',
    packagingType: 'Box',
    fragile: true,
    price: 1899,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: ['https://images.unsplash.com/photo-1596263576921-2c0895853b6c?w=400'],
    rating: 4.5,
    reviewCount: 78,
    sellerId: 'se-004',
    sellerName: 'Marble Masters',
    status: 'pending',
    isFeatured: false,
    tags: ['durga', 'resin', 'colorful'],
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
  },
  {
    id: 'prod-007',
    name: 'Clay Ganesha - Eco Friendly',
    description: 'Eco-friendly clay Ganesha idol that dissolves in water.',
    deity: 'Ganesh',
    material: 'Clay',
    height: 9,
    weight: 300,
    handcrafted: true,
    occasion: ['Festival', 'Ganesh Chaturthi'],
    religionCategory: 'Hindu',
    packagingType: 'Standard',
    fragile: true,
    price: 599,
    stockQuantity: 100,
    lowStockThreshold: 20,
    images: ['https://images.unsplash.com/photo-1567593810070-7a3d471af022?w=400'],
    rating: 4.8,
    reviewCount: 234,
    sellerId: 'se-003',
    sellerName: 'Brass Heritage',
    status: 'active',
    isFeatured: true,
    tags: ['ganesh', 'clay', 'eco-friendly'],
    createdAt: '2024-03-15',
    updatedAt: '2024-04-10',
  },
  {
    id: 'prod-008',
    name: 'Copper Saraswati Idol',
    description: 'Pure copper Saraswati mata idol for students and artists.',
    deity: 'Saraswati',
    material: 'Copper',
    height: 7,
    weight: 550,
    handcrafted: true,
    occasion: ['Puja', 'Vasant Panchami'],
    religionCategory: 'Hindu',
    packagingType: 'Velvet Box',
    fragile: false,
    price: 2199,
    stockQuantity: 6,
    lowStockThreshold: 5,
    images: ['https://images.unsplash.com/photo-1615796153287-98eacf0abb13?w=400'],
    rating: 4.7,
    reviewCount: 56,
    sellerId: 'se-001',
    sellerName: 'Divine Creations',
    status: 'active',
    isFeatured: false,
    tags: ['saraswati', 'copper', 'education'],
    createdAt: '2024-03-20',
    updatedAt: '2024-04-05',
  },
];

// ============================================
// MOCK ORDERS
// ============================================

export const mockOrders: Order[] = [
  {
    id: 'ord-001',
    orderNumber: 'DM-2024-0001',
    customerId: 'cu-001',
    customerName: 'Amit Kumar',
    customerEmail: 'customer1@gmail.com',
    customerPhone: '+91-9876543230',
    shippingAddress: mockConsumers[0].addresses[0],
    billingAddress: mockConsumers[0].addresses[0],
    items: [
      {
        id: 'item-001',
        productId: 'prod-001',
        productName: 'Brass Ganesha Idol - Blessing Pose',
        productImage: 'https://images.unsplash.com/photo-1567593810070-7a3d471af022?w=400',
        deity: 'Ganesh',
        material: 'Brass',
        height: 8,
        weight: 450,
        packagingType: 'Velvet Box',
        fragile: false,
        quantity: 1,
        unitPrice: 2499,
        totalPrice: 2499,
        sellerId: 'se-001',
        sellerName: 'Divine Creations',
      },
    ],
    subtotal: 2499,
    taxAmount: 300,
    shippingAmount: 150,
    discountAmount: 0,
    totalAmount: 2949,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'UPI',
    fulfillmentStatus: 'fulfilled',
    trackingNumber: 'TRK123456789',
    carrier: 'Delhivery',
    sellerEarnings: 2124,
    platformCommission: 375,
    createdAt: '2024-03-15T10:30:00Z',
    updatedAt: '2024-03-18T14:20:00Z',
  },
  {
    id: 'ord-002',
    orderNumber: 'DM-2024-0002',
    customerId: 'cu-002',
    customerName: 'Sunita Devi',
    customerEmail: 'customer2@gmail.com',
    customerPhone: '+91-9876543231',
    shippingAddress: mockConsumers[1].addresses[0],
    billingAddress: mockConsumers[1].addresses[0],
    items: [
      {
        id: 'item-002',
        productId: 'prod-002',
        productName: 'Marble Krishna with Flute',
        productImage: 'https://images.unsplash.com/photo-1606293459339-fed7f6d4c6c0?w=400',
        deity: 'Krishna',
        material: 'Marble',
        height: 12,
        weight: 1200,
        packagingType: 'Wooden Case',
        fragile: true,
        quantity: 1,
        unitPrice: 5499,
        totalPrice: 5499,
        sellerId: 'se-002',
        sellerName: 'Sacred Arts',
      },
      {
        id: 'item-003',
        productId: 'prod-004',
        productName: 'Silver Lakshmi-Ganesh Pair',
        productImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
        deity: 'Lakshmi',
        material: 'Silver',
        height: 4,
        weight: 150,
        packagingType: 'Gift Wrap',
        fragile: true,
        quantity: 1,
        unitPrice: 8999,
        totalPrice: 8999,
        sellerId: 'se-001',
        sellerName: 'Divine Creations',
      },
    ],
    subtotal: 14498,
    taxAmount: 1740,
    shippingAmount: 0,
    discountAmount: 500,
    totalAmount: 15738,
    couponCode: 'DIWALI500',
    orderStatus: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'Credit Card',
    fulfillmentStatus: 'fulfilled',
    trackingNumber: 'TRK987654321',
    carrier: 'Blue Dart',
    sellerEarnings: 12023,
    platformCommission: 2215,
    createdAt: '2024-04-01T09:15:00Z',
    updatedAt: '2024-04-02T16:45:00Z',
  },
  {
    id: 'ord-003',
    orderNumber: 'DM-2024-0003',
    customerId: 'cu-003',
    customerName: 'Rajesh Gupta',
    customerEmail: 'customer3@gmail.com',
    customerPhone: '+91-9876543232',
    shippingAddress: mockConsumers[2].addresses[0],
    billingAddress: mockConsumers[2].addresses[0],
    items: [
      {
        id: 'item-004',
        productId: 'prod-003',
        productName: 'Panchdhatu Shiva Lingam',
        productImage: 'https://images.unsplash.com/photo-1615796153287-98eacf0abb13?w=400',
        deity: 'Shiva',
        material: 'Panchdhatu',
        height: 6,
        weight: 800,
        packagingType: 'Box',
        fragile: false,
        quantity: 2,
        unitPrice: 1899,
        totalPrice: 3798,
        sellerId: 'se-003',
        sellerName: 'Brass Heritage',
      },
    ],
    subtotal: 3798,
    taxAmount: 456,
    shippingAmount: 100,
    discountAmount: 0,
    totalAmount: 4354,
    orderStatus: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'Debit Card',
    fulfillmentStatus: 'unfulfilled',
    sellerEarnings: 3418,
    platformCommission: 380,
    createdAt: '2024-04-10T14:20:00Z',
    updatedAt: '2024-04-10T14:25:00Z',
  },
  {
    id: 'ord-004',
    orderNumber: 'DM-2024-0004',
    customerId: 'cu-001',
    customerName: 'Amit Kumar',
    customerEmail: 'customer1@gmail.com',
    customerPhone: '+91-9876543230',
    shippingAddress: mockConsumers[0].addresses[0],
    billingAddress: mockConsumers[0].addresses[0],
    items: [
      {
        id: 'item-005',
        productId: 'prod-007',
        productName: 'Clay Ganesha - Eco Friendly',
        productImage: 'https://images.unsplash.com/photo-1567593810070-7a3d471af022?w=400',
        deity: 'Ganesh',
        material: 'Clay',
        height: 9,
        weight: 300,
        packagingType: 'Standard',
        fragile: true,
        quantity: 5,
        unitPrice: 599,
        totalPrice: 2995,
        sellerId: 'se-003',
        sellerName: 'Brass Heritage',
      },
    ],
    subtotal: 2995,
    taxAmount: 359,
    shippingAmount: 0,
    discountAmount: 200,
    totalAmount: 3154,
    couponCode: 'ECO200',
    orderStatus: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'COD',
    fulfillmentStatus: 'unfulfilled',
    sellerEarnings: 2695,
    platformCommission: 300,
    createdAt: '2024-04-15T11:00:00Z',
    updatedAt: '2024-04-15T11:00:00Z',
  },
];

// ============================================
// MOCK ORDER TIMELINES
// ============================================

export const mockOrderTimelines: OrderTimeline[] = [
  {
    id: 'tl-001',
    orderId: 'ord-001',
    status: 'pending',
    description: 'Order placed successfully',
    createdBy: 'system',
    createdAt: '2024-03-15T10:30:00Z',
  },
  {
    id: 'tl-002',
    orderId: 'ord-001',
    status: 'confirmed',
    description: 'Order confirmed by seller',
    createdBy: 'se-001',
    createdAt: '2024-03-15T11:00:00Z',
  },
  {
    id: 'tl-003',
    orderId: 'ord-001',
    status: 'shipped',
    description: 'Order shipped via Delhivery',
    createdBy: 'se-001',
    createdAt: '2024-03-16T09:00:00Z',
  },
  {
    id: 'tl-004',
    orderId: 'ord-001',
    status: 'delivered',
    description: 'Order delivered successfully',
    createdBy: 'system',
    createdAt: '2024-03-18T14:20:00Z',
  },
];

// ============================================
// MOCK PAYOUTS
// ============================================

export const mockPayouts: Payout[] = [
  {
    id: 'pay-001',
    sellerId: 'se-001',
    sellerName: 'Divine Creations',
    amount: 25000,
    commissionDeduction: 3750,
    finalAmount: 21250,
    status: 'completed',
    paymentMethod: 'Bank Transfer',
    accountDetails: '****4521',
    transactionId: 'TXN789456123',
    requestedAt: '2024-03-20T10:00:00Z',
    processedAt: '2024-03-21T14:30:00Z',
    processedBy: 'sa-001',
  },
  {
    id: 'pay-002',
    sellerId: 'se-002',
    sellerName: 'Sacred Arts',
    amount: 18000,
    commissionDeduction: 2160,
    finalAmount: 15840,
    status: 'completed',
    paymentMethod: 'UPI',
    accountDetails: 'sacred@upi',
    transactionId: 'TXN789456124',
    requestedAt: '2024-03-25T09:00:00Z',
    processedAt: '2024-03-26T11:00:00Z',
    processedBy: 'ad-001',
  },
  {
    id: 'pay-003',
    sellerId: 'se-003',
    sellerName: 'Brass Heritage',
    amount: 35000,
    commissionDeduction: 3500,
    finalAmount: 31500,
    status: 'pending',
    paymentMethod: 'Bank Transfer',
    accountDetails: '****7894',
    requestedAt: '2024-04-12T16:00:00Z',
  },
  {
    id: 'pay-004',
    sellerId: 'se-001',
    sellerName: 'Divine Creations',
    amount: 15000,
    commissionDeduction: 2250,
    finalAmount: 12750,
    status: 'processing',
    paymentMethod: 'Bank Transfer',
    accountDetails: '****4521',
    requestedAt: '2024-04-14T10:30:00Z',
  },
];

// ============================================
// MOCK COUPONS
// ============================================

export const mockCoupons: Coupon[] = [
  {
    id: 'coup-001',
    code: 'DIWALI500',
    description: 'Diwali Special - Flat ₹500 off on orders above ₹5000',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 5000,
    maxDiscountAmount: 500,
    usageLimit: 100,
    usageCount: 45,
    startDate: '2024-10-01',
    endDate: '2024-11-15',
    applicableTo: 'all',
    isActive: true,
    createdBy: 'sa-001',
    createdAt: '2024-09-15',
  },
  {
    id: 'coup-002',
    code: 'ECO200',
    description: 'Eco-friendly products - ₹200 off',
    discountType: 'fixed',
    discountValue: 200,
    minOrderAmount: 1000,
    usageLimit: 50,
    usageCount: 12,
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    applicableTo: 'specific_products',
    productIds: ['prod-007'],
    isActive: true,
    createdBy: 'ad-001',
    createdAt: '2024-03-25',
  },
  {
    id: 'coup-003',
    code: 'BRASS15',
    description: '15% off on all brass items',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscountAmount: 1000,
    usageLimit: 200,
    usageCount: 89,
    startDate: '2024-04-01',
    endDate: '2024-04-30',
    applicableTo: 'specific_products',
    productIds: ['prod-001', 'prod-003'],
    isActive: true,
    createdBy: 'sa-001',
    createdAt: '2024-03-28',
  },
];

// ============================================
// MOCK CONTACT QUERIES
// ============================================

export const mockContactQueries: ContactQuery[] = [
  {
    id: 'query-001',
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '+91-9876543240',
    subject: 'Bulk order inquiry',
    message: 'I want to place a bulk order of 50 Ganesha idols for corporate gifting. Please provide pricing.',
    category: 'Bulk Order',
    status: 'open',
    priority: 'high',
    responses: [],
    createdAt: '2024-04-14T09:00:00Z',
    updatedAt: '2024-04-14T09:00:00Z',
  },
  {
    id: 'query-002',
    name: 'Anita Sharma',
    email: 'anita@example.com',
    subject: 'Product customization',
    message: 'Can I get a custom marble Krishna idol made? I need specific dimensions.',
    category: 'Customization',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'ad-001',
    responses: [
      {
        id: 'resp-001',
        queryId: 'query-002',
        message: 'Thank you for your inquiry. We can definitely help with custom orders. Please share the exact dimensions you need.',
        respondedBy: 'ad-001',
        respondedByName: 'Platform Admin',
        createdAt: '2024-04-13T14:00:00Z',
      },
    ],
    createdAt: '2024-04-12T11:30:00Z',
    updatedAt: '2024-04-13T14:00:00Z',
  },
  {
    id: 'query-003',
    name: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    subject: 'Return request',
    message: 'The product I received was damaged. I would like to return it.',
    category: 'Return',
    status: 'resolved',
    priority: 'urgent',
    assignedTo: 'ad-001',
    responses: [
      {
        id: 'resp-002',
        queryId: 'query-003',
        message: 'We apologize for the inconvenience. We have initiated a replacement for you.',
        respondedBy: 'ad-001',
        respondedByName: 'Platform Admin',
        createdAt: '2024-04-10T16:00:00Z',
      },
    ],
    createdAt: '2024-04-09T10:00:00Z',
    updatedAt: '2024-04-10T16:00:00Z',
  },
];

// ============================================
// MOCK INVENTORY MOVEMENTS
// ============================================

export const mockInventoryMovements: InventoryMovement[] = [
  {
    id: 'inv-001',
    productId: 'prod-001',
    productName: 'Brass Ganesha Idol - Blessing Pose',
    type: 'in',
    quantity: 30,
    previousStock: 0,
    newStock: 30,
    reason: 'Initial stock',
    createdBy: 'se-001',
    createdAt: '2024-02-05T10:00:00Z',
  },
  {
    id: 'inv-002',
    productId: 'prod-001',
    productName: 'Brass Ganesha Idol - Blessing Pose',
    type: 'out',
    quantity: 5,
    previousStock: 30,
    newStock: 25,
    reason: 'Order fulfillment',
    notes: 'Order #DM-2024-0001',
    createdBy: 'system',
    createdAt: '2024-03-15T11:00:00Z',
  },
  {
    id: 'inv-003',
    productId: 'prod-002',
    productName: 'Marble Krishna with Flute',
    type: 'in',
    quantity: 15,
    previousStock: 0,
    newStock: 15,
    reason: 'Restock',
    createdBy: 'se-002',
    createdAt: '2024-03-25T09:00:00Z',
  },
  {
    id: 'inv-004',
    productId: 'prod-002',
    productName: 'Marble Krishna with Flute',
    type: 'out',
    quantity: 7,
    previousStock: 15,
    newStock: 8,
    reason: 'Order fulfillment',
    notes: 'Multiple orders',
    createdBy: 'system',
    createdAt: '2024-04-01T10:00:00Z',
  },
];

// ============================================
// MOCK SUPPORT PAGES
// ============================================

export const mockSupportPages: SupportPage[] = [
  {
    id: 'sp-001',
    slug: 'help-center',
    title: 'Help Center',
    content: `
# Help Center

Welcome to Divine Marketplace Help Center. We're here to assist you with any questions or concerns.

## Getting Started
- How to create an account
- Browsing products
- Placing an order
- Payment options

## For Sellers
- How to become a seller
- Listing products
- Managing inventory
- Understanding payouts

## Contact Us
If you can't find what you're looking for, please reach out to our support team at support@divinemarketplace.com
    `,
    lastUpdated: '2024-04-01',
    updatedBy: 'sa-001',
  },
  {
    id: 'sp-002',
    slug: 'faqs',
    title: 'Frequently Asked Questions',
    content: `
# Frequently Asked Questions

## General Questions

**Q: What is Divine Marketplace?**
A: Divine Marketplace is India's premier online platform for authentic spiritual products, God idols, and religious artifacts.

**Q: Are the products authentic?**
A: Yes, all products are sourced directly from verified artisans and sellers across India.

**Q: Do you offer international shipping?**
A: Currently, we only ship within India. International shipping coming soon!

## Order & Shipping

**Q: How long does shipping take?**
A: Most orders are delivered within 5-7 business days.

**Q: What if my product arrives damaged?**
A: We have a hassle-free return policy. Contact us within 48 hours of delivery.

## Returns & Refunds

**Q: What is your return policy?**
A: We accept returns within 7 days of delivery for damaged or defective items.

**Q: How long do refunds take?**
A: Refunds are processed within 5-7 business days after approval.
    `,
    lastUpdated: '2024-03-15',
    updatedBy: 'ad-001',
  },
  {
    id: 'sp-003',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `
# Privacy Policy

Last updated: April 1, 2024

## Introduction

Divine Marketplace respects your privacy and is committed to protecting your personal data.

## Information We Collect

- Personal identification information (Name, email address, phone number)
- Address information for shipping
- Payment information (processed securely through our payment partners)
- Order history and preferences

## How We Use Your Information

- To process and fulfill your orders
- To communicate about your orders and account
- To improve our products and services
- To send promotional offers (with your consent)

## Data Security

We implement appropriate security measures to protect your personal information.

## Your Rights

You have the right to access, correct, or delete your personal information.

## Contact Us

For privacy-related queries, contact us at privacy@divinemarketplace.com
    `,
    lastUpdated: '2024-04-01',
    updatedBy: 'sa-001',
  },
  {
    id: 'sp-004',
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    content: `
# Terms & Conditions

Last updated: April 1, 2024

## 1. Acceptance of Terms

By accessing and using Divine Marketplace, you accept and agree to be bound by these Terms.

## 2. User Accounts

- You must provide accurate and complete information
- You are responsible for maintaining account security
- You must be 18 years or older to use our services

## 3. Products & Pricing

- All prices are in Indian Rupees (INR)
- Prices are subject to change without notice
- We reserve the right to discontinue products

## 4. Orders & Payment

- Orders are subject to availability
- Full payment is required at the time of order
- We accept UPI, Credit/Debit cards, and Net Banking

## 5. Shipping & Delivery

- Delivery times are estimates only
- Risk of loss transfers upon delivery
- Shipping charges may apply

## 6. Returns & Refunds

- Returns accepted within 7 days for damaged items
- Refunds processed within 5-7 business days
- Original packaging required for returns

## 7. Seller Terms

- Sellers must provide accurate product information
- Commission rates as agreed in seller agreement
- Payouts processed as per schedule

## 8. Limitation of Liability

Divine Marketplace liability is limited to the purchase price of products.

## 9. Governing Law

These terms are governed by the laws of India.

## 10. Contact

For any queries, contact legal@divinemarketplace.com
    `,
    lastUpdated: '2024-04-01',
    updatedBy: 'sa-001',
  },
];

// ============================================
// MOCK FAQS
// ============================================

export const mockFAQs: FAQ[] = [
  {
    id: 'faq-001',
    question: 'How do I track my order?',
    answer: 'You can track your order by logging into your account and visiting the "My Orders" section. Click on the order to see tracking details.',
    category: 'Orders',
    order: 1,
    isActive: true,
  },
  {
    id: 'faq-002',
    question: 'What payment methods do you accept?',
    answer: 'We accept UPI, Credit/Debit cards, Net Banking, Cash on Delivery (COD), and popular wallets like PayTM and PhonePe.',
    category: 'Payment',
    order: 2,
    isActive: true,
  },
  {
    id: 'faq-003',
    question: 'How can I become a seller?',
    answer: 'To become a seller, click on "Sell with Us" and fill out the registration form. Our team will review your application within 2-3 business days.',
    category: 'Selling',
    order: 3,
    isActive: true,
  },
  {
    id: 'faq-004',
    question: 'Are the idols blessed?',
    answer: 'Our idols are crafted with devotion by skilled artisans. While we don\'t perform religious ceremonies, the products are made with traditional methods and prayers.',
    category: 'Products',
    order: 4,
    isActive: true,
  },
  {
    id: 'faq-005',
    question: 'Do you offer custom-made idols?',
    answer: 'Yes, many of our sellers offer customization. Contact the seller directly or reach out to our support team for custom orders.',
    category: 'Products',
    order: 5,
    isActive: true,
  },
];

// ============================================
// MOCK PLATFORM SETTINGS
// ============================================

export const mockPlatformSettings: PlatformSettings = {
  platformName: 'Divine Marketplace',
  platformLogo: '/logo.png',
  supportEmail: 'support@divinemarketplace.com',
  supportPhone: '+91-1800-123-4567',
  defaultCommissionRate: 15,
  minPayoutAmount: 1000,
  currency: 'INR',
  timezone: 'Asia/Kolkata',
};

// ============================================
// MOCK DASHBOARD STATS
// ============================================

export const mockDashboardStats: DashboardStats = {
  totalRevenue: 2450000,
  totalOrders: 1250,
  totalProducts: 450,
  totalCustomers: 890,
  totalSellers: 45,
  pendingOrders: 28,
  lowStockProducts: 15,
  pendingPayouts: 8,
  openQueries: 12,
  revenueChange: 12.5,
  ordersChange: 8.3,
  customersChange: 15.2,
};

// ============================================
// MOCK CHART DATA
// ============================================

export const mockRevenueChartData: ChartData[] = [
  { name: 'Jan', revenue: 180000, commission: 27000 },
  { name: 'Feb', revenue: 220000, commission: 33000 },
  { name: 'Mar', revenue: 195000, commission: 29250 },
  { name: 'Apr', revenue: 280000, commission: 42000 },
  { name: 'May', revenue: 310000, commission: 46500 },
  { name: 'Jun', revenue: 295000, commission: 44250 },
  { name: 'Jul', revenue: 340000, commission: 51000 },
  { name: 'Aug', revenue: 365000, commission: 54750 },
  { name: 'Sep', revenue: 320000, commission: 48000 },
  { name: 'Oct', revenue: 380000, commission: 57000 },
  { name: 'Nov', revenue: 420000, commission: 63000 },
  { name: 'Dec', revenue: 450000, commission: 67500 },
];

export const mockOrdersChartData: ChartData[] = [
  { name: 'Jan', orders: 85 },
  { name: 'Feb', orders: 102 },
  { name: 'Mar', orders: 95 },
  { name: 'Apr', orders: 120 },
  { name: 'May', orders: 135 },
  { name: 'Jun', orders: 128 },
  { name: 'Jul', orders: 145 },
  { name: 'Aug', orders: 158 },
  { name: 'Sep', orders: 142 },
  { name: 'Oct', orders: 165 },
  { name: 'Nov', orders: 180 },
  { name: 'Dec', orders: 195 },
];

export const mockCategoryChartData: ChartData[] = [
  { name: 'Ganesh', value: 35 },
  { name: 'Krishna', value: 25 },
  { name: 'Shiva', value: 20 },
  { name: 'Durga', value: 12 },
  { name: 'Others', value: 8 },
];

// ============================================
// API SERVICE FUNCTIONS
// ============================================

// User Services
export const getUsersByRole = (role: string): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (role === 'admin') resolve(mockAdmins);
      else if (role === 'seller') resolve(mockSellers);
      else if (role === 'consumer') resolve(mockConsumers);
      else resolve([]);
    }, 300);
  });
};

export const getUserById = (id: string): Promise<User | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allUsers = [...mockAdmins, ...mockSellers, ...mockConsumers];
      resolve(allUsers.find(u => u.id === id));
    }, 200);
  });
};

// Product Services
export const getProducts = (filters?: { sellerId?: string; status?: string }): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let products = [...mockProducts];
      if (filters?.sellerId) {
        products = products.filter(p => p.sellerId === filters.sellerId);
      }
      if (filters?.status) {
        products = products.filter(p => p.status === filters.status);
      }
      resolve(products);
    }, 300);
  });
};

export const getProductById = (id: string): Promise<Product | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockProducts.find(p => p.id === id));
    }, 200);
  });
};

// Order Services
export const getOrders = (filters?: { sellerId?: string; customerId?: string }): Promise<Order[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = [...mockOrders];
      if (filters?.sellerId) {
        orders = orders.filter(o => o.items.some(i => i.sellerId === filters.sellerId));
      }
      if (filters?.customerId) {
        orders = orders.filter(o => o.customerId === filters.customerId);
      }
      resolve(orders);
    }, 300);
  });
};

export const getOrderById = (id: string): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockOrders.find(o => o.id === id));
    }, 200);
  });
};

// Payout Services
export const getPayouts = (filters?: { sellerId?: string; status?: string }): Promise<Payout[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let payouts = [...mockPayouts];
      if (filters?.sellerId) {
        payouts = payouts.filter(p => p.sellerId === filters.sellerId);
      }
      if (filters?.status) {
        payouts = payouts.filter(p => p.status === filters.status);
      }
      resolve(payouts);
    }, 300);
  });
};

// Support Page Services
export const getSupportPages = (): Promise<SupportPage[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockSupportPages]), 200);
  });
};

export const getSupportPageBySlug = (slug: string): Promise<SupportPage | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockSupportPages.find(p => p.slug === slug)), 200);
  });
};

export const updateSupportPage = (slug: string, content: string, updatedBy: string): Promise<SupportPage> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const page = mockSupportPages.find(p => p.slug === slug);
      if (page) {
        page.content = content;
        page.lastUpdated = new Date().toISOString().split('T')[0];
        page.updatedBy = updatedBy;
        resolve(page);
      }
    }, 300);
  });
};

// Dashboard Stats
export const getDashboardStats = (): Promise<DashboardStats> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...mockDashboardStats }), 300);
  });
};

// Chart Data
export const getRevenueChartData = (): Promise<ChartData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockRevenueChartData]), 300);
  });
};

export const getOrdersChartData = (): Promise<ChartData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockOrdersChartData]), 300);
  });
};

export const getCategoryChartData = (): Promise<ChartData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockCategoryChartData]), 300);
  });
};
