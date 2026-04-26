import { Link } from 'react-router-dom';
import { useSponsorRecommendations } from '@/hooks/useSponsorRecommendations';
import { trackSponsorEvent } from '@/hooks/useSponsorTracking';
import { Sparkles } from 'lucide-react';

export default function PersonalizedSponsorStrip() {
  const { data: recs } = useSponsorRecommendations({ limit: 8, fast: true });
  if (!recs?.length) return null;

  return (
    <section className="py-12 bg-zinc-950 text-white">
      <div className="container">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-4 w-4" style={{ color: 'hsl(24 95% 53%)' }} />
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Picked for you</span>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
          {recs.map((r) => (
            <Link
              key={r.sponsor.id}
              to={`/sponsor/${r.sponsor.slug}`}
              onClick={() => trackSponsorEvent(r.sponsor.id, 'click')}
              className="group shrink-0 snap-start w-40 rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all"
            >
              <div className="h-16 flex items-center justify-center mb-2">
                {r.sponsor.logo_url ? (
                  <img src={r.sponsor.logo_url} alt={r.sponsor.name} className="max-h-14 max-w-full object-contain group-hover:scale-110 transition-transform" loading="lazy" />
                ) : (
                  <span className="text-white/70 font-semibold">{r.sponsor.name}</span>
                )}
              </div>
              <p className="text-xs font-medium text-center truncate">{r.sponsor.name}</p>
              {r.sponsor.tagline && <p className="text-[10px] text-white/50 text-center line-clamp-1 mt-0.5">{r.sponsor.tagline}</p>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
