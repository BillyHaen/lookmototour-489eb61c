import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileComplete } from '@/hooks/useProfileComplete';
import { toast } from '@/hooks/use-toast';

export default function RequireCompleteProfile({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isComplete, isLoading, missing } = useProfileComplete();
  const location = useLocation();
  const toastedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !isLoading && user && !isComplete && !toastedRef.current) {
      toastedRef.current = true;
      toast({
        title: 'Profil belum lengkap',
        description: `Lengkapi data profil dulu (${missing.join(', ')}) untuk mengakses halaman ini.`,
        variant: 'destructive',
      });
    }
  }, [authLoading, isLoading, user, isComplete, missing]);

  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isComplete) {
    return <Navigate to="/profile?incomplete=1" replace />;
  }

  return <>{children}</>;
}
