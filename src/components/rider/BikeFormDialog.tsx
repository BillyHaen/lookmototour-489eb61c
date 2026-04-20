import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { useSaveBike } from '@/hooks/useGarage';
import { Loader2 } from 'lucide-react';

export default function BikeFormDialog({ open, onOpenChange, userId, bike }: {
  open: boolean; onOpenChange: (b: boolean) => void; userId: string; bike?: any;
}) {
  const save = useSaveBike(userId);
  const [form, setForm] = useState({ brand: '', model: '', year: '', description: '', photo_url: '' });

  useEffect(() => {
    if (bike) setForm({
      brand: bike.brand || '', model: bike.model || '', year: bike.year?.toString() || '',
      description: bike.description || '', photo_url: bike.photo_url || '',
    });
    else setForm({ brand: '', model: '', year: '', description: '', photo_url: '' });
  }, [bike, open]);

  const submit = async () => {
    await save.mutateAsync({
      ...(bike?.id ? { id: bike.id } : {}),
      brand: form.brand, model: form.model,
      year: form.year ? parseInt(form.year) : null,
      description: form.description, photo_url: form.photo_url,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{bike ? 'Edit Motor' : 'Tambah Motor'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Honda" /></div>
            <div><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="CRF250" /></div>
          </div>
          <div><Label>Tahun</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2022" /></div>
          <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Modifikasi, cerita, dll" rows={3} /></div>
          <div>
            <Label>Foto</Label>
            <ImageUpload bucket="garage" pathPrefix={userId} value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} label="" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit} disabled={save.isPending || !form.brand || !form.model}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
