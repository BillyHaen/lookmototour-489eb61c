import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RentalRecommendation {
  product_id: string;
  name: string;
  description: string;
  image_url: string | null;
  daily_rent_price: number;
  rent_deposit: number;
  gear_type: string;
  vendor_id: string | null;
  vendor_name: string | null;
  vendor_logo_url: string | null;
  available_qty: number;
  trip_days: number;
  subtotal: number;
  score: number;
  reason: any;
}

export function useGearRecommendations(eventId: string | undefined, motorType: string, motorBrand = '') {
  return useQuery({
    queryKey: ['gear-recommendations', eventId, motorType, motorBrand],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('recommend_rental_gear', {
        _event_id: eventId,
        _motor_type: (motorType || '').toLowerCase().trim(),
        _motor_brand: (motorBrand || '').toLowerCase().trim(),
      });
      if (error) throw error;
      return (data || []) as RentalRecommendation[];
    },
    enabled: !!eventId && !!motorType && motorType.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
