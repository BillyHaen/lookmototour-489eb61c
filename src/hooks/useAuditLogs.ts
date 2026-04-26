import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogFilters {
  search?: string;
  action?: string;
  tableName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { search, action, tableName, status, startDate, endDate, page = 1, pageSize = 50 } = filters;

  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let q = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });

      if (action && action !== 'all') q = q.eq('action', action);
      if (tableName && tableName !== 'all') q = q.eq('table_name', tableName);
      if (status && status !== 'all') q = q.eq('status', status);
      if (startDate) q = q.gte('created_at', startDate);
      if (endDate) q = q.lte('created_at', endDate);
      if (search) {
        q = q.or(`user_email.ilike.%${search}%,user_name.ilike.%${search}%,record_id.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as AuditLog[], total: count ?? 0 };
    },
  });
}
