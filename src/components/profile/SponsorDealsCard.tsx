import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

export default function SponsorDealsCard() {
  return (
    <Card className="rounded-xl shadow-sm overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-background border-primary/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm">Deals Eksklusif</p>
            <p className="text-xs text-muted-foreground">Penawaran sponsor untuk member</p>
          </div>
        </div>
        <Button asChild size="sm" variant="default" className="w-full">
          <Link to="/dashboard/sponsor-deals">Lihat Semua</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
