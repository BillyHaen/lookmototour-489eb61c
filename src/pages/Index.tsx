import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Map, Users, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import EventCard from '@/components/EventCard';
import TestimonialSection from '@/components/TestimonialSection';
import { useEvents } from '@/hooks/useEvents';
import { Loader2 } from 'lucide-react';

const FEATURES = [
  { icon: Map, title: 'Rute Terbaik', desc: 'Rute touring yang sudah disurvey dan aman untuk semua level rider.' },
  { icon: Shield, title: 'Keamanan', desc: 'Tim support, P3K, dan asuransi perjalanan di setiap event.' },
  { icon: Users, title: 'Komunitas', desc: 'Bergabung dengan ratusan rider dari seluruh Indonesia.' },
  { icon: Star, title: 'Pengalaman', desc: 'Dokumentasi profesional dan merchandise eksklusif.' },
];

export default function Index() {
  const { data: events, isLoading } = useEvents();
  const upcomingEvents = (events || []).filter((e) => e.status === 'upcoming').slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-3">Kenapa LookMotoTour?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Kami menyediakan pengalaman touring motor terbaik dengan standar keamanan tinggi.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-xl bg-card shadow-card border border-border text-center group hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-2">Event Mendatang</h2>
              <p className="text-muted-foreground">Jangan sampai ketinggalan event seru kami!</p>
            </div>
            <Button variant="outline" className="hidden sm:flex gap-2" asChild>
              <Link to="/events">Lihat Semua <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
          <div className="sm:hidden mt-6 text-center">
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/events">Lihat Semua Event <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialSection />

      {/* CTA */}
      <section className="py-20 bg-gradient-dark text-center">
        <div className="container max-w-2xl">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4" style={{ color: 'hsl(0 0% 100%)' }}>
            Siap Untuk Petualangan?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'hsl(0 0% 75%)' }}>
            Daftar sekarang dan jadilah bagian dari komunitas touring motor terbesar di Indonesia.
          </p>
          <Button size="lg" className="text-base font-semibold gap-2" asChild>
            <Link to="/events">
              Mulai Sekarang <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
