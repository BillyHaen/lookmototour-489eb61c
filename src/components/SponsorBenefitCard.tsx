import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Tag, Sparkles, Bike, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const TYPE_META: Record<string, { label: string; icon: typeof Gift }> = {
  discount: { label: 'Diskon', icon: Tag },
  free_item: { label: 'Item Gratis', icon: Gift },
  experience: { label: 'Pengalaman', icon: Sparkles },
  test_ride: { label: 'Test Ride', icon: Bike },
};

interface Props {
  benefit: any;
  onClaim?: () => void;
  claimCode?: string;
  loading?: boolean;
  compact?: boolean;
}

export default function SponsorBenefitCard({ benefit, onClaim, claimCode, loading, compact }: Props) {
  const meta = TYPE_META[benefit.type] || TYPE_META.discount;
  const Icon = meta.icon;
  const [copied, setCopied] = useState(false);
  const remaining = benefit.quota != null ? benefit.quota - (benefit.claimed_count || 0) : null;
  const expired = benefit.valid_until && new Date(benefit.valid_until) < new Date();

  const copyCode = () => {
    if (!claimCode) return;
    navigator.clipboard.writeText(claimCode);
    setCopied(true);
    toast({ title: 'Kode disalin' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:-translate-y-1 hover:shadow-elevated transition-all border-l-4" style={{ borderLeftColor: 'hsl(24 95% 53%)' }}>
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(24 95% 53% / 0.15)' }}>
            <Icon className="h-5 w-5" style={{ color: 'hsl(24 95% 53%)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="mb-1 text-xs">{meta.label}</Badge>
            <h4 className="font-heading font-semibold leading-tight">{benefit.title}</h4>
          </div>
        </div>

        {benefit.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{benefit.description}</p>}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
          {remaining != null && (
            <span className={remaining <= 0 ? 'text-destructive font-medium' : ''}>
              Sisa: {Math.max(0, remaining)}/{benefit.quota}
            </span>
          )}
          {benefit.valid_until && (
            <span className={expired ? 'text-destructive' : ''}>
              Berlaku s/d {format(new Date(benefit.valid_until), 'dd MMM yyyy')}
            </span>
          )}
        </div>

        {benefit.terms && <p className="text-xs text-muted-foreground italic mb-3">{benefit.terms}</p>}

        {claimCode ? (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
            <code className="flex-1 font-mono text-sm font-bold">{claimCode}</code>
            <Button size="sm" variant="ghost" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        ) : onClaim ? (
          <Button
            onClick={onClaim}
            disabled={loading || expired || (remaining != null && remaining <= 0)}
            className="w-full"
            style={{ backgroundColor: 'hsl(24 95% 53%)', color: 'white' }}
          >
            {expired ? 'Kadaluarsa' : remaining != null && remaining <= 0 ? 'Habis' : 'Klaim Sekarang'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
