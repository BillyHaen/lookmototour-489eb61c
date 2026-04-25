import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyVendor } from '@/hooks/useMyVendor';

export function useVendorRentals() {
  const { data: vendor } = useMyVendor();
  return useQuery({
    queryKey: ['vendor-rentals', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      // Get product ids first
      const { data: products, error: pErr } = await (supabase.from('products') as any)
        .select('id')
        .eq('vendor_id', vendor.id);
      if (pErr) throw pErr;
      const productIds = (products || []).map((p: any) => p.id);
      if (productIds.length === 0) return [];

      const { data, error } = await (supabase.from('gear_rentals') as any)
        .select('*, products(name, image_url, vendors(name)), events(title)')
        .in('product_id', productIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rentals = (data || []) as any[];

      const userIds = Array.from(new Set(rentals.map(r => r.user_id).filter(Boolean)));
      if (userIds.length === 0) return rentals;
      const [{ data: profiles }, { data: privates }] = await Promise.all([
        supabase.from('profiles').select('user_id, name').in('user_id', userIds),
        (supabase.from('profile_private') as any).select('user_id, phone').in('user_id', userIds),
      ]);
      const phoneMap = new Map(((privates as any[]) || []).map((p: any) => [p.user_id, p.phone]));
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, { ...p, phone: phoneMap.get(p.user_id) || '' }]));
      return rentals.map(r => ({ ...r, profiles: profileMap.get(r.user_id) || null }));
    },
    enabled: !!vendor,
  });
}
