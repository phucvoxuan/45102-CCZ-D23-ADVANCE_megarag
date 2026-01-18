'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Loader2, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/auth-client';
import { toast } from 'sonner';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label = 'Very weak';
  let color = 'bg-destructive';

  if (score >= 5) {
    label = 'Strong';
    color = 'bg-green-500';
  } else if (score >= 4) {
    label = 'Good';
    color = 'bg-blue-500';
  } else if (score >= 3) {
    label = 'Fair';
    color = 'bg-yellow-500';
  } else if (score >= 2) {
    label = 'Weak';
    color = 'bg-orange-500';
  }

  return { score, label, color, checks };
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // If no session and we're on this page via reset link, Supabase will
      // automatically exchange the token. Give it a moment.
      if (!session) {
        // Wait a bit for the hash to be processed
        setTimeout(async () => {
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (!newSession) {
            setIsValidToken(false);
          }
        }, 1000);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error('Please use a stronger password');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        if (error.message.includes('same as')) {
          toast.error('New password must be different from the old password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      setResetSuccess(true);
      toast.success('Password updated successfully');

      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Invalid or expired link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request new reset link</Link>
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (resetSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Password updated</CardTitle>
          <CardDescription>
            Your password has been successfully reset. Redirecting to login...
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= passwordStrength.score
                          ? passwordStrength.color
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: {passwordStrength.label}
                </p>
                <ul className="text-xs space-y-1">
                  <li className={`flex items-center gap-1 ${passwordStrength.checks.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordStrength.checks.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-1 ${passwordStrength.checks.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordStrength.checks.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-1 ${passwordStrength.checks.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {passwordStrength.checks.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    One number
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className={`pr-10 ${
                  confirmPassword && !passwordsMatch
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !passwordsMatch}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>

          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
