# Divine Marketplace Frontend

A modern React + TypeScript + Tailwind CSS frontend for the Multi-Role E-Commerce Marketplace for God Idols and Spiritual Products.

## Features

- **Multi-Role Dashboards**: Separate interfaces for Super Admin, Admin, and Seller
- **Product Management**: Full CRUD for God Idols with deity, material, and dimension attributes
- **Order Management**: Track orders with status updates and timeline
- **Seller Management**: Onboard and manage sellers with commission tracking
- **Payout System**: Handle seller payout requests
- **Support Pages**: Editable Help Center, FAQs, Privacy Policy, Terms & Conditions
- **Dark Mode**: Full dark mode support with theme persistence
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Data Tables**: Sortable, searchable tables with pagination

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **State Management**: Zustand (with persistence)
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Icons**: Lucide React
- **Notifications**: Sonner

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── shared/       # Custom shared components
│   ├── pages/
│   │   ├── super-admin/  # Super Admin pages
│   │   ├── admin/        # Admin pages
│   │   ├── seller/       # Seller pages
│   │   └── auth/         # Login pages
│   ├── store/
│   │   ├── authStore.ts  # Authentication state
│   │   └── themeStore.ts # Theme/dark mode state
│   ├── services/
│   │   ├── api.ts        # API client and endpoints
│   │   └── mockData.ts   # Mock data (fallback)
│   ├── hooks/
│   │   └── useAuth.ts    # Authentication hooks
│   ├── types/
│   │   └── index.ts      # TypeScript types
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | super@divine.com | admin123 |
| Admin | admin@divine.com | admin123 |
| Seller | seller@divine.com | seller123 |

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Key Components

### Dashboard Layout
- `Sidebar` - Role-based navigation menu
- `Header` - Top bar with user info, notifications, theme toggle
- `StatCard` - Dashboard statistics cards
- `DataTable` - Reusable table with sorting, filtering, pagination

### Pages by Role

#### Super Admin
- Dashboard with platform-wide analytics
- Admin Management (create, edit admins)
- Seller Management
- All Products & Orders
- Payout Management
- Coupon Management
- Support Pages & FAQs
- Platform Settings

#### Admin
- Dashboard with operational metrics
- Seller Management
- Product Approval
- Order Management
- Payout Processing
- Support Queries

#### Seller
- Dashboard with personal analytics
- My Products (CRUD)
- My Orders
- Payout Requests
- Earnings Overview

## API Integration

The frontend connects to the backend API. Configure the API URL in `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### API Services

All API calls are organized in `src/services/api.ts`:

- `authApi` - Authentication (login, register, profile)
- `usersApi` - User management
- `sellersApi` - Seller management
- `productsApi` - Product CRUD
- `ordersApi` - Order management
- `payoutsApi` - Payout requests
- `couponsApi` - Coupon management
- `dashboardApi` - Dashboard data
- `supportApi` - Support pages and FAQs

## State Management

### Auth Store (Zustand)
```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

### Theme Store (Zustand)
```typescript
const { theme, setTheme } = useThemeStore();
```

### Role Hooks
```typescript
const { isSuperAdmin, isAdmin, isSeller } = useRole();
const canManageUsers = usePermission('manage_users');
```

## Customization

### Adding New Deity Types
Edit the deity enum in both backend and frontend:
- Backend: `prisma/schema.prisma`
- Frontend: `src/types/index.ts`

### Adding New Materials
Same process as deities - update the Material enum in both places.

### Theming
The app uses CSS variables for theming. Edit:
- `src/index.css` - CSS variables
- `tailwind.config.js` - Tailwind theme extensions

## Dark Mode

Dark mode is fully supported and persists across sessions:
- Toggle in the header
- Uses `next-themes` for theme management
- All components have dark variants

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

The sidebar collapses to a hamburger menu on mobile.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |
| `VITE_APP_NAME` | App name | Divine Marketplace |
| `VITE_APP_VERSION` | App version | 1.0.0 |

## License

MIT
