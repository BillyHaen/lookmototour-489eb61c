import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TrackingSession {
  id: string;
  event_id: string;
  user_id: string;
  google_maps_url: string;
  status: 'active' | 'ended';
  started_at: string;
  ended_at: string | null;
  expires_at: string;
  notes: string | null;
}

export interface TrackingRecipient {
  id: string;
  session_id: string;
  name: string;
  phone: string;
  access_token: string;
  last_accessed_at: string | null;
  created_at: string;
}

export function useMyTrackingSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tracking-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('tracking_sessions' as any) as any)
        .select('*, events(title, location, date, end_date)')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useActiveTrackingCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tracking-active-count', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('user_has_active_tracking');
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

export function useIsConfirmedParticipant(eventId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-confirmed', user?.id, eventId],
    queryFn: async () => {
      if (!eventId || !user) return false;
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user && !!eventId,
  });
}

export function useStartTrackingSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { eventId: string; googleMapsUrl: string; notes?: string; expiresAt: string }) => {
      const { data, error } = await (supabase.from('tracking_sessions' as any) as any)
        .insert({
          event_id: params.eventId,
          user_id: user!.id,
          google_maps_url: params.googleMapsUrl,
          notes: params.notes || '',
          expires_at: params.expiresAt,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracking-sessions'] });
      qc.invalidateQueries({ queryKey: ['tracking-active-count'] });
    },
  });
}

export function useEndTrackingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await (supabase.from('tracking_sessions' as any) as any)
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracking-sessions'] });
      qc.invalidateQueries({ queryKey: ['tracking-active-count'] });
    },
  });
}

export function useTrackingRecipients(sessionId?: string) {
  return useQuery({
    queryKey: ['tracking-recipients', sessionId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('tracking_recipients' as any) as any)
        .select('*').eq('session_id', sessionId).order('created_at');
      if (error) throw error;
      return data as TrackingRecipient[];
    },
    enabled: !!sessionId,
  });
}

export function useAddRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { sessionId: string; name: string; phone: string }) => {
      const { data, error } = await (supabase.from('tracking_recipients' as any) as any)
        .insert({ session_id: params.sessionId, name: params.name, phone: params.phone })
        .select()
        .single();
      if (error) throw error;
      return data as TrackingRecipient;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tracking-recipients', vars.sessionId] });
    },
  });
}

export function useRemoveRecipient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; sessionId: string }) => {
      const { error } = await (supabase.from('tracking_recipients' as any) as any)
        .delete().eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tracking-recipients', vars.sessionId] });
    },
  });
}
