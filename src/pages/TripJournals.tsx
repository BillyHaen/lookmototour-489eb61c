import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTripJournals } from '@/hooks/useTripJournals';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { Loader2, CalendarDays, Images } from 'lucide-react';
import { format } from 'date-fns';

export default function TripJournals() {
  const { data: journals, isLoading } = useTripJournals();

  useSeoMeta({
    title: 'Jurnal Trip - Dokumentasi Perjalanan | LookMotoTour',
    description: 'Baca dokumentasi dan cerita seru dari setiap perjalanan touring motor LookMotoTour.',
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container">
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">Jurnal Trip</h1>
          <p className="text-muted-foreground mb-10">Dokumentasi dan cerita dari setiap perjalanan kami.</p>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(journals || []).map((journal: any) => (
                <Link key={journal.id} to={`/jurnal/${journal.slug || journal.id}`} className="group">
                  <div className="rounded-xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      {journal.cover_image ? (
                        <img src={journal.cover_image} alt={journal.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Images className="h-12 w-12 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarDays className="h-3 w-3" />
                        {journal.published_at ? format(new Date(journal.published_at), 'dd MMM yyyy') : format(new Date(journal.created_at), 'dd MMM yyyy')}
                      </div>
                      <h2 className="font-heading font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2">{journal.title}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">{journal.content.replace(/<[^>]*>/g, '').slice(0, 120)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!isLoading && (journals || []).length === 0 && (
            <p className="text-center text-muted-foreground py-12">Belum ada jurnal trip.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
