import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { usersApi, categoriesApi, adminCategoriesApi } from '@/services/api';
import type { Admin, Category } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Edit2, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Shield,
  Phone,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';

const adminFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  status: z.enum(['active', 'suspended', 'inactive']),
});

type AdminFormValues = z.infer<typeof adminFormSchema>;

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await usersApi.getUsers({ role: 'admin', page: 1, limit: 100 });
        if (response.success && Array.isArray(response.data)) {
          setAdmins(response.data as Admin[]);
        } else {
          setAdmins([]);
        }
      } catch (error) {
        console.error('Failed to load admins', error);
        setAdmins([]);
      }
    };

    const loadCategories = async () => {
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
    };

    void loadAdmins();
    void loadCategories();
  }, []);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'active',
    },
  });

  const editForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'active',
    },
  });

  const handleAddAdmin = async (data: AdminFormValues) => {
    try {
      const response = await usersApi.createUser({
        email: data.email,
        password: 'Admin@123', // default password for new admins
        name: data.name,
        phone: data.phone,
        role: 'admin',
        status: data.status,
      });

      if (response.success && response.data) {
        const created = response.data as Admin;
        setAdmins((prev) => [...prev, created]);
        setIsAddDialogOpen(false);
        form.reset();
        toast.success('Admin created successfully');
      } else {
        toast.error(response.message || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Failed to create admin', error);
      toast.error('Failed to create admin');
    }
  };

  const handleEditAdmin = async (data: AdminFormValues) => {
    if (!selectedAdmin) return;

    try {
      const response = await usersApi.updateUser(selectedAdmin.id, {
        name: data.name,
        phone: data.phone,
        status: data.status,
      });

      if (response.success && response.data) {
        const updated = response.data as Admin;
        setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setIsEditDialogOpen(false);
        setSelectedAdmin(null);
        toast.success('Admin updated successfully');
      } else {
        toast.error(response.message || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Failed to update admin', error);
      toast.error('Failed to update admin');
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    try {
      const response = await usersApi.toggleUserStatus(admin.id);
      if (response.success && response.data) {
        const updated = response.data as Admin;
        setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        toast.success(`Admin ${updated.status === 'active' ? 'activated' : 'suspended'} successfully`);
      } else {
        toast.error(response.message || 'Failed to toggle admin status');
      }
    } catch (error) {
      console.error('Failed to toggle admin status', error);
      toast.error('Failed to toggle admin status');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const response = await usersApi.deleteUser(adminId);
      if (response.success) {
        setAdmins((prev) => prev.filter((a) => a.id !== adminId));
        toast.success('Admin deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Failed to delete admin', error);
      toast.error('Failed to delete admin');
    }
  };

  const openEditDialog = (admin: Admin) => {
    setSelectedAdmin(admin);
    editForm.reset({
      name: admin.name,
      email: admin.email,
      phone: admin.phone || '',
      status: admin.status,
    });
    setIsEditDialogOpen(true);
  };

  const openCategoryDialog = async (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsLoadingCategories(true);
    try {
      const response = await adminCategoriesApi.getAdminCategories(admin.id);
      if (response.success && Array.isArray(response.data)) {
        const assignedCategories = response.data as Category[];
        setSelectedCategoryIds(assignedCategories.map((c) => c.id));
      } else {
        setSelectedCategoryIds([]);
      }
    } catch (error) {
      console.error('Failed to load admin categories', error);
      setSelectedCategoryIds([]);
    } finally {
      setIsLoadingCategories(false);
      setIsCategoryDialogOpen(true);
    }
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleAssignCategories = async () => {
    if (!selectedAdmin) return;

    try {
      setIsLoadingCategories(true);
      const response = await adminCategoriesApi.assignCategoriesToAdmin(
        selectedAdmin.id,
        selectedCategoryIds,
      );
      if (response.success) {
        toast.success('Categories assigned successfully');
        setIsCategoryDialogOpen(false);
        setSelectedAdmin(null);
        setSelectedCategoryIds([]);
      } else {
        toast.error(response.message || 'Failed to assign categories');
      }
    } catch (error: any) {
      console.error('Failed to assign categories', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to assign categories';
      toast.error(errorMessage);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const columns: ColumnDef<Admin>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Admin',
      cell: ({ row }: { row: { original: Admin } }) => {
        const admin = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-semibold">
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{admin.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{admin.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }: { row: { original: Admin } }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.original.phone || 'N/A'}
          </span>
        </div>
      ),
    },
    // {
    //   accessorKey: 'permissions',
    //   header: 'Permissions',
    //   cell: ({ row }: { row: { original: Admin } }) => {
    //     const permissions = row.original.permissions || [];
    //     return (
    //       <div className="flex flex-wrap gap-1">
    //         {permissions.slice(0, 2).map((perm) => (
    //           <Badge key={perm} variant="secondary" className="text-xs">
    //             {perm}
    //           </Badge>
    //         ))}
    //         {permissions.length > 2 && (
    //           <Badge variant="secondary" className="text-xs">
    //             +{permissions.length - 2}
    //           </Badge>
    //         )}
    //         {permissions.length === 0 && (
    //           <span className="text-xs text-gray-400">No permissions</span>
    //         )}
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Admin } }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: Admin } }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Admin } }) => {
        const admin = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(admin)}
              className="h-8 w-8 p-0"
              title="Edit Admin"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openCategoryDialog(admin)}
              className="h-8 w-8 p-0"
              title="Assign Categories"
            >
              <FolderTree className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(admin)}
              className={`h-8 w-8 p-0 ${admin.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
              title={admin.status === 'active' ? 'Suspend Admin' : 'Activate Admin'}
            >
              {admin.status === 'active' ? (
                <Ban className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAdmin(admin.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="Delete Admin"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  const activeCount = admins.filter((a) => a.status === 'active').length;
  const suspendedCount = admins.filter((a) => a.status === 'suspended').length;
  const totalCount = admins.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Management"
        description="Manage platform administrators and their permissions"
        icon={Shield}
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
                <Plus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] dark:border-gray-700 dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Add New Admin</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Create a new administrator account
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddAdmin)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter admin name" {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@example.com" {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91-9876543210" {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
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
                        <FormLabel className="dark:text-gray-300">Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                            <SelectItem value="active" className="dark:text-white">Active</SelectItem>
                            <SelectItem value="suspended" className="dark:text-white">Suspended</SelectItem>
                            <SelectItem value="inactive" className="dark:text-white">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500">
                      Create Admin
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Admins</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
              <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{suspendedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Admins</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins Table */}
      <Card className="dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={admins}
            searchKey="name"
            searchPlaceholder="Search admins..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Admin</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update administrator details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditAdmin)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Phone</FormLabel>
                    <FormControl>
                      <Input {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                        <SelectItem value="active" className="dark:text-white">Active</SelectItem>
                        <SelectItem value="suspended" className="dark:text-white">Suspended</SelectItem>
                        <SelectItem value="inactive" className="dark:text-white">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Categories Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open);
        if (!open) {
          setSelectedAdmin(null);
          setSelectedCategoryIds([]);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] dark:border-gray-700 dark:bg-gray-800 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Assign Categories to {selectedAdmin?.name}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Select categories that this admin can access. Only assigned categories and their products will be visible to this admin.
            </DialogDescription>
          </DialogHeader>
          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {categories.filter(cat => cat.status === 'active').length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No active categories available
                  </p>
                ) : (
                  categories
                    .filter((cat) => cat.status === 'active')
                    .map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700"
                      >
                        <Checkbox
                          checked={selectedCategoryIds.includes(category.id)}
                          onCheckedChange={() => handleToggleCategory(category.id)}
                          id={`category-${category.id}`}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {category.productCount || 0} products
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCategoryDialogOpen(false);
                    setSelectedAdmin(null);
                    setSelectedCategoryIds([]);
                  }}
                  className="dark:border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAssignCategories}
                  disabled={isLoadingCategories}
                  className="bg-gradient-to-r from-orange-500 to-amber-500"
                >
                  {isLoadingCategories ? 'Assigning...' : 'Assign Categories'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
