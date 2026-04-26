import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RiderProfile {
  user_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  riding_style: string | null;
  location: string | null;
  total_trips: number;
  total_km: number;
  trust_score: number;
  follower_count: number;
  following_count: number;
  member_since: string;
}

export function useRider(username?: string) {
  return useQuery({
    queryKey: ['rider', username?.toLowerCase()],
    queryFn: async (): Promise<RiderProfile | null> => {
      if (!username) return null;
      const { data, error } = await supabase.rpc('get_rider_public_profile' as any, { _username: username });
      if (error) throw error;
      const row = (data as any[])?.[0];
      return row ? (row as RiderProfile) : null;
    },
    enabled: !!username,
  });
}

export function useMyUsername() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-username', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle();
      return (data as any)?.username as string | null;
    },
    enabled: !!user,
  });
}

export function buildRiderShareCopy(rider: Pick<RiderProfile, 'name'>, badge: string) {
  const title = `Riders ${rider.name} – ${badge} | LOOKMOTOTOUR`;
  const description = `Riders ${rider.name} – ${badge} ada di LOOKMOTOTOUR. Ayo gabung di platform ekosistem motor terbesar di Indonesia bersama ratusan ribu riders!`;
  return { title, text: description };
}

export function useRiderTrips(userId?: string) {
  return useQuery({
    queryKey: ['rider-trips', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, status, created_at, events(id, slug, title, location, date, end_date, image_url, status)')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });
}
