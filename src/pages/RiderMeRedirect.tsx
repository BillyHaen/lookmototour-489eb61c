import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyUsername } from '@/hooks/useRider';

export default function RiderMeRedirect() {
  const { user, loading } = useAuth();
  const { data: username, isLoading } = useMyUsername();

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!username) return <Navigate to="/profile" replace />;
  return <Navigate to={`/riders/${username}`} replace />;
}
