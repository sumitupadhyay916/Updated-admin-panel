import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Schema for super_admin and admin (sellerId optional; defaults to "My Products")
const productFormSchemaWithSeller = z.object({
  name: z.string().min(1, 'Product name is required').min(2, 'Product name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional(),
  sellerId: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z.enum(['available', 'unavailable']),
  variants: z.array(z.object({
    price: z.number().min(0, 'Variant price cannot be negative'),
    comparePrice: z.number().optional().nullable(),
    stock: z.number().min(0, 'Variant stock cannot be negative'),
    images: z.array(z.string()).optional(),
    optionValueNames: z.record(z.string(), z.string()),
  })).optional(),
  options: z.array(z.object({
    name: z.string().min(1, 'Option name is required'),
    values: z.array(z.string().min(1, 'Option value is required')),
  })).optional(),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater').default(0),
});

// Schema for seller (sellerId not required, will be auto-set)
const productFormSchemaWithoutSeller = z.object({
  name: z.string().min(1, 'Product name is required').min(2, 'Product name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional(),
  sellerId: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z.enum(['available', 'unavailable']),
  variants: z.array(z.object({
    color: z.string().optional(),
    size: z.string().optional(),
    price: z.number().min(0, 'Variant price cannot be negative'),
    comparePrice: z.number().optional(),
    stock: z.number().min(0, 'Variant stock cannot be negative'),
    imageUrl: z.string().optional(),
  })).optional(),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater').default(0),
});

type ProductFormValues = z.infer<typeof productFormSchemaWithSeller>;

export default function ProductsManagement() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isSeller = user?.role === 'seller';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [editSubcategories, setEditSubcategories] = useState<Subcategory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sellerFilter, setSellerFilter] = useState<string>('__all__');
  // Image upload state - now supports multiple images
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editUploadedImageUrls, setEditUploadedImageUrls] = useState<string[]>([]);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [isSubcategoriesLoading, setIsSubcategoriesLoading] = useState(false);
  const [isEditSubcategoriesLoading, setIsEditSubcategoriesLoading] = useState(false);

  // Quick Create State
  const [isQuickAddSubcategoryOpen, setIsQuickAddSubcategoryOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddDesc, setQuickAddDesc] = useState('');


  const isMyProductsPage = useMemo(() => location.pathname.endsWith('/my-products'), [location.pathname]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(isSeller ? productFormSchemaWithoutSeller : productFormSchemaWithSeller) as any,
    defaultValues: {
      name: '',
      categoryId: '',
      subcategoryId: '',
      sellerId: isSeller ? '' : '__my__',
      price: 0,
      stock: 'available',
      options: [],
      variants: [],
      stockQuantity: 0,
    },
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(isSeller ? productFormSchemaWithoutSeller : productFormSchemaWithSeller) as any,
    defaultValues: {
      name: '',
      categoryId: '',
      subcategoryId: '',
      sellerId: isSeller ? '' : '__my__',
      price: 0,
      stock: 'available',
      options: [],
      variants: [],
      stockQuantity: 0,
    },
  });

  const { fields: variantFields, remove: removeVariant, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const { fields: editVariantFields, remove: removeEditVariant, replace: replaceEditVariants } = useFieldArray({
    control: editForm.control,
    name: "variants"
  });

  const { fields: editOptionFields, append: appendEditOption, remove: removeEditOption } = useFieldArray({
    control: editForm.control,
    name: "options"
  });

  const generateVariants = useCallback((options: { name: string, values: string[] }[]) => {
    if (options.length === 0) return [];

    let combinations: Record<string, string>[] = [{}];

    options.forEach(option => {
      const newCombinations: Record<string, string>[] = [];
      combinations.forEach(combo => {
        option.values.forEach(value => {
          newCombinations.push({
            ...combo,
            [option.name]: value
          });
        });
      });
      combinations = newCombinations;
    });

    return combinations.map(combo => ({
      price: form.getValues('price') || 0,
      stock: 0,
      optionValueNames: combo,
      images: []
    }));
  }, [form]);

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

  const handleCreateProduct = async (values: ProductFormValues) => {
    try {
      setIsLoading(true);
      const payload: any = {
        name: values.name,
        categoryId: parseInt(values.categoryId, 10),
        price: values.price,
        stock: values.stock,
        variants: values.variants,
        stockQuantity: values.stockQuantity || 0,
      };
      if (values.subcategoryId && values.subcategoryId !== '__none__') {
        payload.subcategoryId = parseInt(values.subcategoryId, 10);
      }
      if (uploadedImageUrls.length > 0) {
        payload.images = uploadedImageUrls;
      }


      // Admin/SuperAdmin:
      // - empty sellerId or "__my__" => create under current admin (My Products)
      // - sellerId selected => create under that seller
      if (!isSeller) {
        if (!values.sellerId || values.sellerId === '__my__') {
          payload.sellerId = user?.id;
        } else {
          payload.sellerId = values.sellerId;
        }
      }

      const response = await productsApi.createProduct(payload);
      if (response.success && response.data) {
        toast.success('Product created successfully');
        setIsAddDialogOpen(false);
        setUploadedImageUrls([]);
        form.reset({
          name: '',
          categoryId: '',
          subcategoryId: '',
          sellerId: isSeller ? '' : '__my__',
          price: 0,
          stock: 'available',
          stockQuantity: 0,
        });
        setSubcategories([]);

        await loadProducts();
        await loadCategories(); // Refresh categories to update product count
      } else {
        toast.error(response.message || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create product';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openViewDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = useCallback(async (product: Product) => {
    setEditingProduct(product);

    // Initial reset with available data
    editForm.reset({
      name: product.name,
      categoryId: product.categoryId.toString(),
      subcategoryId: product.subcategoryId?.toString() || '',
      sellerId: !isSeller && user?.id && product.sellerId === user.id ? '__my__' : (product.sellerId || ''),
      price: product.price,
      stock: product.stock,
      variants: (product as any).variants || [],
    });

    // Load subcategories for the current category and attempt to match legacy slug if ID is missing
    if (product.categoryId) {
      setIsEditSubcategoriesLoading(true);
      try {
        const res = await subcategoriesApi.getByCategory(product.categoryId);
        if (res.success) {
          const subs = res.data || [];
          setEditSubcategories(subs);

          // If subcategoryId is missing but we have a slug, try to find the ID and update form
          if (!product.subcategoryId && product.subcategorySlug) {
            const match = subs.find(s => s.slug === product.subcategorySlug);
            if (match) {
              editForm.setValue('subcategoryId', match.id.toString());
            }
          } else {
            // Even if ID is present, re-apply it after subs are loaded to ensure the Select component matches it
            const currentSubId = editForm.getValues('subcategoryId');
            if (currentSubId) {
              editForm.setValue('subcategoryId', currentSubId);
            }
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
      const payload: any = {
        name: values.name,
        categoryId: parseInt(values.categoryId, 10),
        price: values.price,
        stock: values.stock,
        variants: values.variants,
        subcategoryId: values.subcategoryId && values.subcategoryId !== '__none__'
          ? parseInt(values.subcategoryId, 10)
          : null,
      };
      if (editUploadedImageUrls.length > 0) {
        payload.images = editUploadedImageUrls;
      }


      // Admin/SuperAdmin:
      // - empty sellerId or "__my__" => move to My Products (admin-owned)
      // - sellerId selected => assign to that seller
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
        editForm.reset({
          name: '',
          categoryId: '',
          subcategoryId: '',
          sellerId: '',
          price: 0,
          stock: 'available',
          stockQuantity: 0,
        });
        setEditSubcategories([]);
        await loadProducts();
        await loadCategories(); // Refresh categories to update product count
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleQuickCreateSubcategory = async () => {
    const catId = isAddDialogOpen ? form.getValues('categoryId') : editForm.getValues('categoryId');
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
          if (isAddDialogOpen) {
            setSubcategories(subRes.data || []);
            form.setValue('subcategoryId', newSub.id.toString());
          } else if (isEditDialogOpen) {
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
        accessorKey: 'pid',
        header: 'PID',
        cell: ({ row }: { row: { original: Product } }) => (
          <div className="font-mono text-xs text-muted-foreground">{row.original.pid}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Products',
        cell: ({ row }: { row: { original: Product } }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-3">
              {product.images && product.images.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                />
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
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }: { row: { original: Product } }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(row.original.price)}
            </p>
            {row.original.comparePrice && (
              <p className="text-xs text-gray-500 line-through">
                {formatCurrency(row.original.comparePrice)}
              </p>
            )}
          </div>
        ),
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
                onClick={() => openEditDialog(product)}
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
            <Button onClick={() => setIsAddDialogOpen(true)}>
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

      {/* Create Product Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setUploadedImageUrls([]);
            form.reset({
              name: '',
              categoryId: '',
              subcategoryId: '',
              sellerId: isSeller ? '' : '__my__',
              price: 0,
              stock: 'available',
              stockQuantity: 0,
            });
            setSubcategories([]);
          }
        }}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product to the marketplace.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateProduct)} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={async (val) => {
                            field.onChange(val);
                            form.setValue('subcategoryId', '');
                            if (val) {
                              setIsSubcategoriesLoading(true);
                              try {
                                const res = await subcategoriesApi.getByCategory(parseInt(val, 10));
                                setSubcategories(res.success ? (res.data || []) : []);
                              } catch {
                                setSubcategories([]);
                              } finally {
                                setIsSubcategoriesLoading(false);
                              }
                            } else {
                              setSubcategories([]);
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
                {/* Subcategory dropdown — shows after category chosen */}
                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || '__none__'}
                          disabled={isSubcategoriesLoading || (!!form.getValues('categoryId') && subcategories.length === 0)}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={isSubcategoriesLoading ? "Loading..." : (form.getValues('categoryId') && subcategories.length === 0 ? "No subcategories" : "Select subcategory (optional)")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— None —</SelectItem>
                            {subcategories.map((sub) => (
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
                          disabled={!form.getValues('categoryId')}
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
                    control={form.control}
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
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stock status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Options Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-semibold">Product Options</FormLabel>
                      <p className="text-sm text-muted-foreground">Add options like Size, Color, etc. and their possible values.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendOption({ name: '', values: [] })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {optionFields.map((field, index) => (
                      <Card key={field.id} className="border-dashed">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-4">
                              <FormField
                                control={form.control}
                                name={`options.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Option Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Color" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`options.${index}.values`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Values (Comma-separated)</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g. Red, Blue, Green"
                                        value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                        onChange={(e) => {
                                          const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                                          field.onChange(values);
                                        }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive mt-8"
                              onClick={() => removeOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {optionFields.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        const options = form.getValues('options');
                        const generated = generateVariants(options);
                        replaceVariants(generated);
                      }}
                    >
                      Generate Variants
                    </Button>
                  )}
                </div>

                {/* Generated Variants Section */}
                {variantFields.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <FormLabel className="text-base font-semibold">Generated Variants</FormLabel>
                    <div className="space-y-2">
                      {variantFields.map((field, index) => (
                        <Card key={field.id} className="border">
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm bg-muted px-2 py-1 rounded">
                                {Object.entries(field.optionValueNames || {})
                                  .map(([key, val]) => `${key}: ${val}`)
                                  .join(' / ')}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive h-8 p-0"
                                onClick={() => removeVariant(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`variants.${index}.price`}
                                render={({ field: { onChange, ...field } }) => (
                                  <FormItem>
                                    <FormLabel>Price (INR) *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 999"
                                        {...field}
                                        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.comparePrice`}
                                render={({ field: { onChange, ...field } }) => (
                                  <FormItem>
                                    <FormLabel>Compare Price (INR)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 1499 (original)"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.stock`}
                                render={({ field: { onChange, ...field } }) => (
                                  <FormItem>
                                    <FormLabel>Stock Qty *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              {/* Image selector for this variant */}
                              <FormItem>
                                <FormLabel>Variant Image</FormLabel>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  value={(form.watch(`variants.${index}.images`) as string[] | undefined)?.[0] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    form.setValue(`variants.${index}.images`, val ? [val] : []);
                                  }}
                                >
                                  <option value="">— None —</option>
                                  {uploadedImageUrls.map((url, i) => (
                                    <option key={i} value={url}>
                                      Image {i + 1}
                                    </option>
                                  ))}
                                </select>
                                {/* Preview selected variant image */}
                                {((form.watch(`variants.${index}.images`) as string[] | undefined)?.[0]) && (
                                  <img
                                    src={(form.watch(`variants.${index}.images`) as string[])[0]}
                                    alt="variant"
                                    className="mt-2 h-16 w-16 rounded object-cover border"
                                  />
                                )}
                              </FormItem>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Uploader - Multiple Images */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Images</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {/* Display uploaded images */}
                    {uploadedImageUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {uploadedImageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Product ${index + 1}`}
                              className="h-20 w-full rounded-lg object-cover border"
                            />
                            <button
                              type="button"
                              onClick={() => setUploadedImageUrls(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      {isUploading ? (
                        <>
                          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                          <span className="text-sm text-gray-500">Uploading to Cloudinary...</span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-500">
                            {uploadedImageUrls.length > 0 ? 'Add more images' : 'Click to upload product images'}
                          </span>
                          <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 10MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={isUploading}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;

                          setIsUploading(true);
                          try {
                            const uploadPromises = files.map(file => productsApi.uploadImage(file));
                            const results = await Promise.all(uploadPromises);

                            const successfulUrls = results
                              .filter(result => result.success && result.data?.url)
                              .map(result => result.data!.url);

                            if (successfulUrls.length > 0) {
                              setUploadedImageUrls(prev => [...prev, ...successfulUrls]);
                              toast.success(`${successfulUrls.length} image(s) uploaded successfully`);
                            } else {
                              toast.error('Failed to upload images');
                            }
                          } catch {
                            toast.error('Failed to upload images');
                          } finally {
                            setIsUploading(false);
                            e.target.value = ''; // Reset input
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setUploadedImageUrls([]);
                    form.reset({
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
                  {isLoading ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || 0}
                        />
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
                      <FormLabel>Stock</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stock status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Options Section (Edit) */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-semibold">Product Options</FormLabel>
                      <p className="text-sm text-muted-foreground">Add options like Size, Color, etc. and their possible values.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendEditOption({ name: '', values: [] })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {editOptionFields.map((field, index) => (
                      <Card key={field.id} className="border-dashed">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-4">
                              <FormField
                                control={editForm.control}
                                name={`options.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Option Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Color" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name={`options.${index}.values`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Values (Comma-separated)</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g. Red, Blue, Green"
                                        value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                        onChange={(e) => {
                                          const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                                          field.onChange(values);
                                        }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive mt-8"
                              onClick={() => removeEditOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {editOptionFields.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        const options = editForm.getValues('options') || [];
                        const generated = generateVariants(options);
                        replaceEditVariants(generated);
                      }}
                    >
                      Generate Variants
                    </Button>
                  )}
                </div>

                {/* Generated Variants Section (Edit) */}
                {editVariantFields.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <FormLabel className="text-base font-semibold">Generated Variants</FormLabel>
                    <div className="space-y-2">
                      {editVariantFields.map((field, index) => (
                        <Card key={field.id} className="border">
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm bg-muted px-2 py-1 rounded">
                                {Object.entries(field.optionValueNames || {})
                                  .map(([key, val]) => `${key}: ${val}`)
                                  .join(' / ')}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive h-8 p-0"
                                onClick={() => removeEditVariant(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={editForm.control}
                                name={`variants.${index}.price`}
                                render={({ field: { onChange, ...field } }) => (
                                  <FormItem>
                                    <FormLabel>Price (INR) *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 999"
                                        {...field}
                                        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name={`variants.${index}.comparePrice`}
                                render={({ field: { onChange, ...field } }) => (
                                  <FormItem>
                                    <FormLabel>Compare Price (INR)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="e.g. 1499 (original)"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={editForm.control}
                                name={`variants.${index}.stock`}
                                render={({ field: { onChange, ...field } }) => (
                                  <FormItem>
                                    <FormLabel>Stock Qty *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              {/* Image selector for this variant */}
                              <FormItem>
                                <FormLabel>Variant Image</FormLabel>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  value={(editForm.watch(`variants.${index}.images`) as string[] | undefined)?.[0] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    editForm.setValue(`variants.${index}.images`, val ? [val] : []);
                                  }}
                                >
                                  <option value="">— None —</option>
                                  {/* show newly uploaded images first, then existing product images */}
                                  {[...editUploadedImageUrls, ...(editingProduct?.images || [])].filter((u, i, arr) => arr.indexOf(u) === i).map((url, i) => (
                                    <option key={i} value={url}>
                                      Image {i + 1}
                                    </option>
                                  ))}
                                </select>
                                {/* Preview */}
                                {((editForm.watch(`variants.${index}.images`) as string[] | undefined)?.[0]) && (
                                  <img
                                    src={(editForm.watch(`variants.${index}.images`) as string[])[0]}
                                    alt="variant"
                                    className="mt-2 h-16 w-16 rounded object-cover border"
                                  />
                                )}
                              </FormItem>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Uploader */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Image</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {editUploadedImageUrls.length > 0 || editingProduct?.images?.[0] ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={editUploadedImageUrls[0] || editingProduct?.images?.[0] || ''}
                          alt="Product preview"
                          className="h-20 w-20 rounded-lg object-cover border"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-green-600 font-medium">✓ {editUploadedImageUrls.length > 0 ? 'New image uploaded' : 'Current image'}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{editUploadedImageUrls[0] || editingProduct?.images?.[0]}</p>
                        </div>
                        {editUploadedImageUrls.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setEditUploadedImageUrls([])}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer">
                        {isEditUploading ? (
                          <>
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                            <span className="text-sm text-gray-500">Uploading to Cloudinary...</span>
                          </>
                        ) : (
                          <>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500">Click to upload product images</span>
                            <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 10MB</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={isEditUploading}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            setIsEditUploading(true);
                            try {
                              const uploadPromises = files.map(file => productsApi.uploadImage(file));
                              const results = await Promise.all(uploadPromises);

                              const successfulUrls = results
                                .filter(result => result.success && result.data?.url)
                                .map(result => result.data!.url);

                              if (successfulUrls.length > 0) {
                                setEditUploadedImageUrls(prev => [...prev, ...successfulUrls]);
                                toast.success(`${successfulUrls.length} image(s) uploaded successfully`);
                              } else {
                                toast.error('Failed to upload images');
                              }
                            } catch {
                              toast.error('Failed to upload images');
                            } finally {
                              setIsEditUploading(false);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
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
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
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

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex gap-4">
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="h-40 w-40 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedProduct.sellerName}</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Category: {selectedProduct.categoryName || 'Uncategorized'}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={selectedProduct.stock === 'available' ? 'default' : 'secondary'}>
                      {selectedProduct.stock === 'available' ? 'Available' : 'Unavailable'}
                    </Badge>
                    {selectedProduct.isFeatured && (
                      <Badge variant="secondary">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-orange-600 mt-3">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Deity</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.deity}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Material</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.material}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dimensions</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedProduct.height}" H × {selectedProduct.weight}g
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Packaging</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.packagingType}</p>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white mt-1">{selectedProduct.description}</p>
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedProduct.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Add Subcategory Dialog */}
      <Dialog open={isQuickAddSubcategoryOpen} onOpenChange={setIsQuickAddSubcategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Subcategory</DialogTitle>
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
