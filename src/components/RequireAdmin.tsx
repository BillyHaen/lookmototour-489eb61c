import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';

/**
 * Synchronously hides admin route content until the auth + admin check resolves.
 * The database itself is protected by RLS; this guard simply prevents flashing
 * admin UI before the client-side role check completes, complementing
 * server-side enforcement in edge functions and RLS policies.
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
    if (!authLoading && !isLoading && user && isAdmin === false) navigate('/', { replace: true });
  }, [authLoading, isLoading, user, isAdmin, navigate]);

  if (authLoading || isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
