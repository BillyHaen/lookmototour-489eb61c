import { Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletBalance } from '@/hooks/useWallet';
import { formatPrice } from '@/data/events';

export default function WalletCard() {
  const { data: balance = 0 } = useWalletBalance();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Kredit Saya
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">Saldo aktif</p>
          <p className="font-heading text-3xl font-bold text-primary">
            {formatPrice(balance)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Bisa dipakai sebagai potongan harga trip atau gear
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

