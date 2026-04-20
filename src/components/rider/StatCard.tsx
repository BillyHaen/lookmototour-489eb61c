import { LucideIcon } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}
