import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useActiveSponsors() {
  return useQuery({
    queryKey: ['sponsors', 'active'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sponsors' as any) as any)
        .select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useSponsorBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['sponsor', slug],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sponsors' as any) as any)
        .select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });
}

export function useSponsorBenefits(sponsorId: string | undefined) {
  return useQuery({
    queryKey: ['sponsor-benefits', sponsorId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sponsor_benefits' as any) as any)
        .select('*').eq('sponsor_id', sponsorId).eq('is_active', true);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!sponsorId,
  });
}

export function useSponsorMedia(sponsorId: string | undefined) {
  return useQuery({
    queryKey: ['sponsor-media', sponsorId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sponsor_media' as any) as any)
        .select('*').eq('sponsor_id', sponsorId).order('sort_order');
      if (error) throw error;
      return data as any[];
    },
    enabled: !!sponsorId,
  });
}

export function useTripSponsors(eventId: string | undefined) {
  return useQuery({
    queryKey: ['trip-sponsors', eventId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sponsor_trip_relations' as any) as any)
        .select('priority, sponsor:sponsors(*)')
        .eq('event_id', eventId)
        .order('priority', { ascending: false });
      if (error) throw error;
      return (data as any[])
        .map((r) => r.sponsor)
        .filter((s) => s && s.status === 'active');
    },
    enabled: !!eventId,
  });
}

export function useUserSponsorDeals() {
  return useQuery({
    queryKey: ['user-sponsor-deals'],
    queryFn: async () => {
      // 1) get user's confirmed events
      const { data: regs } = await supabase
        .from('event_registrations')
        .select('event_id, events(id, title, slug, date)')
        .eq('status', 'confirmed');
      const events = (regs || []).map((r: any) => r.events).filter(Boolean);
      const eventIds = events.map((e: any) => e.id);
      if (!eventIds.length) return [];

      // 2) get sponsors for those events
      const { data: rels } = await (supabase.from('sponsor_trip_relations' as any) as any)
        .select('event_id, sponsor:sponsors(*)')
        .in('event_id', eventIds);
      const sponsorEventMap = new Map<string, string[]>();
      (rels || []).forEach((r: any) => {
        if (!r.sponsor || r.sponsor.status !== 'active') return;
        const arr = sponsorEventMap.get(r.sponsor.id) || [];
        arr.push(r.event_id);
        sponsorEventMap.set(r.sponsor.id, arr);
      });
      const sponsorIds = Array.from(sponsorEventMap.keys());
      if (!sponsorIds.length) return [];

      // 3) get benefits
      const { data: benefits } = await (supabase.from('sponsor_benefits' as any) as any)
        .select('*, sponsor:sponsors(id, name, slug, logo_url)')
        .in('sponsor_id', sponsorIds)
        .eq('is_active', true);

      // 4) get user's existing claims
      const { data: claims } = await (supabase.from('sponsor_benefit_claims' as any) as any)
        .select('benefit_id, claim_code, status');
      const claimMap = new Map((claims || []).map((c: any) => [c.benefit_id, c]));

      return (benefits || []).map((b: any) => {
        const eventIdsForSponsor = sponsorEventMap.get(b.sponsor_id) || [];
        const linkedEvent = events.find((e: any) => eventIdsForSponsor.includes(e.id));
        return { ...b, linked_event: linkedEvent, claim: claimMap.get(b.id) };
      });
    },
  });
}
