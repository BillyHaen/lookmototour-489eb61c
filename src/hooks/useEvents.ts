import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbEvent = Tables<'events'>;

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
        .neq('status', 'draft')
        .order('date', { ascending: true });
      if (error) throw error;
      return data as DbEvent[];
    },
  });
}

export function useEvent(slug: string | undefined) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: async () => {
      if (!slug) return null;
      // Try slug first, fall back to id for backwards compatibility
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const column = isUuid ? 'id' : 'slug';
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq(column, slug)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return data as DbEvent;
    },
    enabled: !!slug,
  });
}
