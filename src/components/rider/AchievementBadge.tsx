import { Star, Flame, Shield, Trophy, Award, Map, MapPinned, Globe, Compass, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  star: Star, flame: Flame, shield: Shield, trophy: Trophy, award: Award,
  map: Map, 'map-pinned': MapPinned, globe: Globe, compass: Compass,
};

export default function AchievementBadge({
  achievement, unlocked, progressLabel,
}: { achievement: any; unlocked: boolean; progressLabel?: string }) {
  const Icon = ICON_MAP[achievement.icon] || Trophy;
  return (
    <div className={cn(
      'rounded-lg border p-3 text-center transition',
      unlocked ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border opacity-60 grayscale'
    )}>
      <Icon className={cn('h-8 w-8 mx-auto mb-1.5', unlocked ? 'text-primary' : 'text-muted-foreground')} />
      <p className="font-semibold text-xs leading-tight">{achievement.name}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{achievement.description}</p>
      {!unlocked && progressLabel && (
        <p className="text-[10px] text-primary mt-1 font-medium">{progressLabel}</p>
      )}
    </div>
  );
}
