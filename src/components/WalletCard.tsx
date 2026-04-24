import { Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWalletBalance, useWalletLedger } from '@/hooks/useWallet';
import { formatPrice } from '@/data/events';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const TYPE_LABEL: Record<string, { label: string; tone: 'pos' | 'neg' | 'neu'; icon: any }> = {
  earn: { label: 'Diterima', tone: 'pos', icon: TrendingUp },
  refund: { label: 'Refund', tone: 'pos', icon: TrendingUp },
  adjust: { label: 'Penyesuaian', tone: 'neu', icon: Wallet },
  redeem: { label: 'Dipakai', tone: 'neg', icon: TrendingDown },
  expire: { label: 'Kedaluwarsa', tone: 'neg', icon: Clock },
};

export default function WalletCard() {
  const { data: balance = 0, isLoading } = useWalletBalance();
  const { data: ledger = [] } = useWalletLedger(20);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Kredit Saya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">Saldo aktif</p>
          <p className="font-heading text-3xl font-bold text-primary">
            {formatPrice(balance)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Bisa dipakai sebagai potongan harga trip atau gear
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Riwayat</h4>
          {ledger.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Belum ada aktivitas kredit.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {ledger.map((row: any) => {
                const meta = TYPE_LABEL[row.entry_type] || TYPE_LABEL.adjust;
                const Icon = meta.icon;
                const toneClass =
                  meta.tone === 'pos' ? 'text-emerald-600' :
                  meta.tone === 'neg' ? 'text-destructive' : 'text-muted-foreground';
                return (
                  <div key={row.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-2.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${toneClass}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.description || meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(row.created_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                          {row.expires_at && row.entry_type === 'earn' && row.remaining > 0 && (
                            <> · exp {format(new Date(row.expires_at), 'd MMM yyyy', { locale: idLocale })}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${toneClass}`}>
                        {row.amount > 0 ? '+' : ''}{formatPrice(row.amount)}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{meta.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
