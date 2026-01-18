'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  CreditCard,
  Calendar,
  Shield,
  Loader2,
  Check,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';

interface ProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  organization_name: string | null;
  job_title: string | null;
  role: string | null;
  updated_at: string | null;
  subscription?: {
    plan_name: string;
    status: string;
    billing_cycle: string;
    current_period_end: string | null;
  };
}

export default function ProfilePage() {
  const { user, subscription, isLoading: authLoading, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useTranslation();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/admin/profile', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      setProfile(result.data);
      // Initialize form fields
      setFullName(result.data.full_name || '');
      setPhone(result.data.phone || '');
      setOrganizationName(result.data.organization_name || '');
      setJobTitle(result.data.job_title || '');
    } catch (err) {
      console.error('[Profile] Failed to fetch:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchProfile();
  }, [authLoading, user, fetchProfile]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          organization_name: organizationName,
          job_title: jobTitle,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save profile');
      }

      setProfile(result.data);
      setSuccess(String(t('profile.updateSuccess')));

      // Refresh profile in AuthContext
      await refreshProfile();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[Profile] Failed to save:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Show skeleton while loading
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sign-in prompt if no user
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">{String(t('profile.pleaseSignIn'))}</p>
        <Button asChild>
          <Link href="/auth/signin">{String(t('common.signIn'))}</Link>
        </Button>
      </div>
    );
  }

  const subscriptionInfo = profile?.subscription || {
    plan_name: subscription?.plan_name || 'FREE',
    status: subscription?.status || 'active',
    billing_cycle: 'monthly',
    current_period_end: null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{String(t('profile.title'))}</h1>
        <p className="text-muted-foreground">{String(t('profile.subtitle'))}</p>
      </div>

      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchProfile} className="ml-auto">
                {String(t('common.retry'))}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {String(t('profile.profileInformation'))}
          </CardTitle>
          <CardDescription>{String(t('profile.updatePersonalInfo'))}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                getInitials(fullName || profile?.full_name || null, profile?.email || null)
              )}
            </div>
            <div>
              <p className="font-medium">{fullName || profile?.full_name || String(t('profile.noNameSet'))}</p>
              <p className="text-sm text-muted-foreground">{profile?.email || user.email}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {String(t('profile.fullName'))}
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={String(t('profile.enterFullName'))}
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                value={profile?.email || user.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {String(t('profile.phone'))}
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={String(t('profile.enterPhone'))}
              />
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="organization" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {String(t('profile.organization'))}
              </Label>
              <Input
                id="organization"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder={String(t('profile.enterOrganization'))}
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                {String(t('profile.jobTitle'))}
              </Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={String(t('profile.enterJobTitle'))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {String(t('profile.subscription'))}
          </CardTitle>
          <CardDescription>{String(t('profile.subscriptionDescription'))}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{subscriptionInfo.plan_name}</span>
                  <Badge variant={subscriptionInfo.status === 'active' ? 'default' : 'secondary'}>
                    {subscriptionInfo.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {String(t('profile.billing'))}: {subscriptionInfo.billing_cycle}
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/billing">{String(t('profile.manageBilling'))}</Link>
            </Button>
          </div>

          {subscriptionInfo.current_period_end && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {String(t('profile.nextBillingDate'))}: {new Date(subscriptionInfo.current_period_end).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {String(t('profile.saving'))}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {String(t('profile.saveChanges'))}
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link href="/auth/reset-password">
                <KeyRound className="h-4 w-4 mr-2" />
                {String(t('profile.changePassword'))}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
