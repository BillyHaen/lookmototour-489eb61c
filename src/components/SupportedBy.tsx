import { Link } from 'react-router-dom';
import { useActiveSponsors } from '@/hooks/useSponsors';
import { trackSponsorEvent } from '@/hooks/useSponsorTracking';
import { Handshake } from 'lucide-react';

export default function SupportedBy() {
  const { data: sponsors } = useActiveSponsors();
  if (!sponsors?.length) return null;

  return (
    <section className="py-16 bg-zinc-950 text-white">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-medium mb-3">
            <Handshake className="h-3.5 w-3.5" style={{ color: 'hsl(24 95% 53%)' }} />
            <span className="text-white/70">SUPPORTED BY</span>
          </div>
          <h2 className="font-heading font-bold text-2xl md:text-3xl">Didukung Brand Terpercaya</h2>
        </div>

        <div className="flex md:grid md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {sponsors.map((s) => (
            <Link
              key={s.id}
              to={`/sponsor/${s.slug}`}
              onClick={() => trackSponsorEvent(s.id, 'click')}
              className="group shrink-0 snap-center w-32 md:w-auto aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-4 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
              title={s.name}
            >
              {s.logo_url ? (
                <img
                  src={s.logo_url}
                  alt={s.name}
                  className="max-h-16 max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  loading="lazy"
                />
              ) : (
                <span className="text-white/70 text-sm font-semibold">{s.name}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
