import { Badge } from '@/components/ui/badge';
import { Package, MapPin } from 'lucide-react';
import { formatDate, formatPrice } from '@/data/events';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu', confirmed: 'Dikonfirmasi', picked_up: 'Disewa', returned: 'Dikembalikan', cancelled: 'Dibatalkan',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  confirmed: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  picked_up: 'bg-primary/15 text-primary border-primary/30',
  returned: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function RentalCard({ rental }: { rental: any }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {rental.products?.image_url ? (
            <img src={rental.products.image_url} alt={rental.products?.name || ''} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm truncate">{rental.products?.name}</p>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_CLASS[rental.status] || ''}`}>
              {STATUS_LABEL[rental.status] || rental.status}
            </Badge>
          </div>
          {rental.products?.vendors?.name && (
            <p className="text-xs text-muted-foreground">oleh {rental.products.vendors.name}</p>
          )}
          {rental.events?.title && (
            <p className="text-xs text-primary mt-0.5 inline-flex items-center gap-1 truncate max-w-full">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{rental.events.title}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(rental.start_date)} → {formatDate(rental.end_date)} · {rental.total_days}h · Qty {rental.qty}
          </p>
          <p className="text-sm font-bold text-primary mt-1.5">
            {formatPrice(rental.total_price)}
            {rental.deposit_amount > 0 && (
              <span className="text-[11px] font-normal text-muted-foreground ml-1">+ deposit {formatPrice(rental.deposit_amount)}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
