import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import EventCard from '@/components/EventCard';
import type { DbEvent } from '@/hooks/useEvents';

interface Category {
  label: string;
  emoji: string;
  event_ids: string[];
}

interface Props {
  categories: Category[];
  reasons: Record<string, string>;
  events: DbEvent[];
  interestCounts: Record<string, number>;
  onReset: () => void;
}

function ScrollRow({ category, events, reasons, interestCounts }: {
  category: Category;
  events: DbEvent[];
  reasons: Record<string, string>;
  interestCounts: Record<string, number>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const matched = category.event_ids
    .map((id) => events.find((e) => e.id === id))
    .filter(Boolean) as DbEvent[];

  if (matched.length === 0) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className="mb-8">
      <h3 className="font-heading font-bold text-xl mb-4 flex items-center gap-2">
        <span className="text-2xl">{category.emoji}</span> {category.label}
      </h3>
      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {matched.map((event) => (
            <div key={event.id} className="min-w-[280px] max-w-[300px] snap-start flex-shrink-0 space-y-2">
              <EventCard event={event} interestCount={interestCounts[event.id] ?? 0} />
              {reasons[event.id] && (
                <p className="text-xs text-muted-foreground px-1 italic">
                  💡 {reasons[event.id]}
                </p>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TripMatchResults({ categories, reasons, events, interestCounts, onReset }: Props) {
  const hasResults = categories.some((c) => c.event_ids.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">
            🎬 Recommended Rides for You
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Hasil rekomendasi AI berdasarkan preferensi kamu
          </p>
        </div>
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Ulang Quiz
        </Button>
      </div>

      {hasResults ? (
        categories.map((cat) => (
          <ScrollRow
            key={cat.label}
            category={cat}
            events={events}
            reasons={reasons}
            interestCounts={interestCounts}
          />
        ))
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            Belum ada event yang cocok saat ini. Coba ubah preferensi kamu!
          </p>
          <Button onClick={onReset} className="mt-4 gap-2">
            <RotateCcw className="h-4 w-4" /> Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
