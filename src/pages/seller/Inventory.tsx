import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Package,
  Search,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  Truck,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { productsApi } from '@/services/api';
import { CartDetailsModal } from '@/components/inventory/CartDetailsModal';
import { EditProductModal } from '@/components/inventory/EditProductModal';
import { ViewProductModal } from '@/components/inventory/ViewProductModal';


// ─── Types ──────────────────────────────────────────────────────────────────

interface InventoryStats {
  totalProducts: number;
  totalStockQuantity: number;
  deliveredQuantity: number;
  reservedQuantity: number;
  shippingQuantity: number;
  lowStockProducts: number;
}

interface Product {
  id: number;
  pid: string;
  name: string;
  description?: string;
  deity?: string;
  material?: string;
  height?: number;
  weight?: number;
  handcrafted?: boolean;
  occasion?: string[];
  religionCategory?: string;
  packagingType?: string;
  fragile?: boolean;
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  price: number;
  comparePrice?: number;
  stock: 'available' | 'unavailable';
  stockQuantity: number;
  lowStockThreshold: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  totalStock?: number;
  availableStock?: number;
  deliveredQuantity?: number;
  reservedQuantity?: number;
  shippingQuantity?: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STOCK_STATUS_CONFIG: Record<
  Product['stock'],
  { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }
> = {
  available: { label: 'Available', variant: 'default' },
  unavailable: { label: 'Out of Stock', variant: 'destructive' },
};

function fmt(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Delete Confirmation Dialog ─────────────────────────────────────────────

function DeleteProductDialog({
  product,
  open,
  onClose,
  onConfirm,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{product.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SellerInventory() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalStockQuantity: 0,
    deliveredQuantity: 0,
    reservedQuantity: 0,
    shippingQuantity: 0,
    lowStockProducts: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });

  // ─── Fetch Stats ────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const response = await productsApi.getInventoryStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory stats:', error);
      toast.error('Failed to load inventory stats');
    }
  }, []);

  // ─── Fetch Products ─────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
      };

      if (stockFilter !== 'all') {
        params.stock = stockFilter;
      }

      const response = await productsApi.getProducts(params);
      if (response.success && Array.isArray(response.data)) {
        // Fetch detailed inventory info for each product
        const productsWithDetails = await Promise.all(
          (response.data as Product[]).map(async (product) => {
            try {
              const detailsResponse = await productsApi.getProductInventoryDetails(product.id);
              if (detailsResponse.success && detailsResponse.data) {
                return detailsResponse.data as Product;
              }
              return product;
            } catch (error) {
              return product;
            }
          })
        );
        setProducts(productsWithDetails);
        if (response.meta) {
          setMeta(response.meta);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, stockFilter]);

  // ─── Initial Load ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
    // Auto-refresh stats every 3 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStats();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    fetchProducts();
  }, [meta.page, meta.limit, search, stockFilter]);

  // ─── Handle Delete ──────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteDialog.product) return;

    try {
      const response = await productsApi.deleteProduct(deleteDialog.product.id);
      if (response.success) {
        toast.success('Product deleted successfully');
        setDeleteDialog({ open: false, product: null });
        await Promise.all([fetchStats(), fetchProducts()]);
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // ─── Handle Search ──────────────────────────────────────────────────────────

  const handleSearch = (value: string) => {
    setSearch(value);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  // ─── Handle Filter ──────────────────────────────────────────────────────────

  const handleStockFilter = (value: string) => {
    setStockFilter(value);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  // ─── Handle Pagination ──────────────────────────────────────────────────────

  const handlePageChange = (newPage: number) => {
    setMeta((prev) => ({ ...prev, page: newPage }));
  };

  // ─── Handle Modal Success ───────────────────────────────────────────────────

  const handleModalSuccess = async () => {
    await Promise.all([fetchStats(), fetchProducts()]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="Manage your product inventory and stock levels"
        icon={Package}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
        />
        <StatCard
          title="Total Stock Quantity"
          value={stats.totalStockQuantity}
          icon={Package}
        />
        <StatCard
          title="Delivered"
          value={stats.deliveredQuantity}
          icon={CheckCircle}
        />
        <StatCard
          title="Reserved (In Cart)"
          value={stats.reservedQuantity}
          icon={ShoppingCart}
          onClick={() => setCartModalOpen(true)}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="In Shipping"
          value={stats.shippingQuantity}
          icon={Truck}
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by product name or ID..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={stockFilter} onValueChange={handleStockFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { fetchStats(); fetchProducts(); }} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">
                {search || stockFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first product'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total Stock</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Shipping</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const stockCfg = STOCK_STATUS_CONFIG[product.stock];
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate max-w-[200px]" title={product.name}>
                                {product.name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.categoryName}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{fmt(product.price)}</p>
                              {product.comparePrice && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {fmt(product.comparePrice)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{product.totalStock ?? product.stockQuantity ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">{product.availableStock ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-orange-600">{product.reservedQuantity ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600">{product.shippingQuantity ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600">{product.deliveredQuantity ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockCfg.variant}>{stockCfg.label}</Badge>
                          </TableCell>
                          <TableCell>{fmtDate(product.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setViewDialog({ open: true, product })}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setEditDialog({ open: true, product })}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeleteDialog({ open: true, product })
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                    {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{' '}
                    products
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(meta.page - 1)}
                      disabled={!meta.hasPrev}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {meta.page} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(meta.page + 1)}
                      disabled={!meta.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <DeleteProductDialog
        product={deleteDialog.product}
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        onConfirm={handleDelete}
      />

      <EditProductModal
        product={editDialog.product}
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, product: null })}
        onSuccess={handleModalSuccess}
      />

      <ViewProductModal
        product={viewDialog.product}
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, product: null })}
      />

      <CartDetailsModal
        open={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
      />
    </div>
  );
}
