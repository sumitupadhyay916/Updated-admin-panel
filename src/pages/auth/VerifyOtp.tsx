import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/api';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please request a new OTP.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.verifyPasswordResetOtp({ email, otp: code });
      if (response.success) {
        toast.success(response.message || 'OTP verified');
        navigate('/reset-password', { state: { email, otp: code } });
      } else {
        setError(response.message || 'Invalid or expired OTP');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Invalid or expired OTP. Please try again.');
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
            Verify Your OTP
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            We have sent an OTP to {email}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="dark:text-gray-300">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="dark:border-gray-700 dark:bg-gray-800 dark:text-white tracking-[0.5em] text-center"
                maxLength={6}
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
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="w-full text-center">
            <Link 
              to="/forgot-password"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Email
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
