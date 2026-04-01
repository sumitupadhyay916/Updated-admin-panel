import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { productsApi, categoriesApi, sellersApi, subcategoriesApi } from '@/services/api';
import type { Subcategory } from '@/services/api';
import type { Product, Category, Seller } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Package,
  Eye,
  Plus,
  Edit2,
  Trash2,
  ImageIcon,
  Check,
  X,
} from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// ── Color-Group Variant Types ─────────────────────────────────────────────────
interface SizeEntry {
  size: string;
  quality: string;
  price: number;
  mrp: number;
  stockQuantity: number;
}
interface ColorGroup {
  id: string;
  color: string;
  colorHex: string;
  images: string[];
  sizes: SizeEntry[];
  imageUploading?: boolean;
}
const makeColorGroup = (): ColorGroup => ({
  id: Math.random().toString(36).slice(2),
  color: '',
  colorHex: '#ffffff',
  images: [],
  sizes: [{ size: '', quality: '', price: 0, mrp: 0, stockQuantity: 0 }],
});

// Flat variant item schema
const variantItemSchema = z.object({
  size: z.string().optional().default(''),
  color: z.string().optional().default(''),
  quality: z.string().optional().default(''),
  price: z.number().min(0, 'Variant price cannot be negative').default(0),
  mrp: z.number().min(0, 'MRP cannot be negative').default(0),
  stockQuantity: z.number().min(0, 'Stock cannot be negative').default(0),
  images: z.array(z.string()).default([]),
});

// Shared base schema fields
const baseProductSchema = {
  name: z.string().min(1, 'Product name is required').min(2, 'Product name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional(),
  hasVariants: z.boolean().default(false),
  price: z.number().min(0).optional(),
  comparePrice: z.number().min(0).optional(),
  stock: z.enum(['available', 'unavailable']),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater').default(0),
  variants: z.array(variantItemSchema).optional().default([]),
  brand: z.string().optional(),
  care: z.string().optional(),
  materials: z.string().optional(),
  ageGroups: z.array(z.string()).optional().default([]),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  dimensions: z.object({
    h: z.number().optional().default(0),
    l: z.number().optional().default(0),
    w: z.number().optional().default(0),
  }).optional().default({ h: 0, l: 0, w: 0 }),
};

// Schema for super_admin and admin (sellerId optional)
const productFormSchemaWithSeller = z.object({
  ...baseProductSchema,
  sellerId: z.string().optional(),
});

// Schema for seller (sellerId not required, auto-set)
const productFormSchemaWithoutSeller = z.object({
  ...baseProductSchema,
  sellerId: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchemaWithSeller>;

export default function ProductsManagement() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isSeller = user?.role === 'seller';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [editSubcategories, setEditSubcategories] = useState<Subcategory[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sellerFilter, setSellerFilter] = useState<string>('__all__');
  // Image upload state - supports multiple images
  const [editUploadedImageUrls, setEditUploadedImageUrls] = useState<string[]>([]);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [isEditSubcategoriesLoading, setIsEditSubcategoriesLoading] = useState(false);
  const [editHasVariants, setEditHasVariants] = useState(false);
  const [editColorGroups, setEditColorGroups] = useState<ColorGroup[]>([]);

  // Quick Create State
  const [isQuickAddSubcategoryOpen, setIsQuickAddSubcategoryOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddDesc, setQuickAddDesc] = useState('');


  const isMyProductsPage = useMemo(() => location.pathname.endsWith('/my-products'), [location.pathname]);



  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(isSeller ? productFormSchemaWithoutSeller : productFormSchemaWithSeller) as any,
    defaultValues: {
      name: '',
      categoryId: '',
      subcategoryId: '',
      sellerId: isSeller ? '' : '__my__',
      hasVariants: false,
      price: 0,
      comparePrice: 0,
      stock: 'available',
      variants: [],
      stockQuantity: 0,
      brand: '',
      care: '',
      materials: '',
      ageGroups: [],
      isNew: false,
      isBestseller: false,
      dimensions: { h: 0, l: 0, w: 0 },
    },
  });



  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page: 1, limit: 1000 };
      if (!isSeller) {
        const effectiveFilter = isMyProductsPage ? '__my__' : sellerFilter;
        if (effectiveFilter === '__my__' && user?.id) {
          params.sellerId = user.id;
        } else if (effectiveFilter && effectiveFilter !== '__all__') {
          params.sellerId = effectiveFilter;
        }
      }

      const response = await productsApi.getProducts(params);
      if (response.success && Array.isArray(response.data)) {
        setProducts(response.data as Product[]);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to load products', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSeller, isMyProductsPage, sellerFilter, user?.id]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getCategories({ page: 1, limit: 1000 });
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data as Category[]);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories', error);
      setCategories([]);
    }
  }, []);

  const loadSellers = useCallback(async () => {
    try {
      const response = await sellersApi.getSellers({ page: 1, limit: 1000 });
      if (response.success && Array.isArray(response.data)) {
        setSellers(response.data as Seller[]);
      } else {
        setSellers([]);
      }
    } catch (error) {
      console.error('Failed to load sellers', error);
      setSellers([]);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
    void loadCategories();
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      void loadSellers();
    }
    // void loadSellers();
  }, [loadProducts, loadCategories, loadSellers, user?.role]);

  // If on My Products page, force filter to my products for admin/super_admin
  useEffect(() => {
    if (!isSeller && isMyProductsPage) {
      setSellerFilter('__my__');
    } else if (!isSeller && !isMyProductsPage) {
      setSellerFilter('__all__');
    }
  }, [isMyProductsPage, isSeller]);

  const openViewDialog = (product: Product) => {
    navigate(`${location.pathname}/${product.id}/view`);
  };

  const openEditDialog = useCallback(async (product: Product) => {
    setEditingProduct(product);
    const hasVariants = (product as any).hasVariants ?? false;
    setEditHasVariants(hasVariants);

    const rawVariants = (product as any).variants || [];
    const colorGroupsMap = new Map<string, ColorGroup>();
    rawVariants.forEach((v: any) => {
      const colorKey = v.color || 'Default';
      if (!colorGroupsMap.has(colorKey)) {
        colorGroupsMap.set(colorKey, {
          id: Math.random().toString(36).slice(2),
          color: colorKey,
          colorHex: v.colorHex || '#ffffff',
          images: Array.isArray(v.images) ? v.images.map((img: any) => img.url || img).filter(Boolean) : [],
          sizes: []
        });
      }
      colorGroupsMap.get(colorKey)!.sizes.push({
        size: v.size || '',
        quality: v.quality || '',
        price: v.price || 0,
        mrp: v.mrp || 0,
        stockQuantity: v.stockQuantity || 0
      });
    });
    setEditColorGroups(Array.from(colorGroupsMap.values()));

    editForm.reset({
      name: product.name,
      categoryId: product.categoryId.toString(),
      subcategoryId: product.subcategoryId?.toString() || '',
      sellerId: !isSeller && user?.id && product.sellerId === user.id ? '__my__' : (product.sellerId || ''),
      hasVariants,
      price: product.price,
      comparePrice: (product as any).comparePrice ?? 0,
      stock: product.stock,
      stockQuantity: product.stockQuantity,
      variants: [],
      brand: (product as any).brand || '',
      care: (product as any).care || '',
      materials: (product as any).materials || '',
      ageGroups: Array.isArray((product as any).ageGroups) ? (product as any).ageGroups : [],
      isNew: !!(product as any).isNew,
      isBestseller: !!(product as any).isBestseller,
      dimensions: (product as any).dimensions || { h: 0, l: 0, w: 0 },
    });

    setEditUploadedImageUrls(product.images || []);

    if (product.categoryId) {
      setIsEditSubcategoriesLoading(true);
      try {
        const res = await subcategoriesApi.getByCategory(product.categoryId);
        if (res.success) {
          const subs = res.data || [];
          setEditSubcategories(subs);
          if (!product.subcategoryId && product.subcategorySlug) {
            const match = subs.find(s => s.slug === product.subcategorySlug);
            if (match) editForm.setValue('subcategoryId', match.id.toString());
          } else {
            const currentSubId = editForm.getValues('subcategoryId');
            if (currentSubId) editForm.setValue('subcategoryId', currentSubId);
          }
        }
      } catch (err) {
        console.error('Failed to load subcategories for edit', err);
        setEditSubcategories([]);
      } finally {
        setIsEditSubcategoriesLoading(false);
      }
    }
    setIsEditDialogOpen(true);
  }, [editForm, isSeller, user?.id]);

  const handleUpdateProduct = async (values: ProductFormValues) => {
    if (!editingProduct) return;
    try {
      setIsLoading(true);
      // Variant validation (grouped model)
      if (editHasVariants) {
        if (editColorGroups.length === 0) {
          toast.error('Add at least one color group before saving'); setIsLoading(false); return;
        }
        for (const cg of editColorGroups) {
          if (!cg.color.trim()) { toast.error('All color groups must have a color name'); setIsLoading(false); return; }
          if (cg.sizes.length === 0) { toast.error(`Color "${cg.color}" must have at least one size`); setIsLoading(false); return; }
          for (const s of cg.sizes) {
            if ((s.price ?? 0) <= 0) { toast.error(`Price must be > 0 for all sizes in "${cg.color}"`); setIsLoading(false); return; }
            if ((s.mrp ?? 0) < (s.price ?? 0)) { toast.error(`MRP must be ≥ Price in "${cg.color}"`); setIsLoading(false); return; }
          }
        }
      }
      // Flatten ColorGroups → flat variants array for backend
      const flatVariants = editHasVariants
        ? editColorGroups.flatMap(cg =>
          cg.sizes.map(s => ({
            color: cg.color,
            colorHex: cg.colorHex,
            size: s.size,
            quality: s.quality,
            price: s.price,
            mrp: s.mrp,
            stockQuantity: s.stockQuantity,
            images: cg.images,
          }))
        )
        : [];
      const payload: any = {
        name: values.name,
        categoryId: parseInt(values.categoryId, 10),
        hasVariants: editHasVariants,
        stock: values.stock,
        subcategoryId: values.subcategoryId && values.subcategoryId !== '__none__'
          ? parseInt(values.subcategoryId, 10)
          : null,
        brand: values.brand,
        care: values.care,
        materials: values.materials,
        ageGroups: values.ageGroups,
        isNew: values.isNew,
        isBestseller: values.isBestseller,
        dimensions: values.dimensions,
      };
      if (editHasVariants) {
        payload.variants = flatVariants;
      } else {
        payload.price = values.price;
        payload.comparePrice = values.comparePrice;
        payload.stockQuantity = values.stockQuantity;
        payload.images = editUploadedImageUrls;
      }
      if (!isSeller) {
        if (!values.sellerId || values.sellerId === '__my__') {
          payload.sellerId = user?.id;
        } else {
          payload.sellerId = values.sellerId;
        }
      }
      const response = await productsApi.updateProduct(editingProduct.id, payload);
      if (response.success && response.data) {
        toast.success('Product updated successfully');
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        setEditUploadedImageUrls([]);
        setEditHasVariants(false);
        setEditColorGroups([]);
        editForm.reset({
          name: '',
          categoryId: '',
          subcategoryId: '',
          sellerId: '',
          hasVariants: false,
          price: 0,
          comparePrice: 0,
          stock: 'available',
          stockQuantity: 0,
          variants: [],
        });
        setEditSubcategories([]);
        await loadProducts();
        await loadCategories();
      } else {
        toast.error(response.message || 'Failed to update product');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update product';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = useCallback((product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      setIsLoading(true);
      const response = await productsApi.deleteProduct(deletingProduct.id);
      if (response.success) {
        toast.success('Product deleted successfully');
        setIsDeleteDialogOpen(false);
        setDeletingProduct(null);
        await loadProducts();
        await loadCategories(); // Refresh categories to update product count
      } else {
        toast.error(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete product';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  const handleQuickCreateSubcategory = async () => {
    const catId = editForm.getValues('categoryId');
    if (!quickAddName || !catId) return;

    try {
      setIsLoading(true);
      const slug = quickAddName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const response = await subcategoriesApi.create({
        name: quickAddName,
        slug,
        categoryId: parseInt(catId, 10),
        description: quickAddDesc
      });

      if (response.success && response.data) {
        const newSub = response.data as Subcategory;
        toast.success('Subcategory created');
        const subRes = await subcategoriesApi.getByCategory(parseInt(catId, 10));
        if (subRes.success) {
          if (isEditDialogOpen) {
            setEditSubcategories(subRes.data || []);
            editForm.setValue('subcategoryId', newSub.id.toString());
          }
        }
        setIsQuickAddSubcategoryOpen(false);
        setQuickAddName('');
        setQuickAddDesc('');
      }
    } catch (err) {
      toast.error('Failed to create subcategory');
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Product>[] = useMemo(() => {
    const isSeller = user?.role === 'seller';

    const allColumns: ColumnDef<Product>[] = [
      {
        id: 'select',
        header: ({ table }: { table: { getIsAllPageRowsSelected: () => boolean; toggleAllPageRowsSelected: (value: boolean) => void } }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (value: boolean) => void } }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }: { row: { original: Product } }) => (
          <div className="font-medium">{row.original.id}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Products',
        cell: ({ row }: { row: { original: Product } }) => {
          const product = row.original;
          // Only show first product image
          const displayImage = (product.images && product.images.length > 0)
            ? product.images[0]
            : null;

          return (
            <div className="flex items-center gap-3">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={product.name}>
                  {product.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{product.sellerName}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'categoryName',
        header: 'Categories',
        cell: ({ row }: { row: { original: Product } }) => {
          const product = row.original;
          return (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{product.categoryName || 'Uncategorized'}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'subcategorySlug',
        header: 'Subcategories',
        cell: ({ row }: { row: { original: Product } }) => {
          const product = row.original;
          return (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{product.subcategorySlug || 'None'}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'hasVariants',
        header: 'hasVariants',
        cell: ({ row }: { row: { original: Product } }) => {
          const hasVariants = (row.original as any).hasVariants;
          return (
            <div className="flex justify-center w-full max-w-[80px]">
              {hasVariants ? (
                <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                </div>
              ) : (
                <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  <X className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }: { row: { original: Product } }) => {
          const stock = row.original.stock;
          return (
            <Badge variant={stock === 'available' ? 'default' : 'secondary'}>
              {stock === 'available' ? 'Available' : 'Unavailable'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: { row: { original: Product } }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="text-sm">
              {date.toLocaleDateString('en-GB')} {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openViewDialog(product)}
                className="h-8 w-8 p-0"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`${location.pathname}/${product.id}/edit`)}
                className="h-8 w-8 p-0"
                title="Edit Product"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(product)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ];

    // Filter out Categories column for sellers
    if (isSeller) {
      return allColumns.filter(col => (col as any).accessorKey !== 'categoryName');
    }

    return allColumns;
  }, [user, openEditDialog, openDeleteDialog]);

  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.stock === 'available').length;
  const unavailableProducts = products.filter(p => p.stock === 'unavailable').length;
  const featuredCount = products.filter(p => p.isFeatured).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isMyProductsPage && !isSeller ? 'My Products' : 'All Categories Products'}
        description="Manage all products across the marketplace"
        icon={Package}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{availableProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
              <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unavailable</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{unavailableProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Featured</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{featuredCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Search products..."
                className="w-full"
              />
            </div>
            {/* {!isSeller && (
              <div className="mr-4 w-64">
                <Select
                  value={isMyProductsPage ? '__my__' : sellerFilter}
                  onValueChange={(v) => {
                    setSellerFilter(v);
                    void loadProducts();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by seller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Products</SelectItem>
                    <SelectItem value="__my__">My Products1</SelectItem>
                    {sellers
                      .filter((s) => s.status === 'active')
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.businessName} ({s.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )} */}
            <Button onClick={() => navigate('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setEditUploadedImageUrls([]);
            editForm.reset({
              name: '',
              categoryId: '',
              subcategoryId: '',
              sellerId: isSeller ? '' : '__my__',
              price: 0,
              stock: 'available',
              stockQuantity: 0,
              brand: '', care: '', materials: '', ageGroups: [], isNew: false, isBestseller: false, dimensions: { h: 0, l: 0, w: 0 }
            });
          }
        }}
      >

        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateProduct)} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={async (val) => {
                            field.onChange(val);
                            editForm.setValue('subcategoryId', '');
                            if (val) {
                              setIsEditSubcategoriesLoading(true);
                              try {
                                const res = await subcategoriesApi.getByCategory(parseInt(val, 10));
                                setEditSubcategories(res.success ? (res.data || []) : []);
                              } catch {
                                setEditSubcategories([]);
                              } finally {
                                setIsEditSubcategoriesLoading(false);
                              }
                            } else {
                              setEditSubcategories([]);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories
                              .filter(cat => cat.status === 'active')
                              .map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Subcategory dropdown */}
                <FormField
                  control={editForm.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || '__none__'}
                          disabled={isEditSubcategoriesLoading || (!!editForm.getValues('categoryId') && editSubcategories.length === 0)}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={isEditSubcategoriesLoading ? "Loading..." : (editForm.getValues('categoryId') && editSubcategories.length === 0 ? "No subcategories" : "Select subcategory (optional)")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— None —</SelectItem>
                            {editSubcategories.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id.toString()}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsQuickAddSubcategoryOpen(true)}
                          title="Add New Subcategory"
                          disabled={!editForm.getValues('categoryId')}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isSeller && (
                  <FormField
                    control={editForm.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a seller" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__my__">My Products</SelectItem>
                            {sellers
                              .filter(seller => seller.status === 'active')
                              .map((seller) => (
                                <SelectItem key={seller.id} value={seller.id}>
                                  {seller.businessName} ({seller.email})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {/* ── Has Variants Toggle ── */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Has Variants</p>
                    <p className="text-xs text-muted-foreground">Enable to add size, colour & other variations</p>
                  </div>
                  <div className="flex rounded-lg border overflow-hidden">
                    <button
                      type="button"
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${!editHasVariants ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                      onClick={() => setEditHasVariants(false)}
                    >OFF</button>
                    <button
                      type="button"
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${editHasVariants ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                      onClick={() => setEditHasVariants(true)}
                    >ON</button>
                  </div>
                </div>

                {/* ── Simple Inventory (hasVariants = false) ── */}
                {!editHasVariants && (
                  <>
                    <FormField
                      control={editForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" step="0.01" min="0" {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} value={field.value || 0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="comparePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare Price / MRP (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" step="0.01" min="0" {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} value={field.value || 0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select stock status" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="unavailable">Unavailable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" min="0" step="1" {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} value={field.value || 0} />
                          </FormControl>
                          <FormDescription>Update the stock quantity for this product</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Product Images */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product Images</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                        {editUploadedImageUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {editUploadedImageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img src={url} alt={`Product ${index + 1}`} className="h-20 w-full rounded-lg object-cover border" />
                                <button type="button"
                                  onClick={() => setEditUploadedImageUrls(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="flex flex-col items-center gap-2 cursor-pointer">
                          {isEditUploading ? (
                            <>
                              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                              <span className="text-sm text-gray-500">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                              <span className="text-sm text-gray-500">{editUploadedImageUrls.length > 0 ? 'Add more images' : 'Click to upload product images'}</span>
                              <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 10MB</span>
                            </>
                          )}
                          <input type="file" accept="image/*" multiple className="hidden" disabled={isEditUploading}
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (!files.length) return;
                              setIsEditUploading(true);
                              try {
                                const results = await Promise.all(files.map(f => productsApi.uploadImage(f)));
                                const urls = results.filter(r => r.success && r.data?.url).map(r => r.data!.url);
                                if (urls.length) { setEditUploadedImageUrls(prev => [...prev, ...urls]); toast.success(`${urls.length} image(s) uploaded`); }
                                else toast.error('Failed to upload images');
                              } catch { toast.error('Failed to upload images'); }
                              finally { setIsEditUploading(false); e.target.value = ''; }
                            }} />
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Color-Group Variant UI (Edit) ── */}
                {editHasVariants && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base font-semibold">Color Variants</FormLabel>
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => setEditColorGroups(prev => [...prev, makeColorGroup()])}>
                        <Plus className="h-4 w-4 mr-1" /> Add Color
                      </Button>
                    </div>
                    {editColorGroups.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg text-sm">
                        No color variants yet. Click &quot;+ Add Color&quot; to begin.
                      </div>
                    )}
                    <div className="space-y-4">
                      {editColorGroups.map((cg, cgIdx) => {
                        const totalStock = cg.sizes.reduce((s, sz) => s + (sz.stockQuantity || 0), 0);
                        const updateCg = (patch: Partial<ColorGroup>) =>
                          setEditColorGroups(prev => prev.map((g, i) => i === cgIdx ? { ...g, ...patch } : g));
                        const updateSize = (sIdx: number, patch: Partial<SizeEntry>) =>
                          setEditColorGroups(prev => prev.map((g, i) => i === cgIdx
                            ? { ...g, sizes: g.sizes.map((s, si) => si === sIdx ? { ...s, ...patch } : s) } : g));
                        return (
                          <Card key={cg.id} className="border-2">
                            <CardContent className="p-4 space-y-4">
                              {/* Color header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <input type="color" className="h-9 w-9 rounded border cursor-pointer flex-shrink-0"
                                    value={cg.colorHex}
                                    onChange={e => updateCg({ colorHex: e.target.value })} />
                                  <Input placeholder="Color name (e.g. Green)" className="h-9"
                                    value={cg.color}
                                    onChange={e => updateCg({ color: e.target.value })} />
                                  <span className="text-xs whitespace-nowrap bg-muted px-2 py-1 rounded-full font-medium">
                                    Total: {totalStock} pcs
                                  </span>
                                </div>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive ml-2"
                                  onClick={() => setEditColorGroups(prev => prev.filter((_, i) => i !== cgIdx))}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Color Images */}
                              <div>
                                <p className="text-xs font-medium mb-2">Images for {cg.color || 'this color'}</p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {cg.images.map((url, imgIdx) => (
                                    <div key={imgIdx} className="relative group">
                                      <img src={url} alt="" className="h-14 w-14 rounded object-cover border" />
                                      <button type="button"
                                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => updateCg({ images: cg.images.filter((_, ii) => ii !== imgIdx) })}>
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="flex items-center justify-center h-14 w-14 rounded border-2 border-dashed border-muted-foreground/40 cursor-pointer hover:border-primary transition-colors">
                                    {cg.imageUploading ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                    ) : (
                                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <input type="file" accept="image/*" multiple className="hidden" disabled={cg.imageUploading}
                                      onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (!files.length) return;
                                        updateCg({ imageUploading: true });
                                        try {
                                          const results = await Promise.all(files.map(f => productsApi.uploadImage(f)));
                                          const urls = results.filter(r => r.success && r.data?.url).map(r => r.data!.url);
                                          if (urls.length) { updateCg({ images: [...cg.images, ...urls], imageUploading: false }); toast.success(`${urls.length} image(s) uploaded`); }
                                          else { updateCg({ imageUploading: false }); toast.error('Failed to upload images'); }
                                        } catch { updateCg({ imageUploading: false }); toast.error('Upload failed'); }
                                        finally { e.target.value = ''; }
                                      }} />
                                  </label>
                                </div>
                              </div>

                              {/* Sizes Table */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium">Sizes & Pricing</p>
                                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2"
                                    onClick={() => updateCg({ sizes: [...cg.sizes, { size: '', quality: '', price: 0, mrp: 0, stockQuantity: 0 }] })}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Size
                                  </Button>
                                </div>
                                {cg.sizes.length > 0 && (
                                  <div className="rounded-lg border overflow-x-auto">
                                    <table className="w-full text-xs min-w-[500px]">
                                      <thead className="bg-muted/60">
                                        <tr>
                                          <th className="py-2 px-2 text-left font-medium">Size</th>
                                          <th className="py-2 px-2 text-left font-medium">Quality</th>
                                          <th className="py-2 px-2 text-left font-medium">Price ₹</th>
                                          <th className="py-2 px-2 text-left font-medium">MRP ₹</th>
                                          <th className="py-2 px-2 text-left font-medium">Stock</th>
                                          <th className="py-2 px-1" />
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                        {cg.sizes.map((sz, sIdx) => (
                                          <tr key={sIdx} className="hover:bg-muted/30">
                                            <td className="py-1 px-2">
                                              <Input className="h-7 text-xs min-w-[4rem]" placeholder="M / L"
                                                value={sz.size} onChange={e => updateSize(sIdx, { size: e.target.value })} />
                                            </td>
                                            <td className="py-1 px-2">
                                              <Input className="h-7 text-xs min-w-[5rem]" placeholder="Standard"
                                                value={sz.quality} onChange={e => updateSize(sIdx, { quality: e.target.value })} />
                                            </td>
                                            <td className="py-1 px-2">
                                              <Input type="number" className="h-7 text-xs min-w-[4rem]" placeholder="0"
                                                value={sz.price || ''} onChange={e => updateSize(sIdx, { price: parseFloat(e.target.value) || 0 })} />
                                            </td>
                                            <td className="py-1 px-2">
                                              <Input type="number" className="h-7 text-xs min-w-[4rem]" placeholder="0"
                                                value={sz.mrp || ''} onChange={e => updateSize(sIdx, { mrp: parseFloat(e.target.value) || 0 })} />
                                            </td>
                                            <td className="py-1 px-2">
                                              <Input type="number" className="h-7 text-xs min-w-[4rem]" placeholder="0"
                                                value={sz.stockQuantity || ''} onChange={e => updateSize(sIdx, { stockQuantity: parseInt(e.target.value, 10) || 0 })} />
                                            </td>
                                            <td className="py-1 px-1">
                                              <button type="button" className="text-destructive hover:text-red-700 p-1"
                                                onClick={() => updateCg({ sizes: cg.sizes.filter((_, si) => si !== sIdx) })}>
                                                <X className="h-3.5 w-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="pt-4 border-t mt-auto">

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingProduct(null);
                    editForm.reset({
                      name: '',
                      categoryId: '',
                      subcategoryId: '',
                      sellerId: '',
                      price: 0,
                      stock: 'available',
                      stockQuantity: 0,
                    });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setDeletingProduct(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingProduct(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Subcategory Dialog */}
      <Dialog open={isQuickAddSubcategoryOpen} onOpenChange={setIsQuickAddSubcategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Subcategory</DialogTitle>
            <DialogDescription>
              Create a new subcategory instantly for the selected category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory Name</label>
              <Input
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                placeholder="Enter subcategory name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={quickAddDesc}
                onChange={(e) => setQuickAddDesc(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddSubcategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickCreateSubcategory} disabled={isLoading || !quickAddName}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
