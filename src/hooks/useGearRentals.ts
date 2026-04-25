import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useMyRentals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-rentals', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('gear_rentals') as any)
        .select('*, products(name, image_url, vendor_id, vendors(id, name, logo_url)), events(title, date)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rentals = (data || []) as any[];

      // Fetch vendor contact info via secured RPC (only returns when caller has rental for vendor)
      const vendorIds = Array.from(new Set(
        rentals.map(r => r.products?.vendors?.id).filter(Boolean)
      ));
      if (vendorIds.length === 0) return rentals;
      const contactResults = await Promise.all(
        vendorIds.map(async (vid: string) => {
          const { data: c } = await (supabase as any).rpc('get_vendor_contact_for_renter', { _vendor_id: vid });
          return [vid, c?.[0] || null] as const;
        })
      );
      const contactMap = new Map(contactResults);
      return rentals.map(r => {
        const vid = r.products?.vendors?.id;
        const contact = vid ? contactMap.get(vid) : null;
        if (vid && r.products?.vendors) {
          r.products.vendors = { ...r.products.vendors, contact_phone: contact?.contact_phone || '' };
        }
        return r;
      });
    },
    enabled: !!user,
  });
}

export function useAllRentals() {
  return useQuery({
    queryKey: ['admin-rentals'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('gear_rentals') as any)
        .select('*, products(name, image_url, vendors(name)), events(title)')
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
  });
}

export function useUpdateRentalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: { pickup_notes?: string; return_notes?: string } }) => {
      const payload: any = { status };
      if (notes?.pickup_notes !== undefined) payload.pickup_notes = notes.pickup_notes;
      if (notes?.return_notes !== undefined) payload.return_notes = notes.return_notes;
      const { error } = await (supabase.from('gear_rentals') as any).update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rentals'] });
      qc.invalidateQueries({ queryKey: ['my-rentals'] });
    },
  });
}
