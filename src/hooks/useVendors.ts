import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVendors(activeOnly = true) {
  return useQuery({
    queryKey: ['vendors', activeOnly],
    queryFn: async () => {
      let q = (supabase.from('vendors') as any).select('*').order('name');
      if (activeOnly) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}
