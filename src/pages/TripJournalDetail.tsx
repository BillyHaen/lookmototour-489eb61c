import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTripJournal, useTripJournalImages, useTripJournalParticipants } from '@/hooks/useTripJournals';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RichTextContent from '@/components/RichTextContent';
import UserAvatar from '@/components/UserAvatar';
import UserBadge from '@/components/UserBadge';
import { Loader2, CalendarDays, Users } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';

function ImageGallery({ images }: { images: any[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [lbApi, setLbApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api]);

  useEffect(() => {
    if (lightbox === null || !lbApi) return;
    lbApi.scrollTo(lightbox, true);
  }, [lbApi, lightbox]);

  if (images.length === 0) return null;

  return (
    <section className="mb-8">
      <Carousel setApi={setApi} opts={{ loop: images.length > 1 }} className="relative">
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={img.id}>
              <button
                type="button"
                onClick={() => setLightbox(i)}
                className="block w-full aspect-[16/10] rounded-xl overflow-hidden bg-muted"
              >
                <img
                  src={img.image_url}
                  alt={img.caption || `Foto ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
              {img.caption && (
                <p className="mt-2 text-sm text-muted-foreground text-center px-2">{img.caption}</p>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2 hidden sm:flex" />
            <CarouselNext className="right-2 hidden sm:flex" />
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full px-2.5 py-0.5 text-xs font-medium">
              {current + 1}/{images.length}
            </div>
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => api?.scrollTo(i)}
              className={`flex-shrink-0 snap-start w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 transition-all ${
                current === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightbox !== null} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background border-none">
          {lightbox !== null && (
            <Carousel setApi={setLbApi} opts={{ loop: images.length > 1, startIndex: lightbox }}>
              <CarouselContent>
                {images.map((img, i) => (
                  <CarouselItem key={img.id}>
                    <div className="flex flex-col items-center justify-center bg-black">
                      <img
                        src={img.image_url}
                        alt={img.caption || `Foto ${i + 1}`}
                        className="w-full max-h-[80vh] object-contain"
                      />
                      {img.caption && (
                        <p className="p-3 text-sm text-center text-muted-foreground bg-background w-full">{img.caption}</p>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-3" />
                  <CarouselNext className="right-3" />
                </>
              )}
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function TripJournalDetail() {
  const { slug } = useParams();
  const { data: journal, isLoading } = useTripJournal(slug || '');
  const { data: images } = useTripJournalImages(journal?.id || '');
  const { data: participants } = useTripJournalParticipants(journal?.id || '');

  useSeoMeta({
    title: journal ? `${journal.title} - Jurnal Trip` : 'Jurnal Trip',
    description: journal?.content?.replace(/<[^>]*>/g, '').slice(0, 160),
    url: window.location.href,
  });
  if (isLoading) return (
    <div className="min-h-screen"><Navbar /><div className="flex justify-center items-center pt-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
  );

  if (!journal) return (
    <div className="min-h-screen"><Navbar /><div className="pt-32 text-center"><h1 className="text-2xl font-bold">Jurnal tidak ditemukan</h1></div><Footer /></div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <CalendarDays className="h-4 w-4" />
            {journal.published_at ? format(new Date(journal.published_at), 'dd MMMM yyyy') : format(new Date(journal.created_at), 'dd MMMM yyyy')}
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">{journal.title}</h1>
          <div className="mb-8">
            <ShareButton
              contentType="trip_journal"
              contentId={journal.id}
              title={journal.title}
              description={journal.content?.replace(/<[^>]*>/g, '').slice(0, 160)}
              slug={journal.slug || journal.id}
            />
          </div>

          {/* Image Gallery */}
          <ImageGallery images={images || []} />

          {/* Content */}
          <RichTextContent content={journal.content} className="mb-12" />

          {/* Participants */}
          {(participants || []).length > 0 && (
            <section className="border-t border-border pt-8">
              <h2 className="font-heading font-semibold text-xl mb-6 flex items-center gap-2">
                <Users className="h-5 w-5" /> Peserta Trip ({participants!.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {participants!.map((p: any) => (
                  <Link key={p.user_id} to={`/member/${p.user_id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                    <UserAvatar src={p.avatar_url} name={p.name} className="h-10 w-10" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <UserBadge eventCount={p.event_count} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
