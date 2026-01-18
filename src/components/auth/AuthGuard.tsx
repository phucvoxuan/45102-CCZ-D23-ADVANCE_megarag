'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardOptions {
  redirectTo?: string;
  LoadingComponent?: ComponentType;
}

/**
 * Higher-order component to protect routes
 * Usage: export default withAuthGuard(MyComponent)
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: AuthGuardOptions = {}
) {
  const { redirectTo = '/login', LoadingComponent } = options;

  return function AuthGuardedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!isLoading && !user) {
        const returnUrl = encodeURIComponent(pathname);
        router.push(`${redirectTo}?redirectTo=${returnUrl}`);
      }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Component to show content only when authenticated
 */
export function AuthRequired({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Component to show content only when NOT authenticated
 */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading || user) {
    return null;
  }

  return <>{children}</>;
}
