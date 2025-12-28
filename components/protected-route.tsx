'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAuthModal } from '@/hooks/use-auth-modal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { openSignIn } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Open sign in modal instead of redirecting
      openSignIn();
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo, openSignIn]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
