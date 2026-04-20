import type { ItineraryDay } from '@/components/admin/ItineraryEditor';

interface Props {
  itinerary: ItineraryDay[];
}

export default function ItinerarySection({ itinerary }: Props) {
  if (!itinerary?.length) return null;
  return (
    <section className="py-12 border-t border-border">
      <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2">Route &amp; Itinerary</h2>
      <p className="text-muted-foreground mb-6">Rincian harian perjalanan kamu.</p>
      <div className="space-y-4">
        {itinerary.map((day, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden md:flex">
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
              <h3 className="font-heading font-semibold text-lg mb-1">{day.title}</h3>
              <p className="text-muted-foreground whitespace-pre-line">{day.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
