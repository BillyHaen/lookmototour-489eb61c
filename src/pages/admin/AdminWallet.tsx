import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Wallet, Search, Plus, Minus, RefreshCw, Loader2 } from 'lucide-react';
import { formatPrice } from '@/data/events';
import RichTextEditor from '@/components/RichTextEditor';
import { useCreditTerms, useUpdateCreditTerms } from '@/hooks/useCreditTerms';

export default function AdminWallet() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; name: string } | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustExpiry, setAdjustExpiry] = useState<number | ''>('');

  const { data: settings } = useQuery({
    queryKey: ['admin-wallet-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('wallet_settings' as any) as any)
        .select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data as { default_expiry_days: number; max_redeem_percent: number } | null;
    },
  });
  const [defExp, setDefExp] = useState<number | ''>('');
  const [maxPct, setMaxPct] = useState<number | ''>('');

  const { data: termsHtml = '' } = useCreditTerms();
  const updateTerms = useUpdateCreditTerms();
  const [termsDraft, setTermsDraft] = useState<string>('');
  useEffect(() => { setTermsDraft(termsHtml || ''); }, [termsHtml]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const payload: any = { id: 1 };
      if (defExp !== '') payload.default_expiry_days = Number(defExp);
      if (maxPct !== '') payload.max_redeem_percent = Number(maxPct);
      const { error } = await (supabase.from('wallet_settings' as any) as any).upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Pengaturan tersimpan' });
      qc.invalidateQueries({ queryKey: ['admin-wallet-settings'] });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-wallet-users', search],
    queryFn: async () => {
      let q = (supabase.from('profiles' as any) as any)
        .select('user_id, name, username')
        .order('updated_at', { ascending: false })
        .limit(30);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: balance } = useQuery({
    queryKey: ['admin-wallet-balance', selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return 0;
      const { data, error } = await supabase.rpc('get_wallet_balance' as any, { _user_id: selectedUser.user_id });
      if (error) throw error;
      return Number(data) || 0;
    },
    enabled: !!selectedUser,
  });

  const { data: ledger = [] } = useQuery({
    queryKey: ['admin-wallet-ledger', selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await (supabase.from('credit_ledger' as any) as any)
        .select('*')
        .eq('user_id', selectedUser.user_id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!selectedUser,
  });

  const adjust = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !adjustAmount) throw new Error('Isi nominal');
      const { error } = await supabase.rpc('admin_adjust_credit' as any, {
        _user_id: selectedUser.user_id,
        _amount: adjustAmount,
        _reason: adjustReason || 'Penyesuaian admin',
        _expiry_days: adjustExpiry === '' ? null : Number(adjustExpiry),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Saldo disesuaikan' });
      setAdjustOpen(false); setAdjustAmount(0); setAdjustReason(''); setAdjustExpiry('');
      qc.invalidateQueries({ queryKey: ['admin-wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['admin-wallet-ledger'] });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const expireNow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('expire-credits');
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({ title: 'Expire dijalankan', description: `${data?.expired_count ?? 0} entri kedaluwarsa` });
      qc.invalidateQueries({ queryKey: ['admin-wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['admin-wallet-ledger'] });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6" /> Wallet & Kredit
            </h1>
            <p className="text-sm text-muted-foreground">Kelola saldo kredit user dan pengaturan global.</p>
          </div>
          <Button variant="outline" onClick={() => expireNow.mutate()} disabled={expireNow.isPending}>
            {expireNow.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Jalankan Expire
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Pengaturan Global</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Default masa berlaku (hari)</Label>
                <Input type="number" min={1}
                  placeholder={String(settings?.default_expiry_days ?? 365)}
                  value={defExp} onChange={(e) => setDefExp(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <div>
                <Label>Maks pemakaian per transaksi (%)</Label>
                <Input type="number" min={1} max={100}
                  placeholder={String(settings?.max_redeem_percent ?? 100)}
                  value={maxPct} onChange={(e) => setMaxPct(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
            <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>Simpan Pengaturan</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Syarat & Ketentuan Kredit</CardTitle>
            <p className="text-xs text-muted-foreground">
              Konten ini muncul sebagai pop-up info di samping nilai kredit user.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <RichTextEditor
              value={termsDraft}
              onChange={setTermsDraft}
              placeholder="Tulis syarat & ketentuan penggunaan kredit (masa berlaku, batas pemakaian, dsb.)"
              minHeight="180px"
            />
            <Button
              onClick={() => updateTerms.mutate(termsDraft, {
                onSuccess: () => toast({ title: 'Syarat & Ketentuan tersimpan' }),
                onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
              })}
              disabled={updateTerms.isPending}
            >
              {updateTerms.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan T&C
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>User</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Cari nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="space-y-1 max-h-[420px] overflow-auto">
                {usersLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
                {users.map((u: any) => (
                  <button key={u.user_id}
                    onClick={() => setSelectedUser({ user_id: u.user_id, name: u.name })}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedUser?.user_id === u.user_id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}>
                    <div className="font-medium">{u.name || 'Tanpa nama'}</div>
                    {u.username && <div className="text-xs opacity-70">@{u.username}</div>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{selectedUser ? selectedUser.name : 'Pilih user'}</CardTitle>
                {selectedUser && (
                  <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Sesuaikan</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Sesuaikan Kredit</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Nominal (Rp) — gunakan negatif untuk kurangi</Label>
                          <Input type="number" value={adjustAmount}
                            onChange={(e) => setAdjustAmount(Number(e.target.value))} />
                        </div>
                        <div>
                          <Label>Alasan</Label>
                          <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="Mis. kompensasi cancellation" />
                        </div>
                        <div>
                          <Label>Masa berlaku (hari) — opsional, hanya untuk penambahan</Label>
                          <Input type="number" value={adjustExpiry}
                            onChange={(e) => setAdjustExpiry(e.target.value === '' ? '' : Number(e.target.value))} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setAdjustOpen(false)}>Batal</Button>
                          <Button onClick={() => adjust.mutate()} disabled={adjust.isPending}>
                            {adjust.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Simpan
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="text-sm text-muted-foreground">Pilih user dari daftar di kiri.</div>
              ) : (
                <>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4">
                    <div className="text-xs text-muted-foreground">Saldo aktif</div>
                    <div className="text-2xl font-bold text-primary">{formatPrice(balance || 0)}</div>
                  </div>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Sumber</TableHead>
                          <TableHead className="text-right">Nominal</TableHead>
                          <TableHead className="text-right">Sisa</TableHead>
                          <TableHead>Expired</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledger.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Belum ada transaksi</TableCell></TableRow>
                        )}
                        {ledger.map((l: any) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-xs">{new Date(l.created_at).toLocaleString('id-ID')}</TableCell>
                            <TableCell><Badge variant={l.entry_type === 'earn' ? 'default' : l.entry_type === 'expire' ? 'destructive' : 'secondary'}>{l.entry_type}</Badge></TableCell>
                            <TableCell className="text-xs">{l.source_type}</TableCell>
                            <TableCell className={`text-right font-medium ${l.amount > 0 ? 'text-primary' : 'text-destructive'}`}>
                              {l.amount > 0 ? '+' : ''}{formatPrice(l.amount)}
                            </TableCell>
                            <TableCell className="text-right">{l.entry_type === 'earn' ? formatPrice(l.remaining || 0) : '-'}</TableCell>
                            <TableCell className="text-xs">{l.expires_at ? new Date(l.expires_at).toLocaleDateString('id-ID') : '-'}</TableCell>
                            <TableCell className="text-xs">{l.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
