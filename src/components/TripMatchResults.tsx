import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RotateCcw, MapPin, CalendarDays, Sparkles, ArrowRight } from "lucide-react";
import { formatPrice, formatDate, formatTentativeMonth, EVENT_CATEGORIES, EventCategory } from "@/data/events";
import type { DbEvent } from "@/hooks/useEvents";
import eventPlaceholder from "@/assets/event-placeholder.jpg";

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

function MatchCard({ event, reason, interestCount }: { event: DbEvent; reason?: string; interestCount: number }) {
  const cat = EVENT_CATEGORIES[event.category as EventCategory] || EVENT_CATEGORIES.touring;
  const isTentative = !!event.tentative_month;

  return (
    <Link to={`/events/${event.slug || event.id}`} className="block">
      <Card className="overflow-hidden group hover:shadow-elevated transition-all duration-300 border-border h-full">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={event.image_url || eventPlaceholder}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
            <Badge className="text-[10px] px-2 py-0.5">
              {cat.icon} {cat.label}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <h4 className="font-heading font-bold text-sm line-clamp-1">{event.title}</h4>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {isTentative ? formatTentativeMonth(event.tentative_month!) : formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          </div>
          <div className="text-xs font-semibold text-primary">
            {isTentative ? "Mau gass dong!" : `Mulai ${formatPrice(event.price_sharing || event.price)}`}
          </div>
          {reason && (
            <p className="text-[11px] text-muted-foreground italic leading-snug border-t border-border pt-2 mt-2">
              💡 {reason}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ScrollRow({
  category,
  events,
  reasons,
  interestCounts,
}: {
  category: Category;
  events: DbEvent[];
  reasons: Record<string, string>;
  interestCounts: Record<string, number>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const matched = category.event_ids.map((id) => events.find((e) => e.id === id)).filter(Boolean) as DbEvent[];

  if (matched.length === 0) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      <h3 className="font-heading font-bold text-lg md:text-xl mb-4 flex items-center gap-2">
        <span className="text-xl">{category.emoji}</span> {category.label}
      </h3>
      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-3 top-1/3 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as any}
        >
          {matched.map((event) => (
            <div
              key={event.id}
              className="min-w-[220px] max-w-[220px] md:min-w-[260px] md:max-w-[260px] snap-start flex-shrink-0"
            >
              <MatchCard event={event} reason={reasons[event.id]} interestCount={interestCounts[event.id] ?? 0} />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-1/3 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-2">
            <Sparkles className="h-3 w-3" /> AI Recommendations
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">Rekomendasi yang cocok buat loe!</h2>
          <p className="text-muted-foreground text-sm mt-1">Berdasarkan preferensi touring loe</p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" /> Ulang Quiz
        </Button>
      </div>

      {hasResults ? (
        <>
          {categories.map((cat) => (
            <ScrollRow
              key={cat.label}
              category={cat}
              events={events}
              reasons={reasons}
              interestCounts={interestCounts}
            />
          ))}

          {/* CTA to browse all */}
          <div className="text-center pt-4 pb-8">
            <p className="text-sm text-muted-foreground mb-3">Mau lihat semua event?</p>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/events">
                Jelajahi Semua Event <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg mb-4">
            Belum ada event yang cocok saat ini. Coba ubah preferensi kamu!
          </p>
          <Button onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
