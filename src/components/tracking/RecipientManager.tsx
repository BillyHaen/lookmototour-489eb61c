import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, MessageCircle, Loader2, Users } from 'lucide-react';
import { useTrackingRecipients, useAddRecipient, useRemoveRecipient } from '@/hooks/useTrackingSession';
import { toast } from '@/hooks/use-toast';

export default function RecipientManager({ sessionId }: { sessionId: string }) {
  const { data: recipients = [] } = useTrackingRecipients(sessionId);
  const add = useAddRecipient();
  const remove = useRemoveRecipient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Nama dan nomor WA wajib diisi', variant: 'destructive' });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62');
    if (cleanPhone.length < 9) {
      toast({ title: 'Nomor WA tidak valid', variant: 'destructive' });
      return;
    }
    try {
      await add.mutateAsync({ sessionId, name: name.trim(), phone: cleanPhone });
      setName('');
      setPhone('');
      toast({ title: 'Keluarga ditambahkan', description: 'Klik tombol WA untuk kirim link tracking.' });
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  const buildPublicUrl = (token: string) => `${window.location.origin}/track/${token}`;
  const buildWaLink = (r: { name: string; phone: string; access_token: string }) =>
    `https://wa.me/${r.phone}?text=${encodeURIComponent(
      `Halo ${r.name}, ini link untuk pantau perjalanan touring saya secara real-time:\n\n${buildPublicUrl(r.access_token)}\n\nLink ini dari LookMotoTour.`,
    )}`;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold">Keluarga yang Dishare ({recipients.length})</h3>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
          <div>
            <Label htmlFor="rec-name" className="text-xs">Nama / Hubungan</Label>
            <Input id="rec-name" placeholder="Istri, Ibu, dll" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          </div>
          <div>
            <Label htmlFor="rec-phone" className="text-xs">Nomor WhatsApp</Label>
            <Input id="rec-phone" type="tel" placeholder="08xxx" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={add.isPending} className="w-full sm:w-auto gap-1">
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tambah
            </Button>
          </div>
        </form>

        {recipients.length > 0 && (
          <div className="space-y-2">
            {recipients.map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">+{r.phone}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={buildWaLink(r)} target="_blank" rel="noreferrer" className="gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> Kirim
                  </a>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate({ id: r.id, sessionId })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {recipients.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada keluarga ditambahkan. Tambahkan minimal 1 untuk mulai share lokasi.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
