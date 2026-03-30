import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const activateFormSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ActivateFormValues = z.infer<typeof activateFormSchema>;

export default function ActivateSeller() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [userData, setUserData] = useState<{ email: string; name: string } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const form = useForm<ActivateFormValues>({
    resolver: zodResolver(activateFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await authApi.verifyActivationToken(token);
        if (response.success && response.data) {
          setUserData(response.data);
        } else {
          setVerificationError(response.message || 'Invalid or expired activation link');
        }
      } catch (error: any) {
        setVerificationError(error?.response?.data?.message || 'Invalid or expired activation link');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ActivateFormValues) => {
    if (!token) {
      toast.error('Invalid or missing activation token');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authApi.activateSeller({
        token,
        password: data.password,
      });

      if (response?.success && response?.data) {
        // Update auth store with new user and token
        useAuthStore.setState({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
        });
        
        toast.success('Account activated successfully! Redirecting...');

        const userRole = response?.data?.user?.role;
        
        // Navigate based on role
        if (userRole === 'seller' || userRole === 'staff') {
          navigate('/seller', { replace: true });
        } else if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else if (userRole === 'super_admin') {
          navigate('/super-admin', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } else {
        toast.error(response.message || 'Failed to activate account');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to activate account');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-gray-500 dark:text-gray-400">Verifying activation link...</p>
        </div>
      </div>
    );
  }

  if (!token || verificationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Invalid Link
          </h2>
          <p className="font-medium text-gray-500">
            {verificationError || 'Activation token is missing or invalid. Please check your email link.'}
          </p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Store className="h-6 w-6 text-orange-600 dark:text-orange-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome, {userData?.name}!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Set your password for <strong>{userData?.email}</strong> to activate your seller account.
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white px-4 py-8 shadow dark:bg-gray-800 sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:ring-orange-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  'Set Password & Login'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
