import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  pulse?: boolean;
  accent?: 'primary' | 'emerald' | 'amber';
}

export default function StatCard({ icon: Icon, label, value, pulse, accent = 'primary' }: StatCardProps) {
  const accentClass =
    accent === 'emerald' ? 'text-emerald-600 bg-emerald-500/10' :
    accent === 'amber' ? 'text-amber-600 bg-amber-500/10' :
    'text-primary bg-primary/10';

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
      <div className={cn('relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0', accentClass)}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground font-medium truncate">{label}</p>
        <p className="font-heading text-sm sm:text-lg font-bold leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}
