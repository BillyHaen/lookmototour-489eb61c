import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventType = 'impression' | 'click' | 'lead' | 'conversion';

const sessionKey = (sponsorId: string, type: EventType) => `sponsor_${type}_${sponsorId}`;

export async function trackSponsorEvent(
  sponsorId: string,
  type: EventType,
  eventId?: string,
  metadata: Record<string, any> = {},
  revenue = 0
) {
  // Debounce per session for impression/click
  if (type === 'impression' || type === 'click') {
    const key = sessionKey(sponsorId, type);
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  }
  try {
    await supabase.rpc('track_sponsor_event' as any, {
      _sponsor_id: sponsorId,
      _event_type: type,
      _event_id: eventId ?? null,
      _metadata: metadata,
      _revenue: revenue,
    });
  } catch {
    // non-blocking
  }
}

export function useImpressionTracker(sponsorId: string | undefined, eventId?: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sponsorId || !ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            trackSponsorEvent(sponsorId, 'impression', eventId);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sponsorId, eventId]);
  return ref;
}
