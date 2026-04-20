import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useFollow(targetUserId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: isFollowing } = useQuery({
    queryKey: ['follow-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) return false;
      const { count } = await (supabase.from('follows' as any) as any)
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      return (count || 0) > 0;
    },
    enabled: !!user && !!targetUserId && user?.id !== targetUserId,
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user || !targetUserId) throw new Error('Login dulu');
      if (isFollowing) {
        const { error } = await (supabase.from('follows' as any) as any)
          .delete().eq('follower_id', user.id).eq('following_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('follows' as any) as any)
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-status'] });
      qc.invalidateQueries({ queryKey: ['rider'] });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  return { isFollowing: !!isFollowing, toggle };
}
