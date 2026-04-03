import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

type Step = 'REQUEST_OTP' | 'VERIFY_RESET' | 'SUCCESS';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>('REQUEST_OTP');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.requestPasswordResetOtp({ email });
      if (response.success) {
        toast.success(response.message || 'OTP sent successfully!');
        setStep('VERIFY_RESET');
      } else {
        setError(response.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({ email, otp, newPassword });
      if (response.success) {
        toast.success(response.message || 'Password reset successfully!');
        setStep('SUCCESS');
      } else {
        setError(response.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
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
            {step === 'REQUEST_OTP' && 'Reset Password'}
            {step === 'VERIFY_RESET' && 'Enter OTP'}
            {step === 'SUCCESS' && 'Success'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {step === 'REQUEST_OTP' && 'Enter your email to receive a password reset OTP'}
            {step === 'VERIFY_RESET' && 'We have sent an OTP to your email'}
            {step === 'SUCCESS' && 'Your password has been changed successfully'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* STEP 1: REQUEST OTP */}
          {step === 'REQUEST_OTP' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
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
          )}

          {/* STEP 2: VERIFY AND RESET */}
          {step === 'VERIFY_RESET' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="dark:text-gray-300">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter the 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-white tracking-[0.5em] text-center"
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="dark:text-gray-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="dark:text-gray-300">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-center text-gray-600 dark:text-gray-400">
                You can now login with your new password.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 mt-4"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>

        {step !== 'SUCCESS' && (
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
        )}
      </Card>
    </div>
  );
}
