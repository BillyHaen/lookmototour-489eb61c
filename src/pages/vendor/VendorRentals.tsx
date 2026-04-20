import { useState } from 'react';
import VendorLayout from './VendorLayout';
import { useVendorRentals } from '@/hooks/useVendorRentals';
import { useUpdateRentalStatus } from '@/hooks/useGearRentals';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice, formatDate } from '@/data/events';
import { toast } from '@/hooks/use-toast';
import { Loader2, Package, Truck, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'picked_up', label: 'Sedang Disewa' },
  { value: 'returned', label: 'Dikembalikan' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_VARIANT: Record<string, any> = {
  pending: 'outline', confirmed: 'secondary', picked_up: 'default', returned: 'default', cancelled: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Dikonfirmasi', picked_up: 'Sedang Disewa', returned: 'Dikembalikan', cancelled: 'Dibatalkan',
};

function normalizePhone(phone: string): string {
  let p = (phone || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '62' + p.slice(1);
  return p;
}

export default function VendorRentals() {
  const [filter, setFilter] = useState('all');
  const [noteDialog, setNoteDialog] = useState<{ id: string; field: 'pickup_notes' | 'return_notes'; nextStatus: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const { data: rentals, isLoading } = useVendorRentals();
  const update = useUpdateRentalStatus();

  const filtered = (rentals || []).filter((r: any) => filter === 'all' || r.status === filter);

  const submitNote = () => {
    if (!noteDialog) return;
    update.mutate({
      id: noteDialog.id,
      status: noteDialog.nextStatus,
      notes: { [noteDialog.field]: noteText },
    });
    setNoteDialog(null);
    setNoteText('');
  };

  const openWhatsApp = async (rentalId: string, fallbackName?: string, productName?: string) => {
    try {
      const { data, error } = await (supabase.rpc as any)('get_renter_contact_for_vendor', { _rental_id: rentalId });
      if (error) throw error;
      const contact = (data && data[0]) || null;
      const phone = contact?.phone;
      if (!phone) {
        toast({ title: 'Nomor HP penyewa tidak tersedia', variant: 'destructive' });
        return;
      }
      const name = contact?.name || fallbackName || 'Kak';
      const product = contact?.product_name || productName || 'gear sewa';
      const msg = `Halo ${name}, terkait sewa gear *${product}* di LookMotoTour. Mohon konfirmasi detail penjadwalan ya 🙏`;
      const url = `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast({ title: 'Gagal mengambil kontak', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <VendorLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <Package className="h-6 w-6" /> Sewa Gear
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => (
            <div key={r.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {r.products?.image_url && (
                    <img src={r.products.image_url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{r.products?.name}</p>
                      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {r.profiles?.name || '—'} ({r.profiles?.phone || '—'})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.events?.title ? `Trip: ${r.events.title} • ` : ''}
                      {formatDate(r.start_date)} → {formatDate(r.end_date)} • {r.total_days} hari • Qty: {r.qty}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {formatPrice(r.total_price)} {r.deposit_amount > 0 && <span className="text-xs font-normal text-muted-foreground">+ deposit {formatPrice(r.deposit_amount)}</span>}
                    </p>
                    {r.pickup_notes && <p className="text-xs text-muted-foreground mt-1">📝 Pickup: {r.pickup_notes}</p>}
                    {r.return_notes && <p className="text-xs text-muted-foreground">📦 Return: {r.return_notes}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openWhatsApp(r.id, r.profiles?.name, r.products?.name)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat WA
                  </Button>
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => update.mutate({ id: r.id, status: 'confirmed' })}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Konfirmasi
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => update.mutate({ id: r.id, status: 'cancelled' })}>
                        <XCircle className="h-3 w-3 mr-1" /> Batal
                      </Button>
                    </>
                  )}
                  {r.status === 'confirmed' && (
                    <Button size="sm" onClick={() => { setNoteDialog({ id: r.id, field: 'pickup_notes', nextStatus: 'picked_up' }); setNoteText(r.pickup_notes || ''); }}>
                      <Truck className="h-3 w-3 mr-1" /> Mark Diambil
                    </Button>
                  )}
                  {r.status === 'picked_up' && (
                    <Button size="sm" onClick={() => { setNoteDialog({ id: r.id, field: 'return_notes', nextStatus: 'returned' }); setNoteText(r.return_notes || ''); }}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Dikembalikan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && <p className="text-center text-muted-foreground py-8">Tidak ada sewa.</p>}
        </div>
      )}

      <Dialog open={!!noteDialog} onOpenChange={(v) => !v && setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{noteDialog?.field === 'pickup_notes' ? 'Catatan Pengambilan' : 'Catatan Pengembalian'}</DialogTitle>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Kondisi gear, catatan tambahan..." rows={4} />
          <Button onClick={submitNote} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan
          </Button>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  );
}
