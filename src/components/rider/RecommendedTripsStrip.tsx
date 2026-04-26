import { useEvents } from '@/hooks/useEvents';
import EventCard from '@/components/EventCard';
import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  ridingStyle?: string | null;
}

/**
 * Personalized trip recommendations for the logged-in rider on their own profile.
 * Filters upcoming events and prioritizes matching touring_style.
 */
export default function RecommendedTripsStrip({ ridingStyle }: Props) {
  const { data: events = [] } = useEvents();

  const recommendations = useMemo(() => {
    const upcoming = events.filter((e: any) => e.status !== 'completed');
    if (!ridingStyle) return upcoming.slice(0, 3);
    const matching = upcoming.filter((e: any) => e.touring_style === ridingStyle);
    const others = upcoming.filter((e: any) => e.touring_style !== ridingStyle);
    return [...matching, ...others].slice(0, 3);
  }, [events, ridingStyle]);

  if (recommendations.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h2 className="font-heading font-semibold text-lg mb-1 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Trip Rekomendasi Untukmu
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {ridingStyle ? `Cocok untuk gaya ${ridingStyle}` : 'Trip yang akan datang'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((e: any) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}
