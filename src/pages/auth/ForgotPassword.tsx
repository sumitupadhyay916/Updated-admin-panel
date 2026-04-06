import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.requestPasswordResetOtp({ email });
      if (response.success) {
        toast.success(response.message || 'OTP sent successfully!');
        // Seamlessly navigate to dedicated OTP verification screen
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(response.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
            Forgot Password
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enter your email to receive a password reset OTP
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Get OTP'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="w-full text-center">
            <Link 
              to="/login"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
