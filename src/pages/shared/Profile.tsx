import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Lock, User, Mail, Shield, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi, productsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ── Schemas ────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ── Role label map ─────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  seller: 'Seller',
  staff: 'Staff',
  consumer: 'Consumer',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  seller: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  staff: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  consumer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function Profile() {
  const { user, fetchProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: (user as any)?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // ── Avatar upload ─────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAvatarUploading(true);
    try {
      const res = await productsApi.uploadImage(file);
      if (res.success && res.data?.url) {
        const updateRes = await authApi.updateProfile({ avatar: res.data.url });
        if (updateRes.success) {
          await fetchProfile();
          toast.success('Profile photo updated');
        } else {
          toast.error('Failed to update photo');
        }
      } else {
        toast.error('Failed to upload image');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsAvatarUploading(false);
      e.target.value = '';
    }
  };

  // ── Profile save ─────────────────────────────────────────
  const onProfileSubmit = async (values: ProfileFormValues) => {
    setIsProfileSaving(true);
    try {
      const res = await authApi.updateProfile({
        name: values.name,
        phone: values.phone || '',
      });
      if (res.success) {
        await fetchProfile();
        toast.success('Profile saved successfully');
      } else {
        toast.error('Failed to save profile');
      }
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsProfileSaving(false);
    }
  };

  // ── Password change ───────────────────────────────────────
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsPasswordSaving(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (res.success) {
        passwordForm.reset();
        toast.success('Password changed successfully');
      } else {
        toast.error('Incorrect current password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const avatarUrl = user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`;
  const roleLabel = ROLE_LABELS[user?.role || ''] || user?.role || '';
  const roleBadgeClass = ROLE_COLORS[user?.role || ''] || ROLE_COLORS.consumer;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and account security</p>
      </div>

      {/* ── Identity Banner (full width) ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <img
                src={avatarUrl}
                alt={user?.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarUploading}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isAvatarUploading
                  ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                  : <Camera className="h-6 w-6 text-white" />
                }
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass}`}>
                  {roleLabel}
                </span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">Active</Badge>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm text-muted-foreground">
                <span className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user?.email}
                </span>
                <span className="text-xs">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── LEFT: Personal Information ── */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
            <CardDescription>Update your name and phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <Input value={user?.email || ''} disabled className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </FormItem>
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 00000 00000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Input value={roleLabel} disabled className="bg-muted cursor-not-allowed" />
                </FormItem>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isProfileSaving}>
                    {isProfileSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* ── RIGHT: Change Password + Access & Role ── */}
        <div className="flex flex-col gap-4">

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" /> Change Password
              </CardTitle>
              <CardDescription>Keep your account secure with a strong password</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showCurrent ? 'text' : 'password'} placeholder="Enter current password" {...field} className="pr-10" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrent(v => !v)}>
                              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showNew ? 'text' : 'password'} placeholder="Min 6 characters" {...field} className="pr-10" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(v => !v)}>
                              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirm ? 'text' : 'password'} placeholder="Repeat new password" {...field} className="pr-10" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(v => !v)}>
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isPasswordSaving} variant="outline">
                      {isPasswordSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Access & Role (read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" /> Access & Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">Role</dt>
                  <dd><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass}`}>{roleLabel}</span></dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Account Status</dt>
                  <dd><Badge variant="outline" className="text-green-600 border-green-300 text-xs">Active</Badge></dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">User ID</dt>
                  <dd className="font-mono text-xs text-muted-foreground">{user?.id?.slice(0, 12)}…</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Member Since</dt>
                  <dd>{memberSince}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

        </div>{/* /right column */}
      </div>{/* /grid */}
    </div>
  );
}
