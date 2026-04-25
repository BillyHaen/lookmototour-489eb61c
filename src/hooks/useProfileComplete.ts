import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type RequiredField = 'name' | 'username' | 'phone' | 'location' | 'riding_style';

export const REQUIRED_PROFILE_FIELDS: RequiredField[] = [
  'name',
  'username',
  'phone',
  'location',
  'riding_style',
];

export function useProfileComplete() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['profile-complete', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ data: prof }, { data: priv }] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, username, location, riding_style')
          .eq('user_id', user.id)
          .maybeSingle(),
        (supabase.from('profile_private') as any)
          .select('phone')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      return {
        name: (prof as any)?.name || '',
        username: (prof as any)?.username || '',
        location: (prof as any)?.location || '',
        riding_style: (prof as any)?.riding_style || '',
        phone: (priv as any)?.phone || '',
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const data = query.data;
  const missing: RequiredField[] = data
    ? REQUIRED_PROFILE_FIELDS.filter((f) => !String((data as any)[f] || '').trim())
    : [];
  const isComplete = !!data && missing.length === 0;

  return {
    isComplete,
    missing,
    isLoading: authLoading || query.isLoading,
    data,
  };
}
