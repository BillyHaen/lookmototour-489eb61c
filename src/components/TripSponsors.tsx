import { Link } from 'react-router-dom';
import { useTripSponsors } from '@/hooks/useSponsors';
import { trackSponsorEvent, useImpressionTracker } from '@/hooks/useSponsorTracking';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function SponsorRow({ sponsor, eventId }: { sponsor: any; eventId: string }) {
  const ref = useImpressionTracker(sponsor.id, eventId);
  const { data: benefits } = useQuery({
    queryKey: ['sponsor-benefits-trip', sponsor.id, eventId],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_benefits' as any) as any)
        .select('id, title, type')
        .eq('sponsor_id', sponsor.id)
        .eq('is_active', true);
      return (data || []).filter((b: any) =>
        !b.applicable_trips?.length || b.applicable_trips.includes(eventId)
      );
    },
  });

  return (
    <Card ref={ref as any} className="hover:-translate-y-1 hover:shadow-elevated transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Link
            to={`/sponsor/${sponsor.slug}`}
            onClick={() => trackSponsorEvent(sponsor.id, 'click', eventId)}
            className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden"
          >
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.name} className="max-h-14 max-w-14 object-contain" loading="lazy" />
            ) : (
              <span className="font-bold">{sponsor.name[0]}</span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-heading font-semibold">{sponsor.name}</h4>
              <Link
                to={`/sponsor/${sponsor.slug}`}
                onClick={() => trackSponsorEvent(sponsor.id, 'click', eventId)}
                className="text-xs text-primary hover:underline shrink-0 inline-flex items-center gap-1"
              >
                Detail <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            {sponsor.tagline && <p className="text-sm text-muted-foreground mb-2">{sponsor.tagline}</p>}
            {benefits && benefits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {benefits.slice(0, 3).map((b: any) => (
                  <Badge key={b.id} variant="secondary" className="text-xs" style={{ backgroundColor: 'hsl(24 95% 53% / 0.15)', color: 'hsl(24 95% 40%)' }}>
                    🎁 {b.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TripSponsors({ eventId }: { eventId: string }) {
  const { data: sponsors } = useTripSponsors(eventId);
  if (!sponsors?.length) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <Handshake className="h-5 w-5" style={{ color: 'hsl(24 95% 53%)' }} />
          Trip Sponsors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sponsors.map((s: any) => <SponsorRow key={s.id} sponsor={s} eventId={eventId} />)}
        </div>
      </CardContent>
    </Card>
  );
}
