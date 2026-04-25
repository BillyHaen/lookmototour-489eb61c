import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: 'trips' | 'km' | 'locations';
  threshold: number;
  sort_order: number;
}

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements-all'],
    queryFn: async () => {
      const { data } = await (supabase.from('achievements' as any) as any).select('*').order('sort_order');
      return (data as Achievement[]) || [];
    },
  });
}

export function useUserAchievements(userId?: string) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await (supabase.rpc as any)('get_rider_achievements', { _user_id: userId });
      return (data as { achievement_code: string; unlocked_at: string }[]) || [];
    },
    enabled: !!userId,
  });
}
