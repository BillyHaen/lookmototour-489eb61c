import { Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletLedger } from '@/hooks/useWallet';
import { formatPrice } from '@/data/events';

export default function WalletCard() {
  const { data: ledger = [] } = useWalletLedger(500);
  const totalBalance = ledger.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Kredit Saya
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total kredit</p>
          <p className="font-heading text-3xl font-bold text-primary">
            {formatPrice(totalBalance)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Total dari semua riwayat (masuk − terpakai)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


