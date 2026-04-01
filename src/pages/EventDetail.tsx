import { useParams, Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Gauge, Clock, ArrowLeft, Share2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import { SAMPLE_EVENTS, EVENT_CATEGORIES, formatPrice, formatDate } from '@/data/events';
import eventPlaceholder from '@/assets/event-placeholder.jpg';

export default function EventDetail() {
  const { id } = useParams();
  const event = SAMPLE_EVENTS.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 container text-center py-20">
          <h1 className="font-heading font-bold text-2xl mb-4">Event Tidak Ditemukan</h1>
          <Button asChild><Link to="/events">Kembali ke Event</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const cat = EVENT_CATEGORIES[event.category];
  const spotsLeft = event.maxParticipants - event.currentParticipants;
  const fillPercent = (event.currentParticipants / event.maxParticipants) * 100;
  const waLink = `https://wa.me/6281234567890?text=${encodeURIComponent(`Halo, saya tertarik dengan event "${event.title}". Bisa info lebih lanjut?`)}`;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        {/* Hero image */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img src={event.image || eventPlaceholder} alt={event.title} className="w-full h-full object-cover" width={1920} height={600} />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute bottom-6 left-0 right-0 container">
            <Button variant="outline" size="sm" className="mb-4" style={{ borderColor: 'hsl(0 0% 80%)', color: 'hsl(0 0% 100%)', backgroundColor: 'hsla(0 0% 100% / 0.1)' }} asChild>
              <Link to="/events"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Link>
            </Button>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={event.status === 'upcoming' ? 'bg-accent text-accent-foreground' : event.status === 'ongoing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                    {event.status === 'upcoming' ? 'Akan Datang' : event.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
                  </Badge>
                  <Badge variant="secondary">{cat.icon} {cat.label}</Badge>
                  <Badge variant="outline" className="capitalize">{event.difficulty}</Badge>
                </div>
                <h1 className="font-heading font-bold text-2xl md:text-4xl mb-2">{event.title}</h1>
                <p className="text-muted-foreground">{event.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: CalendarDays, label: 'Tanggal', value: formatDate(event.date) },
                  { icon: MapPin, label: 'Lokasi', value: event.location },
                  { icon: Gauge, label: 'Jarak', value: event.distance },
                  { icon: Clock, label: 'Durasi', value: event.endDate ? `${Math.ceil((new Date(event.endDate).getTime() - new Date(event.date).getTime()) / 86400000)} hari` : '1 hari' },
                ].map((info) => (
                  <div key={info.label} className="p-4 rounded-xl bg-card shadow-card border border-border">
                    <info.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="font-medium text-sm">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Highlights */}
              <div>
                <h2 className="font-heading font-semibold text-xl mb-3">Highlight Event</h2>
                <div className="grid grid-cols-2 gap-2">
                  {event.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                      <span className="text-primary">✓</span> {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-card shadow-card border border-border space-y-4 sticky top-24">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Biaya Pendaftaran</p>
                  <p className="font-heading font-bold text-3xl text-primary">{formatPrice(event.price)}</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Kuota</span>
                    <span className="font-medium">{event.currentParticipants}/{event.maxParticipants}</span>
                  </div>
                  <Progress value={fillPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{spotsLeft > 0 ? `${spotsLeft} slot tersisa` : 'Kuota penuh'}</p>
                </div>

                <EventRegistrationForm event={event} />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                    <a href={waLink} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
                    <Share2 className="h-4 w-4" /> Bagikan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
