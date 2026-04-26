import { MapPin, Navigation, ExternalLink, Gauge } from 'lucide-react';
import type { ItineraryDay } from '@/components/admin/ItineraryEditor';

interface Props {
  itinerary: ItineraryDay[];
}

export default function ItinerarySection({ itinerary }: Props) {
  if (!itinerary?.length) return null;
  return (
    <section className="py-12 border-t border-border">
      <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2">Route &amp; Itinerary</h2>
      <p className="text-muted-foreground mb-6">Rincian harian perjalanan kamu — termasuk rute per hari.</p>
      <div className="space-y-4">
        {itinerary.map((day, i) => (
          <article key={i} className="rounded-xl border border-border bg-card overflow-hidden md:flex">
            {day.image_url && (
              <div className="md:w-1/3 aspect-video md:aspect-auto bg-muted">
                <img
                  src={day.image_url}
                  alt={day.image_alt || `Day ${day.day} - ${day.title}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-5 md:flex-1">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">Day {day.day}</span>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">
                Day {day.day} – {day.title}
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">{day.description}</p>

              {day.route && (day.route.start || day.route.end || day.route.distance_km || day.route.gmaps_url) && (
                <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-primary" /> Rute Hari Ini
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                    {(day.route.start || day.route.end) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{day.route.start || '—'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{day.route.end || '—'}</span>
                      </span>
                    )}
                    {!!day.route.distance_km && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Gauge className="h-3.5 w-3.5" /> {day.route.distance_km} km
                      </span>
                    )}
                    {day.route.gmaps_url && (
                      <a
                        href={day.route.gmaps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-xs font-medium"
                      >
                        <ExternalLink className="h-3 w-3" /> Buka di Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
