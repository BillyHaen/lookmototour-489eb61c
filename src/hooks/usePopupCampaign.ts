import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PopupSlide {
  id: string;
  campaign_id: string;
  order_index: number;
  image_url: string | null;
  content_html: string;
  cta_label: string | null;
  cta_url: string | null;
}

export interface PopupCampaign {
  id: string;
  name: string;
  is_active: boolean;
  force_show_logged_in: boolean;
  start_at: string | null;
  end_at: string | null;
  target_device: 'all' | 'mobile' | 'desktop';
  frequency: 'once' | 'daily' | 'every_session' | 'always';
  priority: number;
  ab_enabled: boolean;
  ab_variant: 'A' | 'B' | null;
  ab_group_key: string | null;
  slides: PopupSlide[];
}

const SESSION_KEY = 'lmt_popup_session';
const VARIANT_PREFIX = 'lmt_popup_variant_';
const SEEN_PREFIX = 'lmt_popup_seen_';

function getOrCreateSessionId(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = (crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return `s_${Date.now()}`;
  }
}

function detectDevice(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
}

function alreadySeen(c: PopupCampaign): boolean {
  if (c.frequency === 'always') return false;
  try {
    const key = SEEN_PREFIX + c.id;
    const v = localStorage.getItem(key);
    if (!v) return false;
    if (c.frequency === 'once') return true;
    if (c.frequency === 'every_session') {
      const sess = sessionStorage.getItem(`${key}_sess`);
      return sess === '1';
    }
    if (c.frequency === 'daily') {
      const last = parseInt(v, 10);
      return Date.now() - last < 24 * 60 * 60 * 1000;
    }
    return false;
  } catch {
    return false;
  }
}

export function markSeen(c: PopupCampaign) {
  try {
    const key = SEEN_PREFIX + c.id;
    localStorage.setItem(key, String(Date.now()));
    sessionStorage.setItem(`${key}_sess`, '1');
  } catch {}
}

function pickVariant(groupKey: string): 'A' | 'B' {
  try {
    const k = VARIANT_PREFIX + groupKey;
    const existing = localStorage.getItem(k);
    if (existing === 'A' || existing === 'B') return existing;
    const v = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(k, v);
    return v;
  } catch {
    return Math.random() < 0.5 ? 'A' : 'B';
  }
}

export function trackPopupEvent(params: {
  campaign_id: string;
  slide_id?: string | null;
  variant?: string | null;
  event_type: 'view' | 'slide_view' | 'click_cta' | 'close' | 'dismiss_outside';
  user_id?: string | null;
}) {
  const session_id = getOrCreateSessionId();
  const device = detectDevice();
  // fire-and-forget
  supabase
    .from('popup_events')
    .insert({
      campaign_id: params.campaign_id,
      slide_id: params.slide_id ?? null,
      variant: params.variant ?? null,
      event_type: params.event_type,
      user_id: params.user_id ?? null,
      session_id,
      device,
    })
    .then(() => {});
}

export function usePopupCampaign() {
  const { user, loading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState<PopupCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const device = detectDevice();

    (async () => {
      try {
        const { data: campaigns, error } = await supabase
          .from('popup_campaigns')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (error || !campaigns || cancelled) {
          setLoading(false);
          return;
        }

        const now = Date.now();
        const eligible = campaigns.filter((c: any) => {
          if (c.start_at && new Date(c.start_at).getTime() > now) return false;
          if (c.end_at && new Date(c.end_at).getTime() < now) return false;
          if (c.target_device !== 'all' && c.target_device !== device) return false;
          if (user && !c.force_show_logged_in) return false;
          return true;
        });

        // Group by ab_group_key for A/B
        const seen = new Set<string>();
        const finalList: any[] = [];
        for (const c of eligible) {
          if (c.ab_enabled && c.ab_group_key) {
            if (seen.has(c.ab_group_key)) continue;
            seen.add(c.ab_group_key);
            const variant = pickVariant(c.ab_group_key);
            const match = eligible.find(
              (x: any) =>
                x.ab_enabled &&
                x.ab_group_key === c.ab_group_key &&
                x.ab_variant === variant
            );
            if (match) finalList.push(match);
            else finalList.push(c);
          } else {
            finalList.push(c);
          }
        }

        const chosen = finalList.find((c: any) => !alreadySeen(c as PopupCampaign));
        if (!chosen) {
          setLoading(false);
          return;
        }

        const { data: slides } = await supabase
          .from('popup_slides')
          .select('*')
          .eq('campaign_id', chosen.id)
          .order('order_index', { ascending: true });

        if (cancelled) return;
        setCampaign({ ...(chosen as any), slides: (slides || []) as PopupSlide[] });
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { campaign, loading, userId: user?.id ?? null };
}
