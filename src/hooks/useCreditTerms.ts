import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const KEY = 'credit_terms';

export function useCreditTerms() {
  return useQuery({
    queryKey: ['site-settings', KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      if (error) throw error;
      return ((data?.value as any)?.html as string) || '';
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateCreditTerms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (html: string) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: KEY, value: { html } } as any, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site-settings', KEY] }),
  });
}
