import { useGearRecommendations, RentalRecommendation } from '@/hooks/useGearRecommendations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/data/events';
import { Sparkles, Package, Plus, Minus, Loader2 } from 'lucide-react';

export interface SelectedRental {
  product_id: string;
  name: string;
  qty: number;
  daily_price: number;
  total_days: number;
  subtotal: number;
  deposit: number;
  vendor_id: string | null;
}

interface Props {
  eventId: string;
  motorType: string;
  motorBrand?: string;
  selected: Record<string, SelectedRental>;
  onChange: (next: Record<string, SelectedRental>) => void;
}

export default function RentalGearRecommendations({ eventId, motorType, motorBrand = '', selected, onChange }: Props) {
  const { data: recs = [], isLoading } = useGearRecommendations(eventId, motorType, motorBrand);

  if (!motorType || motorType.length < 2) return null;


  const updateQty = (rec: RentalRecommendation, delta: number) => {
    const current = selected[rec.product_id]?.qty || 0;
    const next = Math.max(0, Math.min(rec.available_qty, current + delta));
    const updated = { ...selected };
    if (next === 0) {
      delete updated[rec.product_id];
    } else {
      updated[rec.product_id] = {
        product_id: rec.product_id,
        name: rec.name,
        qty: next,
        daily_price: rec.daily_rent_price,
        total_days: rec.trip_days,
        subtotal: rec.subtotal * next,
        deposit: rec.rent_deposit * next,
        vendor_id: rec.vendor_id,
      };
    }
    onChange(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Mencari gear yang cocok...</p>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="space-y-1 p-3 rounded-lg border border-dashed border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Sewa Gear (Opsional)</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Belum ada gear yang cocok untuk motor & trip ini. Cek lagi nanti, kami terus menambah inventori.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Sewa Gear (Opsional) — Try First, Buy Later</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Rekomendasi gear berdasarkan motor & karakter trip. Cocok dulu di trip, baru beli kalau suka.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {recs.map((rec) => {
          const sel = selected[rec.product_id];
          const isPicked = !!sel;
          return (
            <div
              key={rec.product_id}
              className={`p-3 rounded-lg border transition-all ${
                isPicked ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className="flex gap-2">
                <div className="w-14 h-14 rounded bg-muted overflow-hidden flex-shrink-0">
                  {rec.image_url ? (
                    <img src={rec.image_url} alt={rec.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1">
                    <p className="text-sm font-medium truncate">{rec.name}</p>
                    {rec.score >= 10 && (
                      <Badge variant="default" className="text-[10px] px-1 h-4 flex-shrink-0">
                        <Sparkles className="h-2 w-2 mr-0.5" /> Rekomen
                      </Badge>
                    )}
                  </div>
                  {rec.vendor_name && (
                    <p className="text-[11px] text-muted-foreground truncate">oleh {rec.vendor_name}</p>
                  )}
                  <p className="text-xs mt-0.5">
                    <span className="font-bold text-primary">{formatPrice(rec.daily_rent_price)}</span>
                    <span className="text-muted-foreground"> /hari × {rec.trip_days} hari</span>
                  </p>
                  <p className="text-xs font-semibold">
                    Total: {formatPrice(rec.subtotal * (sel?.qty || 1))}
                    {rec.rent_deposit > 0 && (
                      <span className="text-muted-foreground font-normal"> + deposit {formatPrice(rec.rent_deposit)}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  Tersedia: {rec.available_qty}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQty(rec, -1)}
                    disabled={!sel}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">{sel?.qty || 0}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQty(rec, 1)}
                    disabled={(sel?.qty || 0) >= rec.available_qty}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
