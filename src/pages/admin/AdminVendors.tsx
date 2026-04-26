import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Building2 } from 'lucide-react';

interface VendorForm {
  name: string;
  slug: string;
  logo_url: string;
  contact_phone: string;
  contact_email: string;
  description: string;
  is_active: boolean;
}

const empty: VendorForm = { name: '', slug: '', logo_url: '', contact_phone: '', contact_email: '', description: '', is_active: true };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminVendors() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorForm>(empty);

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('vendors') as any).select('*').order('name');
      if (error) throw error;
      return data as any[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, slug: form.slug || slugify(form.name) };
      if (editId) {
        const { error } = await (supabase.from('vendors') as any).update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('vendors') as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      qc.invalidateQueries({ queryKey: ['vendors'] });
      toast({ title: editId ? 'Vendor diperbarui ✅' : 'Vendor ditambahkan ✅' });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('vendors') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({ title: 'Vendor dihapus ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const openCreate = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (v: any) => {
    setEditId(v.id);
    setForm({
      name: v.name, slug: v.slug, logo_url: v.logo_url || '',
      contact_phone: v.contact_phone || '', contact_email: v.contact_email || '',
      description: v.description || '', is_active: v.is_active,
    });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <Building2 className="h-6 w-6" /> Vendor / Merchant
        </h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Tambah Vendor</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors?.map((v: any) => (
            <div key={v.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-3">
                {v.logo_url ? (
                  <img src={v.logo_url} alt={v.name} className="w-12 h-12 rounded object-cover bg-muted" />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{v.name}</p>
                    <Badge variant={v.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {v.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.contact_phone || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.contact_email || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    Owner: {v.owner_user_id ? <span className="text-primary">Terhubung ke user</span> : <span className="italic">Belum terhubung</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(v)} className="flex-1"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => { if (confirm('Hapus vendor ini?')) del.mutate(v.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {!vendors?.length && <p className="text-muted-foreground text-center py-8 col-span-full">Belum ada vendor.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Vendor' : 'Tambah Vendor'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nama Vendor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editId ? form.slug : slugify(e.target.value) })} />
            <Input placeholder="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Input placeholder="URL Logo" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="No. WhatsApp" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              <Input placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <Textarea placeholder="Deskripsi vendor..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm">Vendor Aktif</span>
            </div>
            <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? 'Simpan' : 'Tambah Vendor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
