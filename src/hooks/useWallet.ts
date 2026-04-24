import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useWalletBalance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc('get_wallet_balance' as any, { _user_id: user.id });
      if (error) throw error;
      return Number(data) || 0;
    },
    enabled: !!user,
    staleTime: 15_000,
  });
}

export function useWalletLedger(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wallet-ledger', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('credit_ledger' as any) as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
    staleTime: 15_000,
  });
}

export function useWalletSettings() {
  return useQuery({
    queryKey: ['wallet-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('wallet_settings' as any) as any)
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return data as { default_expiry_days: number; max_redeem_percent: number } | null;
    },
    staleTime: 5 * 60_000,
  });
}
