import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Ticket } from 'lucide-react';
import { formatDate, formatPrice } from '@/data/events';

export default function RegistrationRow({ reg }: { reg: any }) {
  const ev = reg.events;
  const regTypeLabel = reg.registration_type === 'sharing' ? 'Sharing' : reg.registration_type === 'couple' ? 'Couple' : 'Single';
  const paymentStatus = reg.payment_status || 'pending';
  const paymentLabel = paymentStatus === 'lunas' ? 'Lunas' : paymentStatus === 'batal' ? 'Batal' : paymentStatus?.startsWith('cicilan_') ? `Cicilan ${paymentStatus.split('_')[1]}` : 'Menunggu Bayar';
  const paymentVariant = paymentStatus === 'lunas' ? 'default' : paymentStatus === 'batal' ? 'destructive' : paymentStatus?.startsWith('cicilan_') ? 'secondary' : 'outline';

  const basePrice = reg.registration_type === 'sharing' ? (ev?.price_sharing || 0) : reg.registration_type === 'couple' ? (ev?.price_couple || 0) : (ev?.price_single || ev?.price || 0);
  const towingTotal = (reg.towing_pergi ? (ev?.towing_pergi_price || 0) : 0) + (reg.towing_pulang ? (ev?.towing_pulang_price || 0) : 0);

  return (
    <div className="py-3 border-b border-border last:border-0 flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{ev?.title}</p>
        <p className="text-xs text-muted-foreground">
          {ev?.date ? formatDate(ev.date) : '—'} · {ev?.location || '—'}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <Badge variant="outline" className="text-[10px]">{regTypeLabel}</Badge>
          {reg.towing_pergi && (
            <Badge variant="outline" className="text-[10px] gap-1"><Truck className="h-2.5 w-2.5" />Towing Pergi</Badge>
          )}
          {reg.towing_pulang && (
            <Badge variant="outline" className="text-[10px] gap-1"><Truck className="h-2.5 w-2.5" />Towing Pulang</Badge>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <Badge variant={reg.status === 'confirmed' ? 'default' : 'secondary'} className="text-[10px]">
          {reg.status === 'confirmed' ? 'Terdaftar' : reg.status}
        </Badge>
        <Badge variant={paymentVariant as any} className="text-[10px] block">
          {paymentLabel}
        </Badge>
        <p className="text-sm font-bold text-primary">{formatPrice(basePrice + towingTotal)}</p>
        {ev?.slug && (
          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
            <Link to={`/events/${ev.slug}`}><Ticket className="h-3 w-3" /> Tiket</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
