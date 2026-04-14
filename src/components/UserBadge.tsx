import { Star, Flame, Shield, Trophy, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BADGES = [
  { min: 1, label: 'Rookie Rider', icon: Star, color: 'text-muted-foreground' },
  { min: 3, label: 'Explorer', icon: Flame, color: 'text-accent' },
  { min: 5, label: 'Road Warrior', icon: Shield, color: 'text-primary' },
  { min: 10, label: 'Legend', icon: Trophy, color: 'text-primary' },
  { min: 20, label: 'Grand Master', icon: Award, color: 'text-primary' },
];

export function getHighestBadge(eventCount: number) {
  const earned = BADGES.filter(b => eventCount >= b.min);
  return earned.length > 0 ? earned[earned.length - 1] : null;
}

export function getAllBadges(eventCount: number) {
  return BADGES.filter(b => eventCount >= b.min);
}

export default function UserBadge({ eventCount, showAll = false }: { eventCount: number; showAll?: boolean }) {
  if (showAll) {
    const badges = getAllBadges(eventCount);
    if (badges.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map(b => (
          <Badge key={b.label} variant="outline" className="gap-1 text-xs">
            <b.icon className={`h-3 w-3 ${b.color}`} />
            {b.label}
          </Badge>
        ))}
      </div>
    );
  }

  const badge = getHighestBadge(eventCount);
  if (!badge) return null;
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <badge.icon className={`h-3 w-3 ${badge.color}`} />
      {badge.label}
    </Badge>
  );
}
