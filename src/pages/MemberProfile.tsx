import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function MemberProfile() {
  const { userId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['member-username-redirect', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase.from('profiles').select('username').eq('user_id', userId).maybeSingle();
      return (data as any)?.username || null;
    },
    enabled: !!userId,
  });
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <Navigate to="/" replace />;
  return <Navigate to={`/riders/${data}`} replace />;
}
