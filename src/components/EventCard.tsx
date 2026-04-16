import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Gauge, Clock, Zap, Heart, Shield } from 'lucide-react';
import { EVENT_CATEGORIES, formatPrice, formatDate, formatTentativeMonth, EventCategory, FATIGUE_LABELS, calculateSafetyScore } from '@/data/events';
import type { DbEvent } from '@/hooks/useEvents';
import eventPlaceholder from '@/assets/event-placeholder.jpg';

const STATUS_MAP = {
  upcoming: { label: 'Akan Datang', className: 'bg-accent text-accent-foreground' },
  ongoing: { label: 'Berlangsung', className: 'bg-primary text-primary-foreground' },
  completed: { label: 'Selesai', className: 'bg-muted text-muted-foreground' },
};

const DIFFICULTY_MAP: Record<string, string> = {
  mudah: 'bg-accent/20 text-accent',
  sedang: 'bg-primary/20 text-primary',
  sulit: 'bg-destructive/20 text-destructive',
};

export default function EventCard({ event, interestCount }: { event: DbEvent; interestCount?: number }) {
  const cat = EVENT_CATEGORIES[event.category as EventCategory] || EVENT_CATEGORIES.touring;
  const status = STATUS_MAP[event.status as keyof typeof STATUS_MAP] || STATUS_MAP.upcoming;
  const forceFull = (event as any).force_full || false;
  const spotsLeft = forceFull ? 0 : event.max_participants - event.current_participants;
  const isFull = spotsLeft <= 0 || forceFull;

  return (
    <Link to={`/events/${(event as any).slug || event.id}`}>
      <Card className="overflow-hidden group hover:shadow-elevated transition-all duration-300 border-border h-full">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={event.image_url || eventPlaceholder}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            width={800}
            height={600}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={status.className}>{status.label}</Badge>
            <Badge variant="secondary">{cat.icon} {cat.label}</Badge>
            {(event as any).tentative_month && <Badge variant="outline" className="bg-background/80">📅 Tentative</Badge>}
          </div>
          {isFull && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className="font-heading font-bold text-lg text-primary-foreground bg-destructive px-4 py-2 rounded-lg">PENUH</span>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-heading font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description.replace(/<[^>]*>/g, '')}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{(event as any).tentative_month ? `${formatTentativeMonth((event as any).tentative_month)} (Tentative)` : formatDate(event.date)}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location.split(',')[0]}</span>
            <span className="flex items-center gap-1">
              {(event as any).tentative_month ? (
                <><Users className="h-3.5 w-3.5" /><Heart className="h-3 w-3 text-destructive" /> {interestCount || 0} peminat</>
              ) : (
                <><Users className="h-3.5 w-3.5" />{spotsLeft > 0 ? `${spotsLeft} slot tersisa` : 'Penuh'}</>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DIFFICULTY_MAP[event.difficulty] || ''}`}>
                {event.difficulty.charAt(0).toUpperCase() + event.difficulty.slice(1)}
              </span>
            </span>
          </div>
          {/* Riding hours & Fatigue */}
          {((event as any).riding_hours_per_day > 0 || (event as any).fatigue_level > 1) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {(event as any).riding_hours_per_day > 0 && (
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{(event as any).riding_hours_per_day} jam/hari</span>
              )}
              {(event as any).fatigue_level > 1 && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="flex items-center gap-1">
                    <span className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${((event as any).fatigue_level / 5) * 100}%`,
                          backgroundColor: (event as any).fatigue_level <= 2 ? 'hsl(var(--primary))' : (event as any).fatigue_level <= 3 ? 'hsl(40 100% 50%)' : 'hsl(var(--destructive))',
                        }}
                      />
                    </span>
                    <span className="text-[10px]">{FATIGUE_LABELS[(event as any).fatigue_level] || ''}</span>
                  </span>
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-heading font-bold text-lg text-primary">
              {(event as any).tentative_month
                ? '🔥 Mau gass dong!'
                : (event as any).price_single > 0
                  ? `Mulai ${formatPrice(Math.min(...[((event as any).price_sharing || Infinity), ((event as any).price_single || Infinity), ((event as any).price_couple || Infinity)].filter(p => p > 0 && p !== Infinity)))}`
                  : formatPrice(event.price)}
            </span>
            <span className="text-xs text-muted-foreground">{event.distance}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
