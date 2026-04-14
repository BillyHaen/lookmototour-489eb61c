import { useEvents } from '@/hooks/useEvents';
import { useRecommendedEvents } from '@/hooks/useRecommendedEvents';
import EventCard from '@/components/EventCard';
import type { DbEvent } from '@/hooks/useEvents';
import { Sparkles } from 'lucide-react';

interface Props {
  currentEvent: DbEvent;
}

export default function EventRecommendations({ currentEvent }: Props) {
  const { data: allEvents } = useEvents();
  const recommendations = useRecommendedEvents(currentEvent, allEvents, 3);

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="font-heading font-bold text-2xl mb-2 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" /> Event Rekomendasi Untukmu
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Berdasarkan style touring, level rider, dan tipe motor yang serupa
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(({ event, reasons }) => (
          <div key={event.id} className="space-y-2">
            <EventCard event={event} />
            <div className="flex flex-wrap gap-1 px-1">
              {reasons.slice(0, 3).map((r) => (
                <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {r}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
