import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HeroImage {
  url: string;
  alt: string;
}

export interface HeroStat {
  icon: string;
  label: string;
  value: string;
}

export interface HeroSettings {
  images: HeroImage[];
  stats: HeroStat[];
}

const defaultHero: HeroSettings = {
  images: [],
  stats: [
    { icon: 'Users', label: 'Riders', value: '500+' },
    { icon: 'MapPin', label: 'Rute', value: '50+' },
    { icon: 'Calendar', label: 'Event/tahun', value: '12+' },
  ],
};

export function useHeroSettings() {
  return useQuery({
    queryKey: ['site-settings', 'hero'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'hero')
        .single();
      if (error) return defaultHero;
      return (data.value as unknown as HeroSettings) || defaultHero;
    },
    staleTime: 5 * 60 * 1000,
  });
}
