import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Search, Calendar } from 'lucide-react';
import DataPagination, { DEFAULT_PAGE_SIZE, paginate } from '@/components/admin/DataPagination';
import UserAvatar from '@/components/UserAvatar';
import UserBadge, { getHighestBadge } from '@/components/UserBadge';
import RiderOverridePanel from '@/components/admin/RiderOverridePanel';

interface UserStats {
  user_id: string;
  total_trips: number;
  total_km: number;
  total_payments: number;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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

  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_stats');
      if (error) throw error;
      return (data as UserStats[]) || [];
    },
  });

  const { data: userRegistrations } = useQuery({
    queryKey: ['admin-user-registrations', selectedUser?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, events!event_registrations_event_id_fkey(title, date, location, distance)')
        .eq('user_id', selectedUser!.user_id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedUser,
  });

  const { data: vendors } = useQuery({
    queryKey: ['admin-all-vendors-for-link'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('vendors') as any).select('id, name, owner_user_id').order('name');
      if (error) throw error;
      return data as any[];
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' | 'vendor' }) => {
      const { error } = await supabase.rpc('admin_set_user_role' as any, { _user_id: userId, _role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast({ title: 'Role diperbarui ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const linkVendorMutation = useMutation({
    mutationFn: async ({ vendorId, userId }: { vendorId: string; userId: string | null }) => {
      const { error } = await supabase.rpc('admin_link_vendor_to_user' as any, { _vendor_id: vendorId, _user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-vendors-for-link'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['my-vendor'] });
      toast({ title: 'Vendor link diperbarui ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete profile (cascade will handle user_roles if FK exists, otherwise manual)
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
      toast({ title: 'User dihapus ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const getUserRole = (userId: string): string => {
    const userRole = roles?.find(r => r.user_id === userId);
    return userRole?.role || 'user';
  };

  const getStats = (userId: string): UserStats => {
    return userStats?.find(s => s.user_id === userId) || { user_id: userId, total_trips: 0, total_km: 0, total_payments: 0 };
  };

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const filtered = profiles?.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  return (
    <AdminLayout>
      <h1 className="font-heading font-bold text-2xl mb-4">Kelola User</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px]" />
          <span className="text-muted-foreground text-sm">—</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px]" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {paginate(filtered ?? [], page, pageSize).map((profile) => {
            const role = getUserRole(profile.user_id);
            const stats = getStats(profile.user_id);
            const isProtectedAdmin = profile.user_id === 'ab0d93f1-342a-486d-98e4-3a31c591c607';
            return (
              <div
                key={profile.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-card gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedUser(profile)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar src={profile.avatar_url} name={profile.name} className="h-10 w-10 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{profile.name || 'Tanpa Nama'}</p>
                      <UserBadge eventCount={stats.total_trips} />
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{stats.total_trips} trip</span>
                      <span>{Math.round(stats.total_km)} km</span>
                      <span>{formatRupiah(stats.total_payments)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap" onClick={e => e.stopPropagation()}>
                  <Badge variant={role === 'admin' ? 'default' : role === 'vendor' ? 'outline' : 'secondary'}>{role}</Badge>
                  {(() => {
                    const availableRoles: Array<'user' | 'vendor' | 'admin'> = isProtectedAdmin
                      ? ['admin']
                      : ['user', 'vendor', 'admin'];
                    const roleLabels: Record<string, string> = { user: 'User', vendor: 'Vendor', admin: 'Admin' };
                    return (
                      <Select
                        value={role}
                        onValueChange={(v) => setRoleMutation.mutate({ userId: profile.user_id, role: v as any })}
                        disabled={isProtectedAdmin}
                      >
                        <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((r) => (
                            <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                  {role === 'vendor' && (
                    <Select
                      value={(vendors?.find((v: any) => v.owner_user_id === profile.user_id)?.id) || 'none'}
                      onValueChange={(v) => linkVendorMutation.mutate({ vendorId: v, userId: v === 'none' ? null : profile.user_id })}
                    >
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Link vendor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Tanpa vendor —</SelectItem>
                        {vendors?.filter((v: any) => !v.owner_user_id || v.owner_user_id === profile.user_id).map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {stats.total_trips === 0 && !isProtectedAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                          <AlertDialogDescription>
                            User <strong>{profile.name}</strong> belum pernah ikut trip. Data profil akan dihapus permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUserMutation.mutate(profile.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}
          {!filtered?.length && <p className="text-muted-foreground text-center py-8">Tidak ada user ditemukan.</p>}
          {!!filtered?.length && (
            <DataPagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              className="pt-2"
            />
          )}
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedUser && (() => {
            const stats = getStats(selectedUser.user_id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <UserAvatar src={selectedUser.avatar_url} name={selectedUser.name} className="h-12 w-12" />
                    <div>
                      <p>{selectedUser.name || 'Tanpa Nama'}</p>
                      <p className="text-sm font-normal text-muted-foreground">{selectedUser.phone || '-'}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xl font-bold text-primary">{stats.total_trips}</p>
                      <p className="text-xs text-muted-foreground">Total Trip</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xl font-bold text-primary">{Math.round(stats.total_km)}</p>
                      <p className="text-xs text-muted-foreground">Total Km</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-primary">{formatRupiah(stats.total_payments)}</p>
                      <p className="text-xs text-muted-foreground">Total Bayar</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Badge</h4>
                    {stats.total_trips > 0 ? (
                      <UserBadge eventCount={stats.total_trips} showAll />
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada badge</p>
                    )}
                  </div>

                  {/* Bio */}
                  {selectedUser.bio && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Bio</h4>
                      <p className="text-sm text-muted-foreground">{selectedUser.bio}</p>
                    </div>
                  )}

                  {/* Trip History */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Riwayat Trip</h4>
                    {userRegistrations && userRegistrations.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userRegistrations.map((reg: any) => (
                          <div key={reg.id} className="p-3 rounded-lg border border-border text-sm">
                            <p className="font-medium">{reg.events?.title || 'Event'}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                              <span>{new Date(reg.events?.date).toLocaleDateString('id-ID')}</span>
                              <span>{reg.events?.location}</span>
                              {reg.events?.distance && <span>{reg.events.distance}</span>}
                              <span className="capitalize">{reg.registration_type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum pernah ikut trip.</p>
                    )}
                  </div>

                  {/* Admin Override Panel */}
                  <RiderOverridePanel userId={selectedUser.user_id} />

                  <p className="text-xs text-muted-foreground">Bergabung: {new Date(selectedUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
