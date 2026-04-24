import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

export default function LiveTrackingWidget({ activeCount, totalCount }: { activeCount: number; totalCount: number }) {
  const hasActive = activeCount > 0;
  return (
    <Card className="rounded-xl shadow-sm border-primary/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Navigation className="h-5 w-5" />
            {hasActive && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <p className="font-heading font-semibold text-sm">Live Tracking</p>
            <p className="text-xs text-muted-foreground">
              {hasActive ? `${activeCount} sesi sedang aktif` : totalCount > 0 ? 'Tidak ada sesi aktif' : 'Belum ada sesi'}
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full">
          <Link to="/tracking/manage">Kelola Sesi</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
