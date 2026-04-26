import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useEndorsements(userId?: string) {
  return useQuery({
    queryKey: ['endorsements', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: rows } = await (supabase.from('endorsements' as any) as any)
        .select('*').eq('to_user_id', userId).order('created_at', { ascending: false });
      const list = (rows as any[]) || [];
      const ids = Array.from(new Set(list.map(r => r.from_user_id)));
      if (ids.length === 0) return list;
      const { data: profs } = await supabase.from('profiles').select('user_id, name, username, avatar_url').in('user_id', ids);
      const map = new Map((profs as any[] || []).map(p => [p.user_id, p]));
      return list.map(r => ({ ...r, from_profile: map.get(r.from_user_id) }));
    },
    enabled: !!userId,
  });
}

export function useCreateEndorsement(toUserId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rating, content }: { rating: number; content: string }) => {
      if (!user) throw new Error('Login dulu');
      const { error } = await (supabase.from('endorsements' as any) as any).insert({
        from_user_id: user.id, to_user_id: toUserId, rating, content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endorsements', toUserId] });
      qc.invalidateQueries({ queryKey: ['rider'] });
      toast({ title: 'Endorsement terkirim ✅' });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });
}
