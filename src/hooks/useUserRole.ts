import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'admin' | 'vendor' | 'user';

export async function resolveUserRole(userId?: string | null): Promise<UserRole> {
  if (!userId) return 'user';

  const [{ data: isAdmin }, { data: isVendorByRole }, { data: linkedVendors, error: vendorLinkError }] = await Promise.all([
    supabase.rpc('has_role', { _user_id: userId, _role: 'admin' as any }),
    supabase.rpc('has_role', { _user_id: userId, _role: 'vendor' as any }),
    (supabase.from('vendors') as any).select('id').eq('owner_user_id', userId).limit(1),
  ]);

  if (isAdmin) return 'admin';
  if (isVendorByRole) return 'vendor';
  if (!vendorLinkError && Array.isArray(linkedVendors) && linkedVendors.length > 0) return 'vendor';

  return 'user';
}

export function useUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRole> => resolveUserRole(user?.id),
    enabled: !!user,
    staleTime: 60_000,
  });
}
