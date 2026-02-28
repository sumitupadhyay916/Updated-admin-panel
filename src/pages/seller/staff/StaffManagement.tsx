import { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Shield, Mail, Phone, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { staffApi } from '@/services/api';

// Define typical permissions for a seller's staff
const AVAILABLE_PERMISSIONS = [
  { id: 'manage_products', label: 'Manage Products' },
  { id: 'manage_orders', label: 'Manage Orders' },
  { id: 'manage_inventory', label: 'Manage Inventory' },
  { id: 'manage_coupons', label: 'Manage Coupons' },
  { id: 'manage_payouts', label: 'View Payouts' },
];

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const res = await staffApi.getStaff();
      if (res.success) {
        setStaff(res.data as any[]);
      }
    } catch (error) {
      console.error('Fetch staff error:', error);
      toast.error('Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (staffMember: any = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setName(staffMember.name || '');
      setEmail(staffMember.email || '');
      setPhone(staffMember.phone || '');
      setPassword(''); // Don't populate existing password
      setRole(staffMember.role || 'Staff');
      setPermissions(staffMember.permissions || []);
    } else {
      setEditingStaff(null);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('Staff');
      setPermissions([]);
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    if (permissions.includes(permId)) {
      setPermissions(permissions.filter(p => p !== permId));
    } else {
      setPermissions([...permissions, permId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name,
        phone,
        role,
        permissions
      };

      if (!editingStaff) {
        payload.email = email;
        payload.password = password;
      } else if (password) {
        payload.password = password; // Only send password on update if changed
      }

      const res = editingStaff 
        ? await staffApi.updateStaff(editingStaff.id, payload)
        : await staffApi.createStaff(payload);
      
      if (res.success) {
        toast.success(editingStaff ? 'Staff updated successfully' : 'Staff added successfully');
        setIsModalOpen(false);
        fetchStaff();
      } else {
        toast.error(res.message || 'Error saving staff');
      }
    } catch (error) {
      console.error('Save staff error:', error);
      toast.error('Failed to save staff');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      const res = await staffApi.deleteStaff(id);
      
      if (res.success) {
        toast.success('Staff member removed');
        fetchStaff();
      } else {
        toast.error(res.message || 'Error deleting staff');
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      toast.error('Failed to delete staff');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            My Staff
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your store's staff members and their permissions.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No staff members yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Add your first staff member to help manage your store.
          </p>
          <Button onClick={() => handleOpenModal()} className="mt-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Staff Member
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Permissions</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                          alt={member.name}
                          className="h-10 w-10 rounded-full bg-gray-100"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="h-3 w-3" /> {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="h-3 w-3" /> {member.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="capitalize">
                        {member.role || 'Staff'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 w-48">
                        {member.permissions?.map((perm: string) => (
                          <Badge key={perm} variant="outline" className="text-[10px]">
                            {perm.replace('manage_', '')}
                          </Badge>
                        ))}
                        {(!member.permissions || member.permissions.length === 0) && (
                          <span className="text-xs italic text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(member)}
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled={!!editingStaff}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Internal Role Title</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Manager, Support Agent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {editingStaff ? 'New Password (leave blank to keep current)' : 'Password *'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingStaff ? '••••••••' : 'Enter password'}
                  required={!editingStaff}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Staff Permissions
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
