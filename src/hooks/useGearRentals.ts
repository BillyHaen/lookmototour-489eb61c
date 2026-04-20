import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useMyRentals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-rentals', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('gear_rentals') as any)
        .select('*, products(name, image_url, vendor_id, vendors(name, logo_url, contact_phone)), events(title, date)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useAllRentals() {
  return useQuery({
    queryKey: ['admin-rentals'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('gear_rentals') as any)
        .select('*, products(name, image_url, vendors(name)), events(title), profiles:user_id(name, phone)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
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
