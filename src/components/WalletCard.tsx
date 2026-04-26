import { Wallet, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWalletLedger } from '@/hooks/useWallet';
import { useCreditTerms } from '@/hooks/useCreditTerms';
import { formatPrice } from '@/data/events';
import RichTextContent from '@/components/RichTextContent';

export default function WalletCard() {
  const { data: ledger = [] } = useWalletLedger(500);
  const { data: termsHtml } = useCreditTerms();
  const totalBalance = ledger.reduce((sum: number, row: any) => sum + (Number(row.amount) || 0), 0);

  const hasTerms = !!(termsHtml && termsHtml.trim());

  const TermsTrigger = (
    <button
      type="button"
      aria-label="Syarat & Ketentuan Wallet"
      className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
    >
      <Info className="h-4 w-4" />
    </button>
  );

  const TermsBody = (
    <div className="space-y-2">
      <p className="text-sm font-semibold flex items-center gap-1.5">
        <Info className="h-4 w-4 text-primary" /> Syarat & Ketentuan Wallet
      </p>
      {hasTerms ? (
        <RichTextContent content={termsHtml!} className="text-xs" />
      ) : (
        <p className="text-xs text-muted-foreground">Belum ada syarat & ketentuan yang diatur.</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Wallet Saya
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center relative">
          <p className="text-xs text-muted-foreground mb-1">Total saldo wallet</p>
          <div className="flex items-center justify-center gap-1.5">
            <p className="font-heading text-3xl font-bold text-primary">
              {formatPrice(totalBalance)}
            </p>
            {/* Desktop: hover. Mobile: tap (popover). */}
            <span className="hidden sm:inline">
              <HoverCard openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>{TermsTrigger}</HoverCardTrigger>
                <HoverCardContent className="w-80 max-h-80 overflow-auto" side="top">
                  {TermsBody}
                </HoverCardContent>
              </HoverCard>
            </span>
            <span className="sm:hidden">
              <Popover>
                <PopoverTrigger asChild>{TermsTrigger}</PopoverTrigger>
                <PopoverContent className="w-72 max-h-80 overflow-auto" side="top">
                  {TermsBody}
                </PopoverContent>
              </Popover>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Total dari semua riwayat (masuk − terpakai)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
