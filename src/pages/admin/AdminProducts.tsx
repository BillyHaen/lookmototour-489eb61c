import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/data/events';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

interface ProductForm {
  name: string; description: string; price: number; stock: number;
  image_url: string; category: string; is_active: boolean;
}

const emptyForm: ProductForm = { name: '', description: '', price: 0, stock: 0, image_url: '', category: 'aksesoris', is_active: true };

const PRODUCT_CATEGORIES = ['aksesoris', 'apparel', 'sparepart', 'merchandise', 'lainnya'];

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('products') as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await (supabase.from('products') as any).update(form).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('products') as any).insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: editId ? 'Produk diperbarui ✅' : 'Produk ditambahkan ✅' });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('products') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Produk dihapus ✅' });
    },
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, image_url: p.image_url || '', category: p.category, is_active: p.is_active });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Kelola Produk</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Tambah Produk</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {products?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{p.name}</p>
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatPrice(p.price)} • Stok: {p.stock} • {p.category}</p>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => { if (confirm('Hapus produk ini?')) deleteMutation.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {!products?.length && <p className="text-muted-foreground text-center py-8">Belum ada produk.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nama Produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" placeholder="Harga" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <Input type="number" placeholder="Stok" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <Input placeholder="URL Gambar" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <span className="text-sm">Produk Aktif</span>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? 'Simpan' : 'Tambah Produk'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
