import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Shield, User } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

export default function AdminUsers() {
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      // Remove existing roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Insert new role
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast({ title: 'Role diperbarui ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const getUserRole = (userId: string): string => {
    const userRole = roles?.find(r => r.user_id === userId);
    return userRole?.role || 'user';
  };

  return (
    <AdminLayout>
      <h1 className="font-heading font-bold text-2xl mb-6">Kelola User</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {profiles?.map((profile) => {
            const role = getUserRole(profile.user_id);
            return (
              <div key={profile.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <UserAvatar src={profile.avatar_url} name={profile.name} className="h-10 w-10" />
                  <div>
                    <p className="font-medium">{profile.name || 'Tanpa Nama'}</p>
                    <p className="text-sm text-muted-foreground">{profile.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={role === 'admin' ? 'default' : 'secondary'}>{role}</Badge>
                  <Select value={role} onValueChange={(v) => setRoleMutation.mutate({ userId: profile.user_id, role: v as 'admin' | 'user' })}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
          {!profiles?.length && <p className="text-muted-foreground text-center py-8">Belum ada user.</p>}
        </div>
      )}
    </AdminLayout>
  );
}
