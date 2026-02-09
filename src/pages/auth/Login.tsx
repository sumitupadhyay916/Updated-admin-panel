import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Loader2, Moon, Sun, Sparkles } from 'lucide-react';
import type { UserRole } from '@/types';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'seller', label: 'Seller' },
];

const mockCredentials: Record<string, { email: string; password: string }> = {
  super_admin: { email: 'super@divine.com', password: 'admin123' },
  admin: { email: 'admin@divine.com', password: 'admin123' },
  seller: { email: 'seller@divine.com', password: 'seller123' },
};

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (value: UserRole) => {
    setRole(value);
    setEmail(mockCredentials[value].email);
    setPassword(mockCredentials[value].password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login({ email, password, role });
    
    if (success) {
      // Redirect based on role
      switch (role) {
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'seller':
          navigate('/seller');
          break;
        default:
          navigate('/');
      }
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-0 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Innorade
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="dark:text-gray-300">Login As</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger className="dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
                  {roleOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="dark:text-white"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <Badge variant="outline" className="text-xs dark:border-gray-700 dark:text-gray-400">
              Demo Mode
            </Badge>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Default Credentials (auto-filled):</p>
            <p className="mt-1 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {mockCredentials[role].email} / {mockCredentials[role].password}
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
