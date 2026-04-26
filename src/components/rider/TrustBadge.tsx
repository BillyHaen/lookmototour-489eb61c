import { Shield, ShieldCheck, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function getTrustTier(score: number) {
  if (score >= 300) return { label: 'Pro Rider', icon: Crown, color: 'bg-primary text-primary-foreground' };
  if (score >= 100) return { label: 'Trusted Rider', icon: ShieldCheck, color: 'bg-accent text-accent-foreground' };
  return { label: 'New Rider', icon: Shield, color: 'bg-secondary text-secondary-foreground' };
}

export default function TrustBadge({ score, className = '' }: { score: number; className?: string }) {
  const tier = getTrustTier(score);
  const Icon = tier.icon;
  return (
    <Badge className={`${tier.color} gap-1 px-2.5 py-1 ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {tier.label}
    </Badge>
  );
}
