import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/data/events';
import { Loader2, CalendarDays } from 'lucide-react';
import CreditRedeemInput from '@/components/CreditRedeemInput';

interface Props {
  product: any;
  trigger: React.ReactNode;
}

export default function RentalCheckoutDialog({ product, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [qty, setQty] = useState(1);
  const [credit, setCredit] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const days = start && end
    ? Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1)
    : 0;
  const subtotal = days * (product.daily_rent_price || 0) * qty;
  const deposit = (product.rent_deposit || 0) * qty;
  const totalDue = Math.max(0, subtotal + deposit - credit);

  const submit = async () => {
    if (!user) { toast({ title: 'Login diperlukan', variant: 'destructive' }); navigate('/login'); return; }
    if (!start || !end || days < 1) { toast({ title: 'Pilih tanggal sewa yang valid', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await (supabase.rpc as any)('create_rental_with_credit', {
      _product_id: product.id, _qty: qty, _daily_price: product.daily_rent_price,
      _total_days: days, _total_price: subtotal, _deposit: deposit,
      _start_date: start, _end_date: end, _credit_redeem: credit,
    });
    setLoading(false);
    if (error) { toast({ title: 'Gagal', description: error.message, variant: 'destructive' }); return; }
    qc.invalidateQueries({ queryKey: ['my-rentals'] });
    qc.invalidateQueries({ queryKey: ['wallet-balance'] });
    qc.invalidateQueries({ queryKey: ['wallet-ledger'] });
    setOpen(false);
    toast({ title: 'Permintaan sewa terkirim! ✅', description: 'Admin akan menghubungi via WhatsApp untuk konfirmasi.' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Sewa: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tanggal Mulai</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label className="text-xs">Tanggal Selesai</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} min={start || new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Jumlah</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
          </div>

          <CreditRedeemInput totalPrice={subtotal + deposit} value={credit} onChange={setCredit} />

          <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{formatPrice(product.daily_rent_price)} × {days || 0} hari × {qty}</span><span>{formatPrice(subtotal)}</span></div>
            {deposit > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Deposit (refundable)</span><span>+ {formatPrice(deposit)}</span></div>}
            {credit > 0 && <div className="flex justify-between text-xs text-emerald-600"><span>Pakai wallet</span><span>− {formatPrice(credit)}</span></div>}
            <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total Bayar</span><span className="text-primary">{formatPrice(totalDue)}</span></div>
          </div>
          <Button className="w-full" onClick={submit} disabled={loading || !start || !end}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Kirim Permintaan Sewa
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Admin akan konfirmasi via WhatsApp. Pembayaran manual.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
