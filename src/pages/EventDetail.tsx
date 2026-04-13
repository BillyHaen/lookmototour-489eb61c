import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Users, Gauge, Clock, ArrowLeft, Share2, MessageCircle, Loader2, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import { EVENT_CATEGORIES, formatPrice, formatDate, EventCategory } from '@/data/events';
import { useEvent } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import eventPlaceholder from '@/assets/event-placeholder.jpg';

export default function EventDetail() {
  const { id } = useParams();
  const { data: event, isLoading } = useEvent(id);

  const { data: itineraries } = useQuery({
    queryKey: ['event-itineraries', id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('event_itineraries' as any) as any)
        .select('*').eq('event_id', id!).order('day_number');
      if (error) return [];
      return data as any[];
    },
    enabled: !!id,
  });

  const { data: footerSettings } = useQuery({
    queryKey: ['site-settings', 'footer'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'footer').single();
      if (error) return null;
      return data.value as any;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

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

  const cat = EVENT_CATEGORIES[event.category as EventCategory] || EVENT_CATEGORIES.touring;
  const forceFull = (event as any).force_full || false;
  const spotsLeft = forceFull ? 0 : event.max_participants - event.current_participants;
  const fillPercent = forceFull ? 100 : (event.current_participants / event.max_participants) * 100;
  const waNumber = footerSettings?.whatsapp_number || '6281234567890';
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo, saya tertarik dengan event "${event.title}". Bisa info lebih lanjut?`)}`;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img src={event.image_url || eventPlaceholder} alt={event.title} className="w-full h-full object-cover" width={1920} height={600} />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute bottom-6 left-0 right-0 container">
            <Button variant="outline" size="sm" className="mb-4" style={{ borderColor: 'hsl(0 0% 80%)', color: 'hsl(0 0% 100%)', backgroundColor: 'hsla(0 0% 100% / 0.1)' }} asChild>
              <Link to="/events"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Link>
            </Button>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  { icon: Gauge, label: 'Jarak', value: event.distance || '-' },
                  { icon: Clock, label: 'Durasi', value: event.end_date ? `${Math.ceil((new Date(event.end_date).getTime() - new Date(event.date).getTime()) / 86400000)} hari` : '1 hari' },
                ].map((info) => (
                  <div key={info.label} className="p-4 rounded-xl bg-card shadow-card border border-border">
                    <info.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="font-medium text-sm">{info.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="font-heading font-semibold text-xl mb-3">Highlight Event</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(event.highlights || []).map((h) => (
                    <div key={h} className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                      <span className="text-primary">✓</span> {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Persyaratan */}
              {(event as any).requirements && (event as any).requirements.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-xl mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-accent" /> Persyaratan
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {((event as any).requirements as string[]).map((r) => (
                      <div key={r} className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                        <span className="text-accent">•</span> {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Include */}
              {(event as any).includes && (event as any).includes.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-xl mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Include
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {((event as any).includes as string[]).map((item) => (
                      <div key={item} className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                        <span className="text-primary">✓</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exclude */}
              {(event as any).excludes && (event as any).excludes.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-xl mb-3 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" /> Exclude
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {((event as any).excludes as string[]).map((item) => (
                      <div key={item} className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                        <span className="text-destructive">✗</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Asuransi */}
              {(event as any).insurance_enabled && (
                <Card className="border-primary/20">
                  <CardContent className="flex items-start gap-3 pt-6">
                    <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-heading font-semibold">Asuransi Tersedia</p>
                      <p className="text-sm text-muted-foreground">{(event as any).insurance_description || 'Event ini menyediakan asuransi untuk peserta.'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Itinerary */}
              {itineraries && itineraries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" /> Itinerary Perjalanan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {itineraries.map((it: any) => (
                        <div key={it.id} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-l-0">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-heading font-semibold">Hari {it.day_number}</span>
                              {it.date && <Badge variant="outline" className="text-xs">{formatDate(it.date)}</Badge>}
                            </div>
                            <p className="font-medium">{it.title}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{it.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-card shadow-card border border-border space-y-4 sticky top-24">
              <div>
                  <p className="text-sm text-muted-foreground text-center mb-3">Biaya Pendaftaran</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {(event as any).price_sharing > 0 && (
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Sharing</p>
                        <p className="font-heading font-bold text-sm text-primary">{formatPrice((event as any).price_sharing)}</p>
                      </div>
                    )}
                    {((event as any).price_single > 0 || event.price > 0) && (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Single</p>
                        <p className="font-heading font-bold text-sm text-primary">{formatPrice((event as any).price_single || event.price)}</p>
                      </div>
                    )}
                    {(event as any).price_couple > 0 && (
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Couple</p>
                        <p className="font-heading font-bold text-sm text-primary">{formatPrice((event as any).price_couple)}</p>
                      </div>
                    )}
                  </div>
                  {(event as any).price_sharing === 0 && (event as any).price_couple === 0 && (event as any).price_single === 0 && event.price === 0 && (
                    <p className="font-heading font-bold text-3xl text-primary text-center">GRATIS</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Kuota</span>
                    <span className="font-medium">{event.current_participants}/{event.max_participants}</span>
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
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: event.title, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: 'Link disalin! 📋', description: 'Link event berhasil disalin ke clipboard.' });
                    }
                  }}>
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
