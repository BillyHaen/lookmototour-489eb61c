import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RichTextContent from '@/components/RichTextContent';
import SponsorBenefitCard from '@/components/SponsorBenefitCard';
import { useSponsorBySlug, useSponsorBenefits, useSponsorMedia } from '@/hooks/useSponsors';
import { trackSponsorEvent } from '@/hooks/useSponsorTracking';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, ArrowLeft, Handshake } from 'lucide-react';

export default function SponsorDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: sponsor, isLoading } = useSponsorBySlug(slug);
  const { data: benefits } = useSponsorBenefits(sponsor?.id);
  const { data: media } = useSponsorMedia(sponsor?.id);

  useEffect(() => {
    if (sponsor?.id) trackSponsorEvent(sponsor.id, 'impression');
  }, [sponsor?.id]);

  useSeoMeta({
    title: sponsor ? `${sponsor.name} - Sponsor LookMotoTour` : 'Sponsor',
    description: sponsor?.tagline || sponsor?.description?.replace(/<[^>]*>/g, '').slice(0, 160),
    image: sponsor?.logo_url,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen"><Navbar /><div className="pt-24 flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div><Footer /></div>
    );
  }
  if (!sponsor) {
    return (
      <div className="min-h-screen"><Navbar /><div className="pt-24 container text-center py-20">
        <h1 className="font-heading font-bold text-2xl mb-4">Sponsor tidak ditemukan</h1>
        <Button onClick={() => navigate('/')}>Kembali</Button>
      </div><Footer /></div>
    );
  }

  const handleVisit = () => {
    if (!sponsor.website_url) return;
    trackSponsorEvent(sponsor.id, 'click', undefined, { source: 'cta_visit' });
    window.open(sponsor.website_url, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero — dark */}
      <section className="pt-20 bg-zinc-950 text-white">
        <div className="container py-12 md:py-16">
          <Button variant="ghost" size="sm" className="mb-6 text-white/70 hover:text-white hover:bg-white/10" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Link>
          </Button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1 flex justify-center">
              <div className="h-40 w-40 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-6">
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                ) : <Handshake className="h-16 w-16 text-white/40" />}
              </div>
            </div>
            <div className="md:col-span-2 text-center md:text-left">
              <Badge className="mb-3" style={{ backgroundColor: 'hsl(24 95% 53%)', color: 'white' }}>{sponsor.category}</Badge>
              <h1 className="font-heading font-bold text-3xl md:text-5xl mb-3">{sponsor.name}</h1>
              {sponsor.tagline && <p className="text-lg text-white/70 mb-6">{sponsor.tagline}</p>}
              {sponsor.website_url && (
                <Button size="lg" onClick={handleVisit} className="gap-2" style={{ backgroundColor: 'hsl(24 95% 53%)', color: 'white' }}>
                  Kunjungi Website <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12 space-y-12">
        {/* About */}
        {sponsor.description && (
          <section>
            <h2 className="font-heading font-bold text-2xl mb-4">Tentang Brand</h2>
            <RichTextContent content={sponsor.description} className="text-muted-foreground" />
          </section>
        )}

        {/* Benefits */}
        {benefits && benefits.length > 0 && (
          <section>
            <h2 className="font-heading font-bold text-2xl mb-4">Penawaran Spesial</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b: any) => <SponsorBenefitCard key={b.id} benefit={b} />)}
            </div>
          </section>
        )}

        {/* Media */}
        {media && media.length > 0 && (
          <section>
            <h2 className="font-heading font-bold text-2xl mb-4">Galeri & Kampanye</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {media.map((m: any) => (
                <div key={m.id} className="rounded-xl overflow-hidden border bg-card">
                  {m.type === 'video' ? (
                    <video src={m.url} controls className="w-full aspect-video object-cover" />
                  ) : (
                    <img src={m.url} alt={m.title} className="w-full aspect-video object-cover" loading="lazy" />
                  )}
                  {m.title && <div className="p-3 text-sm">{m.title}</div>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile CTA */}
      {sponsor.website_url && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-background border-t border-border">
          <Button onClick={handleVisit} className="w-full gap-2" style={{ backgroundColor: 'hsl(24 95% 53%)', color: 'white' }}>
            Kunjungi Website <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
}
