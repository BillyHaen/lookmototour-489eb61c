import { Link } from 'react-router-dom';
import { useSponsorRecommendations, RecommendationContext } from '@/hooks/useSponsorRecommendations';
import { trackSponsorEvent, useImpressionTracker } from '@/hooks/useSponsorTracking';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Sparkles, ArrowRight } from 'lucide-react';

function RecCard({ rec, eventId }: { rec: any; eventId?: string }) {
  const ref = useImpressionTracker(rec.sponsor.id, eventId);
  return (
    <Card ref={ref as any} className="hover:-translate-y-1 hover:shadow-elevated transition-all group h-full">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Link
            to={`/sponsor/${rec.sponsor.slug}`}
            onClick={() => trackSponsorEvent(rec.sponsor.id, 'click', eventId)}
            className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden"
          >
            {rec.sponsor.logo_url ? (
              <img src={rec.sponsor.logo_url} alt={rec.sponsor.name} className="max-h-12 max-w-12 object-contain" loading="lazy" />
            ) : (
              <span className="font-bold">{rec.sponsor.name[0]}</span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="secondary" className="text-[10px] gap-1 px-1.5" style={{ backgroundColor: 'hsl(24 95% 53% / 0.15)', color: 'hsl(24 95% 40%)' }}>
                <Sparkles className="h-3 w-3" /> Recommended
              </Badge>
            </div>
            <h4 className="font-heading font-semibold text-sm truncate">{rec.sponsor.name}</h4>
            {rec.sponsor.tagline && <p className="text-xs text-muted-foreground line-clamp-2">{rec.sponsor.tagline}</p>}
          </div>
        </div>
        <Link
          to={`/sponsor/${rec.sponsor.slug}`}
          onClick={() => trackSponsorEvent(rec.sponsor.id, 'click', eventId)}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Lihat penawaran <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function RecommendedSponsors({
  context,
  limit = 5,
  title = 'Recommended For You',
}: {
  context?: RecommendationContext;
  limit?: number;
  title?: string;
}) {
  const { data: recs, isLoading } = useSponsorRecommendations({ context, limit });
  if (isLoading || !recs?.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: 'hsl(24 95% 53%)' }} />
        <h3 className="font-heading font-semibold text-lg">{title}</h3>
      </div>

      {/* Mobile: swipeable carousel */}
      <div className="md:hidden">
        <Carousel opts={{ align: 'start', dragFree: true }}>
          <CarouselContent>
            {recs.map((r) => (
              <CarouselItem key={r.sponsor.id} className="basis-[80%]">
                <RecCard rec={r} eventId={context?.event_id} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recs.slice(0, limit).map((r) => (
          <RecCard key={r.sponsor.id} rec={r} eventId={context?.event_id} />
        ))}
      </div>
    </section>
  );
}
