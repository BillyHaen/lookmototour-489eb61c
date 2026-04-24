import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWalletLedger } from '@/hooks/useWallet';
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

const PAGE_SIZE = 5;

export default function CreditHistoryList() {
  const { data: ledger = [], isLoading } = useWalletLedger(500);
  const [page, setPage] = useState(1);

  const total = ledger.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const items = ledger.slice(start, start + PAGE_SIZE);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground text-center py-6">Memuat…</p>;
  }
  if (total === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">Belum ada aktivitas kredit.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((row: any) => {
          const meta = TYPE_LABEL[row.entry_type] || TYPE_LABEL.adjust;
          const Icon = meta.icon;
          const toneClass =
            meta.tone === 'pos' ? 'text-emerald-600' :
            meta.tone === 'neg' ? 'text-destructive' : 'text-muted-foreground';
          return (
            <div key={row.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted-foreground">
            Hal {page} / {totalPages} · {total} aktivitas
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
