import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RichTextContent from '@/components/RichTextContent';
import RentalCheckoutDialog from '@/components/RentalCheckoutDialog';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/events';
import { MessageCircle, CalendarDays, Tag, Package } from 'lucide-react';
import eventPlaceholder from '@/assets/event-placeholder.jpg';

interface Props {
  product: any;
}

export default function ProductCard({ product }: Props) {
  const canRent = product.is_rentable && product.daily_rent_price > 0;
  const canBuy = product.is_purchasable && product.price > 0;
  const [mode, setMode] = useState<'rent' | 'buy'>(canRent && !canBuy ? 'rent' : 'buy');

  // Real-time availability via RPC (counts active rentals overlapping today)
  const { data: availability } = useQuery({
    queryKey: ['product-availability', product.id],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_product_availability', {
        _product_id: product.id,
      });
      if (error) throw error;
      return (data?.[0] || null) as { available_to_buy: number; available_to_rent: number; currently_rented: number; sold: number; total_inventory: number } | null;
    },
    staleTime: 60 * 1000,
  });

  const availableToBuy = availability?.available_to_buy ?? Math.max(0, (product.total_inventory ?? product.stock ?? 0) - (product.sold_count || 0));
  const availableToRent = availability?.available_to_rent ?? (product.total_inventory ?? 0);
  const currentlyRented = availability?.currently_rented ?? 0;

  const buyWhatsApp = () => {
    const msg = `Halo, saya ingin membeli:\n\n*${product.name}*\nHarga: ${formatPrice(product.price)}\n\nMohon info ketersediaan & pembayaran. Terima kasih!`;
    return `https://wa.me/628996053877?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="rounded-xl bg-card shadow-card border border-border overflow-hidden group hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="aspect-square overflow-hidden bg-muted relative">
        <img
          src={product.image_url || eventPlaceholder}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {canRent && (
          <Badge className="absolute top-2 left-2 gap-1 bg-accent text-accent-foreground">
            <Tag className="h-3 w-3" /> Bisa Disewa
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <Badge variant="secondary" className="mb-2 capitalize">{product.category}</Badge>
          <h3 className="font-heading font-semibold text-lg">{product.name}</h3>
          {product.vendors?.name && (
            <p className="text-xs text-muted-foreground">oleh {product.vendors.name}</p>
          )}
          <RichTextContent content={product.description} className="text-sm text-muted-foreground line-clamp-2 mt-1" />
        </div>

        {/* Mode toggle */}
        {canRent && canBuy && (
          <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
            <button
              type="button"
              onClick={() => setMode('rent')}
              className={`flex-1 text-xs py-1.5 rounded transition-colors ${mode === 'rent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Sewa
            </button>
            <button
              type="button"
              onClick={() => setMode('buy')}
              className={`flex-1 text-xs py-1.5 rounded transition-colors ${mode === 'buy' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Beli
            </button>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mt-auto">
          {mode === 'rent' && canRent ? (
            <>
              <div>
                <p className="font-bold text-xl text-primary">{formatPrice(product.daily_rent_price)}</p>
                <p className="text-[11px] text-muted-foreground">/ hari</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                  <Package className="h-3 w-3" /> {availableToRent} tersedia
                </span>
                {currentlyRented > 0 && (
                  <span className="text-[10px] text-muted-foreground">{currentlyRented} disewa</span>
                )}
                {product.rent_deposit > 0 && (
                  <span className="block text-[10px] text-muted-foreground">Deposit {formatPrice(product.rent_deposit)}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="font-bold text-xl text-primary">{formatPrice(product.price)}</p>
              <span className="text-xs text-muted-foreground">Stok: {availableToBuy}</span>
            </>
          )}
        </div>

        {/* CTA */}
        {mode === 'rent' && canRent ? (
          <RentalCheckoutDialog
            product={product}
            trigger={
              <Button className="w-full gap-2" disabled={availableToRent <= 0}>
                <CalendarDays className="h-4 w-4" /> {availableToRent > 0 ? 'Sewa Sekarang' : 'Habis Disewa'}
              </Button>
            }
          />
        ) : (
          <Button className="w-full gap-2" asChild disabled={availableToBuy <= 0}>
            <a href={buyWhatsApp()} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> {availableToBuy > 0 ? 'Beli via WhatsApp' : 'Stok Habis'}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
