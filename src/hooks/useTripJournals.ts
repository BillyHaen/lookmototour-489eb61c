import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTripJournals(includeAll = false) {
  return useQuery({
    queryKey: ['trip-journals', includeAll],
    queryFn: async () => {
      let query = supabase.from('trip_journals').select('*').order('created_at', { ascending: false });
      if (!includeAll) query = query.eq('status', 'published');
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useTripJournal(slug: string) {
  return useQuery({
    queryKey: ['trip-journal', slug],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const column = isUuid ? 'id' : 'slug';
      const { data, error } = await supabase.from('trip_journals').select('*').eq(column, slug).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useTripJournalImages(journalId: string) {
  return useQuery({
    queryKey: ['trip-journal-images', journalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_journal_images')
        .select('*')
        .eq('journal_id', journalId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!journalId,
  });
}

export function useTripJournalParticipants(journalId: string) {
  return useQuery({
    queryKey: ['trip-journal-participants', journalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_journal_participants')
        .select('*')
        .eq('journal_id', journalId);
      if (error) throw error;

      const userIds = (data || []).map(p => p.user_id);
      const profiles: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', userIds);
        (profileData || []).forEach(p => {
          profiles[p.user_id] = p;
        });
      }

      // Get registration counts for badges
      const regCounts: Record<string, number> = {};
      if (userIds.length > 0) {
        for (const uid of userIds) {
          const { count } = await supabase
            .from('event_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('status', 'confirmed');
          regCounts[uid] = count || 0;
        }
      }

      return (data || []).map(p => ({
        ...p,
        name: profiles[p.user_id]?.name || 'Anonim',
        avatar_url: profiles[p.user_id]?.avatar_url || null,
        event_count: regCounts[p.user_id] || 0,
      }));
    },
    enabled: !!journalId,
  });
}
