import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTripJournal, useTripJournalImages, useTripJournalParticipants } from '@/hooks/useTripJournals';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RichTextContent from '@/components/RichTextContent';
import UserAvatar from '@/components/UserAvatar';
import UserBadge from '@/components/UserBadge';
import { Loader2, CalendarDays, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function ImageGallery({ images }: { images: any[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {images.map((img, i) => (
          <button key={img.id} onClick={() => setSelected(i)} className="aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity">
            <img src={img.image_url} alt={img.caption || `Photo ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
          {selected !== null && images[selected] && (
            <div className="relative">
              <img src={images[selected].image_url} alt={images[selected].caption || ''} className="w-full max-h-[80vh] object-contain" />
              {images[selected].caption && (
                <p className="p-4 text-sm text-center text-muted-foreground">{images[selected].caption}</p>
              )}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <button onClick={() => setSelected(Math.max(0, selected - 1))} disabled={selected === 0} className="bg-background/80 backdrop-blur rounded-full px-3 py-1 text-sm disabled:opacity-30">← Prev</button>
                <span className="bg-background/80 backdrop-blur rounded-full px-3 py-1 text-sm">{selected + 1}/{images.length}</span>
                <button onClick={() => setSelected(Math.min(images.length - 1, selected + 1))} disabled={selected === images.length - 1} className="bg-background/80 backdrop-blur rounded-full px-3 py-1 text-sm disabled:opacity-30">Next →</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TripJournalDetail() {
  const { slug } = useParams();
  const { data: journal, isLoading } = useTripJournal(slug || '');
  const { data: images } = useTripJournalImages(journal?.id || '');
  const { data: participants } = useTripJournalParticipants(journal?.id || '');

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
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-8">{journal.title}</h1>

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
