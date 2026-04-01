import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sellersApi, usersApi } from '@/services/api';
import type { Seller, Admin } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SuccessModal } from '@/components/SuccessModal';
import { 
  Plus, 
  Edit2, 
  Ban, 
  CheckCircle, 
  Store,
  Package,
  ShoppingBag,
  IndianRupee,
  Eye,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const createSellerFormSchema = (isEdit: boolean = false) => z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: isEdit 
    ? z.string().transform(v => v || '').refine(v => v === '' || v.length >= 10, 'Phone must be at least 10 digits')
    : z.string().min(10, 'Phone must be at least 10 digits'),
  adminEmail: z.string().optional().or(z.literal('')).refine(
    (val) => !val || val === '' || z.string().email().safeParse(val).success,
    { message: 'Invalid admin email' }
  ),
  // commissionRate: z.number().min(0).max(50),
  status: z.enum(['active', 'inactive', 'suspended']),
});

type SellerFormValues = z.infer<ReturnType<typeof createSellerFormSchema>>;

export default function SellerManagement() {
  const { user } = useAuthStore();
  //@ts-ignore
  const isSuperAdmin = user?.role === 'super_admin';
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState<Seller | null>(null);
  const [isAddingSeller, setIsAddingSeller] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | ReactNode>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSellers = async () => {
      try {
        const response = await sellersApi.getSellers({ page: 1, limit: 100 });
        if (response.success && Array.isArray(response.data)) {
          const list = response.data as Seller[];
          setSellers(list);
        } else {
          setSellers([]);
        }
      } catch (error) {
        console.error('Failed to load sellers', error);
        setSellers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const loadAdmins = async () => {
      try {
        // Fetch both admin and super_admin roles (backend accepts both)
        const [adminResponse, superAdminResponse] = await Promise.all([
          usersApi.getUsers({ role: 'admin', page: 1, limit: 100 }),
          usersApi.getUsers({ role: 'super_admin', page: 1, limit: 100 }),
        ]);
        
        const allAdmins: Admin[] = [];
        if (adminResponse.success && Array.isArray(adminResponse.data)) {
          allAdmins.push(...(adminResponse.data as Admin[]));
        }
        if (superAdminResponse.success && Array.isArray(superAdminResponse.data)) {
          // Super admins can also be used to link sellers
          allAdmins.push(...(superAdminResponse.data as Admin[]));
        }
        
        setAdmins(allAdmins);
      } catch (error) {
        console.error('Failed to load admins', error);
        setAdmins([]);
      }
    };

    void loadSellers();
    void loadAdmins();
  }, []);

  const createSchema = useMemo(() => createSellerFormSchema(false), []);
  const editSchema = useMemo(() => createSellerFormSchema(true), []);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      businessName: '',
      name: '',
      email: '',
      phone: '',
      adminEmail: isSuperAdmin ? '' : (user?.email || ''),
      // commissionRate: 15,
      status: 'active',
    },
  });

  const editForm = useForm<SellerFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      businessName: '',
      name: '',
      email: '',
      phone: '',
      adminEmail: isSuperAdmin ? '' : (user?.email || ''),
      //commissionRate: 15,
      status: 'active',
    },
  });

  const handleAddSeller = async (data: SellerFormValues) => {
    try {
      setIsAddingSeller(true);
      // For regular admins, use their own email.
      // For super admins, use the selected adminEmail or fall back to their own email
      // (backend requires adminEmail, and super_admin is a valid role for it)
      const adminEmail = isSuperAdmin
        ? (data.adminEmail || user?.email || '')
        : (user?.email || '');

      const response = await sellersApi.createSeller({
        email: data.email,
        password: 'Seller@123', // default password for new sellers
        name: data.name,
        phone: data.phone,
        businessName: data.businessName,
        businessAddress: '', // Optional - backend will use default if empty
        gstNumber: undefined,
        adminEmail: adminEmail || undefined, // Always send when available
        // commissionRate: data.commissionRate,
      });

      if (response.success && response.data) {
        const created = response.data as Seller;
        setSellers((prev) => [...prev, created]);
        setIsAddDialogOpen(false);
        form.reset({
          businessName: '',
          name: '',
          email: '',
          phone: '',
          adminEmail: isSuperAdmin ? '' : (user?.email || ''),
          status: 'active',
        });
        // Reload sellers list to get updated data
        const refreshResponse = await sellersApi.getSellers({ page: 1, limit: 100 });
        if (refreshResponse.success && Array.isArray(refreshResponse.data)) {
          setSellers(refreshResponse.data as Seller[]);
        }
        setSuccessMessage(
  <>
    Email 1234579789 has been successfully sent to{" "}
    <a href={`mailto:${data.email}`} className="text-blue-500 underline">
      {data.email}
    </a>{" "}
    to change the password.
  </>
);
        setIsSuccessModalOpen(true);
      } else {
        // Handle API error response with detailed errors
        let errorMessage = response.message || 'Failed to create seller';
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          const fieldErrors = response.errors.map((e: any) => `${e.field || ''}: ${e.message}`).join(', ');
          errorMessage = `${errorMessage}: ${fieldErrors}`;
        }
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to create seller', error);
      let errorMessage = 'Failed to create seller. Please try again.';
      
      // Extract detailed error from response
      if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorMessage;
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const fieldErrors = errorData.errors.map((e: any) => `${e.field || ''}: ${e.message}`).join(', ');
          errorMessage = `${errorMessage}: ${fieldErrors}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsAddingSeller(false);
    }
  };

  const handleEditSeller = async (data: SellerFormValues) => {
    if (!selectedSeller) return;

    try {
      const response = await sellersApi.updateSeller(selectedSeller.id, {
        businessName: data.businessName,
        businessAddress: selectedSeller.businessAddress,
        gstNumber: selectedSeller.gstNumber,
        // commissionRate: data.commissionRate,
        status: data.status,
        name: data.name,
        phone: data.phone,
      });

      if (response.success && response.data) {
        const updated = { ...selectedSeller, ...(response.data as Seller) };
        setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setIsEditDialogOpen(false);
        setSelectedSeller(null);
      }
    } catch (error) {
      console.error('Failed to update seller', error);
    }
  };

  const handleToggleStatus = async (seller: Seller) => {
    try {
      const response = await sellersApi.toggleSellerStatus(seller.id);
      if (response.success && response.data) {
        const updated = response.data as Seller;
        setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
    } catch (error) {
      console.error('Failed to toggle seller status', error);
    }
  };

  const handleDeleteSeller = async () => {
    if (!sellerToDelete) return;

    try {
      const response = await sellersApi.deleteSeller(sellerToDelete.id);
      if (response.success) {
        setSellers((prev) => prev.filter((s) => s.id !== sellerToDelete.id));
        setIsDeleteDialogOpen(false);
        setSellerToDelete(null);
      } else {
        alert(response.message || 'Failed to delete seller');
      }
    } catch (error: any) {
      console.error('Failed to delete seller', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete seller. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const openDeleteDialog = (seller: Seller) => {
    setSellerToDelete(seller);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (seller: Seller) => {
    setSelectedSeller(seller);
    editForm.reset({
      businessName: seller.businessName,
      name: seller.name,
      email: seller.email,
      phone: seller.phone || '',
      // commissionRate: seller.commissionRate,
      status: seller.status as 'active' | 'inactive' | 'suspended',
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsViewDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns: ColumnDef<Seller>[] = useMemo(() => {
    const baseColumns: ColumnDef<Seller>[] = [
      {
        accessorKey: 'businessName',
        header: 'Seller',
        cell: ({ row }) => {
          const seller = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-semibold flex-shrink-0">
                {seller.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{seller.businessName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{seller.name}</p>
              </div>
            </div>
          );
        },
      },
    ];

    // Only show "Created By" column for Super Admin
    if (isSuperAdmin) {
      baseColumns.push({
        accessorKey: 'createdByUser',
        header: 'Created By',
        cell: ({ row }) => {
          const seller = row.original;
          const creator = seller.createdByUser || seller.admin;
          
          if (!creator) {
            return <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>;
          }
          
          return (
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{creator.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{creator.email}</p>
            </div>
          );
        },
      });
    }

    // Add remaining columns
    baseColumns.push(
      {
        accessorKey: 'totalEarnings',
        header: 'Earnings',
        cell: ({ row }) => (
          <p className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(row.original.totalEarnings)}
          </p>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'stats',
        header: 'Activity',
        cell: ({ row }) => {
          const seller = row.original;
          return (
            <div className="flex gap-3">
              <Badge variant="secondary" className="flex items-center gap-1 dark:bg-gray-700">
                <Package className="h-3 w-3" />
                {seller.productCount ?? 0}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1 dark:bg-gray-700">
                <ShoppingBag className="h-3 w-3" />
                {seller.orderCount ?? 0}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const seller = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openViewDialog(seller)}
                className="h-8 w-8 p-0"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(seller)}
                className="h-8 w-8 p-0"
                title="Edit Seller"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleStatus(seller)}
                className={`h-8 w-8 p-0 ${seller.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                title={seller.status === 'active' ? 'Suspend Seller' : 'Activate Seller'}
              >
                {seller.status === 'active' ? (
                  <Ban className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
              {isSuperAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(seller)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  title="Delete Seller"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      }
    );

    return baseColumns;
  }, [isSuperAdmin]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Management"
        description="Manage marketplace sellers and their commissions"
        icon={Store}
        actions={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
                <Plus className="mr-2 h-4 w-4" />
                Add Seller
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] dark:border-gray-700 dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Add New Seller</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Create a new seller account
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSeller)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter business name" {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact name" {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
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
                          <Input type="email" placeholder="seller@example.com" {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
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
                  {isSuperAdmin && (
                    <FormField
                      control={form.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Relation manager(Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                                <SelectValue placeholder="Relation manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                              {admins.length === 0 ? (
                                <SelectItem value="no-admin" disabled className="dark:text-gray-400">
                                  No admins available
                                </SelectItem>
                              ) : (
                                admins.map((admin) => (
                                  <SelectItem key={admin.id} value={admin.email} className="dark:text-white">
                                    {admin.email} - {admin.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {/* <FormField
                    control={form.control}
                    name="commissionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Commission Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={50} 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                            <SelectItem value="active" className="dark:text-white">Active</SelectItem>
                            <SelectItem value="inactive" className="dark:text-white">Inactive</SelectItem>
                            <SelectItem value="suspended" className="dark:text-white">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500" disabled={isAddingSeller}>
                      {isAddingSeller ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Seller'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Sellers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {sellers.filter((s) => s.status === 'active').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <IndianRupee className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(sellers.reduce((acc, s) => acc + (s.totalEarnings || 0), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Commission</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {(sellers.reduce((acc, s) => acc + s.commissionRate, 0) / sellers.length).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card> */}
        <Card className="dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <Store className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sellers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{sellers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onOpenChange={setIsSuccessModalOpen} 
        message={successMessage} 
      />

      {/* Sellers Table */}
      <Card className="dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={sellers}
            searchKey="businessName"
            searchPlaceholder="Search sellers..."
            pageSize={10}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Delete Seller</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to delete this seller? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {sellerToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-semibold flex-shrink-0">
                  {sellerToDelete.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{sellerToDelete.businessName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sellerToDelete.name} • {sellerToDelete.email}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSellerToDelete(null);
              }}
              className="dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSeller}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Seller Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Seller Details</DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white text-2xl font-semibold shadow-md flex-shrink-0">
                  {selectedSeller.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedSeller.businessName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedSeller.name}</p>
                  <StatusBadge status={selectedSeller.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSeller.email}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSeller.phone}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">GST Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedSeller.gstNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-950">
                  <p className="text-sm text-orange-600 dark:text-orange-400">Products</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {selectedSeller.productCount ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Orders</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {selectedSeller.orderCount ?? 0}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                  <p className="text-sm text-green-600 dark:text-green-400">Total Earnings</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300 line-clamp-1">
                    {formatCurrency(selectedSeller.totalEarnings)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Available Balance</p>
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedSeller.availableBalance)}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending Balance</p>
                  <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(selectedSeller.pendingBalance)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Business Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedSeller.businessAddress}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:border-gray-700 dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Seller</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update seller details and commission
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSeller)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Business Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Contact Name</FormLabel>
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
                      <Input type="email" {...field} className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={editForm.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Commission Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        max={50} 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
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
                        <SelectItem value="inactive" className="dark:text-white">Inactive</SelectItem>
                        <SelectItem value="suspended" className="dark:text-white">Suspended</SelectItem>
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
    </div>
  );
}
