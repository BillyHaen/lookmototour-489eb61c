import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useVendors } from '@/hooks/useVendors';
import { toast } from '@/hooks/use-toast';
import { formatPrice } from '@/data/events';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

interface ProductForm {
  name: string; description: string; price: number; stock: number;
  image_url: string; category: string; is_active: boolean;
  vendor_id: string | null;
  is_rentable: boolean; is_purchasable: boolean;
  daily_rent_price: number; rent_deposit: number;
  total_inventory: number;
  gear_type: string;
  suitable_motor_types: string[]; suitable_trip_styles: string[]; motor_brands: string[];
  min_difficulty: number;
}

const empty: ProductForm = {
  name: '', description: '', price: 0, stock: 0, image_url: '', category: 'aksesoris', is_active: true,
  vendor_id: null, is_rentable: false, is_purchasable: true,
  daily_rent_price: 0, rent_deposit: 0, total_inventory: 0,
  gear_type: '', suitable_motor_types: [], suitable_trip_styles: [], motor_brands: [],
  min_difficulty: 1,
};

const PRODUCT_CATEGORIES = ['aksesoris', 'apparel', 'sparepart', 'merchandise', 'lainnya'];
const GEAR_TYPES = ['none', 'helmet', 'jacket', 'gloves', 'boots', 'luggage', 'camera', 'tent', 'other'];
const MOTOR_TYPES = ['sport', 'touring', 'adventure', 'naked', 'cruiser', 'matic'];
const TRIP_STYLES = ['adventure', 'touring', 'city'];
import { MOTOR_BRANDS as CATALOG_BRANDS } from '@/data/motorcycles';
const MOTOR_BRANDS = CATALOG_BRANDS.map((b) => b.toLowerCase());

function ChipMulti({ value, options, onChange }: { value: string[]; options: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${value.includes(o) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/40'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);
  const { data: vendors = [] } = useVendors(true);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('products') as any)
        .select('*, vendors(name, logo_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, stock: form.total_inventory };
      if (editId) {
        const { error } = await (supabase.from('products') as any).update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('products') as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
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

  const openCreate = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name, description: p.description, price: p.price, stock: p.stock,
      image_url: p.image_url || '', category: p.category, is_active: p.is_active,
      vendor_id: p.vendor_id || null,
      is_rentable: p.is_rentable || false, is_purchasable: p.is_purchasable !== false,
      daily_rent_price: p.daily_rent_price || 0, rent_deposit: p.rent_deposit || 0,
      total_inventory: p.total_inventory || p.stock || 0,
      gear_type: p.gear_type || '',
      suitable_motor_types: p.suitable_motor_types || [],
      suitable_trip_styles: p.suitable_trip_styles || [],
      motor_brands: p.motor_brands || [],
      min_difficulty: p.min_difficulty || 1,
    });
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
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{p.name}</p>
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                    {p.is_rentable && <Badge variant="outline">Sewa</Badge>}
                    {p.is_purchasable && <Badge variant="outline">Beli</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.vendors?.name ? `${p.vendors.name} • ` : ''}
                    {p.is_purchasable && `Beli ${formatPrice(p.price)}`}
                    {p.is_purchasable && p.is_rentable && ' • '}
                    {p.is_rentable && `Sewa ${formatPrice(p.daily_rent_price)}/hari`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inventori: {p.total_inventory || p.stock} • Terjual: {p.sold_count || 0} • Kategori: {p.category}
                  </p>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nama Produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <div>
              <Label className="text-xs">Vendor</Label>
              <Select value={form.vendor_id || 'none'} onValueChange={(v) => setForm({ ...form, vendor_id: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Pilih vendor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa vendor</SelectItem>
                  {vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Deskripsi</Label>
              <RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Deskripsi produk..." />
            </div>

            <Input placeholder="URL Gambar" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipe Gear</Label>
                <Select value={form.gear_type || 'none'} onValueChange={(v) => setForm({ ...form, gear_type: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{GEAR_TYPES.map(g => <SelectItem key={g} value={g}>{g === 'none' ? '—' : g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Total Inventori</Label>
              <Input type="number" value={form.total_inventory} onChange={(e) => setForm({ ...form, total_inventory: Number(e.target.value) })} />
            </div>

            {/* Beli */}
            <div className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_purchasable} onCheckedChange={(v) => setForm({ ...form, is_purchasable: v })} />
                <span className="text-sm font-medium">Tersedia untuk dibeli</span>
              </div>
              {form.is_purchasable && (
                <div>
                  <Label className="text-xs">Harga Beli</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              )}
            </div>

            {/* Sewa */}
            <div className="p-3 rounded-lg border border-border space-y-2 bg-accent/5">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_rentable} onCheckedChange={(v) => setForm({ ...form, is_rentable: v })} />
                <span className="text-sm font-medium">Tersedia untuk disewa (Try First, Buy Later)</span>
              </div>
              {form.is_rentable && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Harga Sewa / Hari</Label>
                      <Input type="number" value={form.daily_rent_price} onChange={(e) => setForm({ ...form, daily_rent_price: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label className="text-xs">Deposit (refundable)</Label>
                      <Input type="number" value={form.rent_deposit} onChange={(e) => setForm({ ...form, rent_deposit: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Cocok untuk Tipe Motor</Label>
                    <ChipMulti value={form.suitable_motor_types} options={MOTOR_TYPES} onChange={(v) => setForm({ ...form, suitable_motor_types: v })} />
                    <p className="text-[11px] text-muted-foreground mt-1">Pilih kategori motor & merk yang cocok agar produk muncul di rekomendasi sewa saat user pilih motor sesuai.</p>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Cocok untuk Gaya Trip</Label>
                    <ChipMulti value={form.suitable_trip_styles} options={TRIP_STYLES} onChange={(v) => setForm({ ...form, suitable_trip_styles: v })} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Merk Motor (opsional)</Label>
                    <ChipMulti value={form.motor_brands} options={MOTOR_BRANDS} onChange={(v) => setForm({ ...form, motor_brands: v })} />
                  </div>
                  <div>
                    <Label className="text-xs">Min. Tingkat Kesulitan (1-5)</Label>
                    <Input type="number" min={1} max={5} value={form.min_difficulty} onChange={(e) => setForm({ ...form, min_difficulty: Number(e.target.value) })} />
                  </div>
                </>
              )}
            </div>

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
