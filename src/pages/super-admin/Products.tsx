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
import { productsApi, categoriesApi, sellersApi } from '@/services/api';
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

// Schema for super_admin and admin (sellerId optional; defaults to "My Products")
const productFormSchemaWithSeller = z.object({
  name: z.string().min(1, 'Product name is required').min(2, 'Product name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  sellerId: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z.enum(['available', 'unavailable']),
});

// Schema for seller (sellerId not required, will be auto-set)
const productFormSchemaWithoutSeller = z.object({
  name: z.string().min(1, 'Product name is required').min(2, 'Product name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  sellerId: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  stock: z.enum(['available', 'unavailable']),
});

type ProductFormValues = z.infer<typeof productFormSchemaWithSeller>;

export default function ProductsManagement() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sellerFilter, setSellerFilter] = useState<string>('__all__');
  // Image upload state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [editUploadedImageUrl, setEditUploadedImageUrl] = useState<string>('');
  const [isEditUploading, setIsEditUploading] = useState(false);


  const isMyProductsPage = useMemo(() => location.pathname.endsWith('/my-products'), [location.pathname]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(isSeller ? productFormSchemaWithoutSeller : productFormSchemaWithSeller),
    defaultValues: {
      name: '',
      categoryId: '',
      sellerId: isSeller ? '' : '__my__',
      price: 0,
      stock: 'available',
    },
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(isSeller ? productFormSchemaWithoutSeller : productFormSchemaWithSeller),
    defaultValues: {
      name: '',
      categoryId: '',
      sellerId: isSeller ? '' : '__my__',
      price: 0,
      stock: 'available',
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
    void loadSellers();
  }, [loadProducts, loadCategories, loadSellers]);

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
      };
      if (uploadedImageUrl) {
        payload.images = [uploadedImageUrl];
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
        setUploadedImageUrl('');
        form.reset({
          name: '',
          categoryId: '',
          sellerId: isSeller ? '' : '__my__',
          price: 0,
          stock: 'available',
        });

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

  const openEditDialog = useCallback((product: Product) => {
    setEditingProduct(product);
    editForm.reset({
      name: product.name,
      categoryId: product.categoryId.toString(),
      sellerId: !isSeller && user?.id && product.sellerId === user.id ? '__my__' : (product.sellerId || ''),
      price: product.price,
      stock: product.stock,
    });
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
      };
      if (editUploadedImageUrl) {
        payload.images = [editUploadedImageUrl];
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
        setEditUploadedImageUrl('');
        editForm.reset({

          name: '',
          categoryId: '',
          sellerId: '',
          price: 0,
          stock: 'available',
        });
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
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
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
      return allColumns.filter(col => col.accessorKey !== 'categoryName');
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
            setUploadedImageUrl('');
            form.reset({
              name: '',
              categoryId: '',
              sellerId: isSeller ? '' : '__my__',
              price: 0,
              stock: 'available',
            });
          }
        }}
      >

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new product to the marketplace.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateProduct)} className="space-y-4">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
              {/* Image Uploader */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Image</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  {uploadedImageUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedImageUrl}
                        alt="Product preview"
                        className="h-20 w-20 rounded-lg object-cover border"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-green-600 font-medium">✓ Image uploaded</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{uploadedImageUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedImageUrl('')}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
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
                          <span className="text-sm text-gray-500">Click to upload product image</span>
                          <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 10MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const result = await productsApi.uploadImage(file);
                            if (result.success && result.data?.url) {
                              setUploadedImageUrl(result.data.url);
                              toast.success('Image uploaded successfully');
                            } else {
                              toast.error('Failed to upload image');
                            }
                          } catch {
                            toast.error('Failed to upload image');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setUploadedImageUrl('');
                    form.reset({
                      name: '',
                      categoryId: '',
                      sellerId: '',
                      price: 0,
                      stock: 'available',
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
            setEditUploadedImageUrl('');
            editForm.reset({
              name: '',
              categoryId: '',
              sellerId: isSeller ? '' : '__my__',
              price: 0,
              stock: 'available',
            });
          }
        }}
      >

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateProduct)} className="space-y-4">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
              {/* Image Uploader */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Image</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  {editUploadedImageUrl || editingProduct?.images?.[0] ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={editUploadedImageUrl || editingProduct?.images?.[0] || ''}
                        alt="Product preview"
                        className="h-20 w-20 rounded-lg object-cover border"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-green-600 font-medium">✓ {editUploadedImageUrl ? 'New image uploaded' : 'Current image'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{editUploadedImageUrl || editingProduct?.images?.[0]}</p>
                      </div>
                      {editUploadedImageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditUploadedImageUrl('')}
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
                          <span className="text-sm text-gray-500">Click to upload product image</span>
                          <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 10MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isEditUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsEditUploading(true);
                          try {
                            const result = await productsApi.uploadImage(file);
                            if (result.success && result.data?.url) {
                              setEditUploadedImageUrl(result.data.url);
                              toast.success('Image uploaded successfully');
                            } else {
                              toast.error('Failed to upload image');
                            }
                          } catch {
                            toast.error('Failed to upload image');
                          } finally {
                            setIsEditUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <DialogFooter>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingProduct(null);
                    editForm.reset({
                      name: '',
                      categoryId: '',
                      sellerId: '',
                      price: 0,
                      stock: 'available',
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
    </div>
  );
}
