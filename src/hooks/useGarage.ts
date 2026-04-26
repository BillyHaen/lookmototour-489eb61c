import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useGarageBikes(userId?: string) {
  return useQuery({
    queryKey: ['garage-bikes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await (supabase.from('garage_bikes' as any) as any)
        .select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) return [];
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });
}

export function useGarageGear(userId?: string) {
  return useQuery({
    queryKey: ['garage-gear', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await (supabase.from('garage_gear' as any) as any)
        .select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) return [];
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });
}

export function useSaveBike(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const row = { ...payload, user_id: userId };
      if (payload.id) {
        const { error } = await (supabase.from('garage_bikes' as any) as any).update(row).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('garage_bikes' as any) as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garage-bikes', userId] });
      toast({ title: 'Motor disimpan ✅' });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });
}

export function useSaveGear(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const row = { ...payload, user_id: userId };
      if (payload.id) {
        const { error } = await (supabase.from('garage_gear' as any) as any).update(row).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('garage_gear' as any) as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garage-gear', userId] });
      toast({ title: 'Gear disimpan ✅' });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteBike(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('garage_bikes' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['garage-bikes', userId] }),
  });
}

export function useDeleteGear(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('garage_gear' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['garage-gear', userId] }),
  });
}
