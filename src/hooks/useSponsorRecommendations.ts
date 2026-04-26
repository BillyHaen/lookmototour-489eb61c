import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecommendationContext {
  event_id?: string;
  page?: string;
}

export interface SponsorRecommendation {
  sponsor: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    tagline: string | null;
    category: string;
  };
  score: number;
  reason: Record<string, number>;
}

export function useSponsorRecommendations(opts?: {
  context?: RecommendationContext;
  limit?: number;
  fast?: boolean;
  enabled?: boolean;
  targetUserId?: string;
}) {
  const { context, limit = 10, fast = false, enabled = true, targetUserId } = opts || {};
  return useQuery({
    queryKey: ['sponsor-recommendations', context, limit, fast, targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('recommend-sponsors', {
        body: { context, limit, fast, target_user_id: targetUserId },
      });
      if (error) throw error;
      return (data?.recommendations || []) as SponsorRecommendation[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
