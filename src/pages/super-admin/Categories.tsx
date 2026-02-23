import { useEffect, useState, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { categoriesApi, productsApi } from '@/services/api';
import type { Category } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit2, Trash2, Search, X, FolderOpen, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').min(2, 'Category name must be at least 2 characters'),
  status: z.enum(['active', 'inactive']),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  noOfProducts: z.number().int().min(0, 'Number of products must be 0 or greater'),
});


type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Image Upload State
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      status: 'active',
      imageUrl: '',
      description: '',
      noOfProducts: 0,
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await productsApi.uploadImage(file);
      if (response.success && response.data) {
        setUploadedImageUrl(response.data.url);
        form.setValue('imageUrl', response.data.url); // Sync with form
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await categoriesApi.getCategories({
        page: 1,
        limit: 1000,
        search: debouncedSearchQuery || undefined,
      });
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data as Category[]);
      } else {
        const errorMsg = response.message || 'Failed to load categories';
        toast.error(errorMsg);
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Failed to load categories', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load categories. Please ensure the backend server is running and Prisma client is regenerated.';
      toast.error(errorMessage);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleCreate = async (values: CategoryFormValues) => {
    try {
      setIsLoading(true);
      const payload = {
        ...values,
        imageUrl: uploadedImageUrl || values.imageUrl,
      };

      const response = await categoriesApi.createCategory(payload);
      if (response.success && response.data) {
        toast.success('Category created successfully');
        setIsAddDialogOpen(false);
        setUploadedImageUrl('');
        form.reset({
          name: '',
          status: 'active',
          imageUrl: '',
          description: '',
          noOfProducts: 0,
        });
        // Reload categories to show the new one
        await loadCategories();
      } else {
        toast.error(response.message || 'Failed to create category');
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create category';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (values: CategoryFormValues) => {
    if (!selectedCategory) return;
    try {
      setIsLoading(true);
      const payload = {
        ...values,
        imageUrl: uploadedImageUrl || values.imageUrl,
      };

      const response = await categoriesApi.updateCategory(selectedCategory.id.toString(), payload);

      if (response.success && response.data) {
        toast.success('Category updated successfully');
        setIsEditDialogOpen(false);
        setSelectedCategory(null);
        setUploadedImageUrl('');
        form.reset({
          name: '',
          status: 'active',
          imageUrl: '',
          description: '',
          noOfProducts: 0,
        });
        // Reload categories to show the updated one
        await loadCategories();
      } else {
        toast.error(response.message || 'Failed to update category');
      }
    } catch (error: any) {
      console.error('Error updating category:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update category';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      const response = await categoriesApi.deleteCategory(selectedCategory.id.toString());

      if (response.success) {
        toast.success('Category deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
        void loadCategories();
      } else {
        toast.error(response.message || 'Failed to delete category');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete category');
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setUploadedImageUrl(category.imageUrl || '');
    form.reset({
      name: category.name,
      status: category.status,
      imageUrl: category.imageUrl || '',
      description: category.description || '',
      noOfProducts: category.noOfProducts,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const columns: ColumnDef<Category>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="font-medium">{row.getValue('id')}</div>,
      },
      {
        accessorKey: 'cid',
        header: 'CID',
        cell: ({ row }) => {
          const cid = row.original.cid || row.original.id;
          return <div className="font-mono text-xs text-muted-foreground">{cid}</div>;
        },
      },
      {
        accessorKey: 'imageUrl',
        header: 'Image',
        cell: ({ row }) => {
          const imageUrl = row.getValue('imageUrl') as string;
          return (
            <div className="w-10 h-10 rounded-md overflow-hidden border bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={row.getValue('name')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'noOfProducts',
        header: 'No. of Products',
        cell: ({ row }) => {
          const count = row.getValue('noOfProducts') as number;
          return (
            <div className="text-blue-600 font-medium">{count}</div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'));
          return <div>{date.toLocaleDateString('en-GB')} {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>;
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => {
          const date = new Date(row.getValue('updatedAt'));
          return <div>{date.toLocaleDateString('en-GB')} {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(category)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(category)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );


  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage product categories"
      // badge={categories.length.toString()}
      />

      {/* Total Categories Stat Card */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-4">
        <StatCard
          title="Total Categories"
          value={categories.length.toString()}
          icon={FolderOpen}
          className="border-l-4 border-l-blue-500"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              add category
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={categories}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setUploadedImageUrl('');
            form.reset({
              name: '',
              status: 'active',
              imageUrl: '',
              description: '',
              noOfProducts: 0,
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new product category to the system.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate as any)} className="space-y-4">

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Category Image</FormLabel>
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  {uploadedImageUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border shrink-0">
                      <img
                        src={uploadedImageUrl}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageUrl('');
                          form.setValue('imageUrl', '');
                        }}
                        className="absolute top-1 right-1 p-1 bg-destructive/90 text-white rounded-full hover:bg-destructive shadow-sm transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground bg-muted/50 shrink-0">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden"
                        id="create-category-image"
                      />
                      <label
                        htmlFor="create-category-image"
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                          }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload Image
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                      Recommended size: 500x500px. Max size: 5MB.
                    </p>
                  </div>
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Category description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    form.reset({
                      name: '',
                      status: 'active',
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

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedCategory(null);
            setUploadedImageUrl('');
            form.reset({
              name: '',
              status: 'active',
              imageUrl: '',
              description: '',
              noOfProducts: 0,
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit as any)} className="space-y-4">

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Category Image</FormLabel>
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  {uploadedImageUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border shrink-0">
                      <img
                        src={uploadedImageUrl}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageUrl('');
                          form.setValue('imageUrl', '');
                        }}
                        className="absolute top-1 right-1 p-1 bg-destructive/90 text-white rounded-full hover:bg-destructive shadow-sm transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground bg-muted/50 shrink-0">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden"
                        id="edit-category-image"
                      />
                      <label
                        htmlFor="edit-category-image"
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md shadow-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                          }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Change Image
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Category description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="noOfProducts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. of Products</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedCategory(null);
                    form.reset({
                      name: '',
                      status: 'active',
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category "{selectedCategory?.name}". This action cannot be undone.
              {selectedCategory && selectedCategory.productCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This category has {selectedCategory.productCount} product(s) associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

