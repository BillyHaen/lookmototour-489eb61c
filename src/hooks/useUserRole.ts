import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'admin' | 'vendor' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRole> => {
      if (!user) return 'user';
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' as any });
      if (isAdmin) return 'admin';
      const { data: isVendor } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'vendor' as any });
      if (isVendor) return 'vendor';
      return 'user';
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
