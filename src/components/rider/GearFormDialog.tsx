import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { useSaveGear } from '@/hooks/useGarage';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { v: 'helmet', l: 'Helm' }, { v: 'jacket', l: 'Jaket' }, { v: 'gloves', l: 'Sarung Tangan' },
  { v: 'boots', l: 'Sepatu' }, { v: 'luggage', l: 'Tas / Box' }, { v: 'other', l: 'Lainnya' },
];

export default function GearFormDialog({ open, onOpenChange, userId, gear }: {
  open: boolean; onOpenChange: (b: boolean) => void; userId: string; gear?: any;
}) {
  const save = useSaveGear(userId);
  const [form, setForm] = useState({ category: 'helmet', brand: '', name: '', photo_url: '' });

  useEffect(() => {
    if (gear) setForm({
      category: gear.category || 'helmet', brand: gear.brand || '', name: gear.name || '', photo_url: gear.photo_url || '',
    });
    else setForm({ category: 'helmet', brand: '', name: '', photo_url: '' });
  }, [gear, open]);

  const submit = async () => {
    await save.mutateAsync({ ...(gear?.id ? { id: gear.id } : {}), ...form });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{gear ? 'Edit Gear' : 'Tambah Gear'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Kategori</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Shoei" /></div>
          <div><Label>Nama / Model</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="X-Spirit III" /></div>
          <div>
            <Label>Foto</Label>
            <ImageUpload bucket="garage" folder={userId} currentUrl={form.photo_url} onUploaded={(url) => setForm({ ...form, photo_url: url })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit} disabled={save.isPending || !form.brand || !form.name}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
