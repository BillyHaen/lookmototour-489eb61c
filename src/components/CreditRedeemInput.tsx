import { useState, useEffect, useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWalletLedger, useWalletSettings } from '@/hooks/useWallet';
import { formatPrice } from '@/data/events';

interface Props {
  totalPrice: number;
  value: number;
  onChange: (amount: number) => void;
}

/**
 * Reusable input untuk pakai kredit saat checkout (trip / rental).
 * Hanya tampil jika user punya saldo > 0.
 * Saldo dihitung dari penjumlahan ledger (positif - negatif), konsisten dengan WalletCard.
 */
export default function CreditRedeemInput({ totalPrice, value, onChange }: Props) {
  const { data: ledger = [] } = useWalletLedger(500);
  const { data: settings } = useWalletSettings();
  const balance = useMemo(
    () => ledger.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0),
    [ledger]
  );
  const maxPercent = settings?.max_redeem_percent ?? 100;
  const cap = Math.floor(totalPrice * maxPercent / 100);
  const maxRedeem = Math.max(0, Math.min(balance, cap));
  const [input, setInput] = useState(value || 0);

  useEffect(() => { setInput(value || 0); }, [value]);

  // Auto-clamp jika total trip berubah (mis. ganti tipe pendaftaran)
  useEffect(() => {
    if (value > maxRedeem) onChange(maxRedeem);
  }, [maxRedeem, value, onChange]);

  if (balance <= 0) return null;

  const apply = (n: number) => {
    const safe = Math.max(0, Math.min(n, maxRedeem));
    setInput(safe);
    onChange(safe);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Wallet className="h-4 w-4 text-primary" /> Pakai Kredit
        </Label>
        <span className="text-xs text-muted-foreground">Saldo: {formatPrice(balance)}</span>
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          max={maxRedeem}
          value={input || ''}
          onChange={(e) => apply(parseInt(e.target.value || '0', 10))}
          placeholder="0"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => apply(maxRedeem)}>
          Pakai Maks
        </Button>
        {input > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => apply(0)}>
            Batal
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Maks {formatPrice(maxRedeem)}{maxPercent < 100 && ` (${maxPercent}% dari total)`}
      </p>
    </div>
  );
}
