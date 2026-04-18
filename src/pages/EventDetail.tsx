import { useParams, Link } from 'react-router-dom';
import RichTextContent from '@/components/RichTextContent';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Users, Gauge, Clock, ArrowLeft, MessageCircle, Loader2, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Truck, Shield } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import EventRecommendations from '@/components/EventRecommendations';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import InterestedUsers from '@/components/InterestedUsers';
import RoutePreview from '@/components/RoutePreview';
import { EVENT_CATEGORIES, formatPrice, formatDate, formatTentativeMonth, EventCategory, RIDER_LEVELS, MOTOR_TYPES, TOURING_STYLES, FATIGUE_LABELS, RiderLevel, MotorType, TouringStyle, calculateSafetyScore, SAFETY_LEVEL_LABELS, ROAD_CONDITION_LABELS } from '@/data/events';
import { useEvent } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsConfirmedParticipant } from '@/hooks/useTrackingSession';
import eventPlaceholder from '@/assets/event-placeholder.jpg';

export default function EventDetail() {
  const { id: slug } = useParams();
  const { data: event, isLoading } = useEvent(slug);
  const { user } = useAuth();
  const { data: isConfirmedParticipant } = useIsConfirmedParticipant(event?.id);

  const { data: itineraries } = useQuery({
    queryKey: ['event-itineraries', event?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from('event_itineraries' as any) as any)
        .select('*').eq('event_id', event!.id).order('day_number');
      if (error) return [];
      return data as any[];
    },
    enabled: !!event?.id,
  });

  const { data: interestCount } = useQuery({
    queryKey: ['event-interest-count', event?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_event_interest_counts');
      if (error) return 0;
      const found = (data as any[])?.find((r: any) => r.event_id === event!.id);
      return found ? Number(found.interest_count) : 0;
    },
    enabled: !!event?.id && !!(event as any)?.tentative_month,
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

  useSeoMeta({
    title: event ? `${event.title} - Event` : 'Event',
    description: event?.description?.replace(/<[^>]*>/g, '').slice(0, 160),
    image: event?.image_url,
    url: window.location.href,
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
  const isTentative = !!(event as any).tentative_month;
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
                  {(event as any).rider_level && (event as any).rider_level !== 'all' && (
                    <Badge variant="outline">{RIDER_LEVELS[(event as any).rider_level as RiderLevel]?.icon} {RIDER_LEVELS[(event as any).rider_level as RiderLevel]?.label}</Badge>
                  )}
                  {(event as any).touring_style && (
                    <Badge variant="outline">{TOURING_STYLES[(event as any).touring_style as TouringStyle]?.icon} {TOURING_STYLES[(event as any).touring_style as TouringStyle]?.label}</Badge>
                  )}
                </div>
                <h1 className="font-heading font-bold text-2xl md:text-4xl mb-2">{event.title}</h1>
                <RichTextContent content={event.description} className="text-muted-foreground" />
              </div>

              <div className={`grid grid-cols-2 ${isTentative ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
                {[
                  { icon: CalendarDays, label: 'Tanggal', value: isTentative ? `${formatTentativeMonth((event as any).tentative_month)} (Tentative)` : formatDate(event.date) },
                  { icon: MapPin, label: 'Lokasi', value: event.location },
                  { icon: Gauge, label: 'Jarak', value: event.distance || '-' },
                  ...(!isTentative ? [{ icon: Clock, label: 'Durasi', value: event.end_date ? `${Math.ceil((new Date(event.end_date).getTime() - new Date(event.date).getTime()) / 86400000)} hari` : '1 hari' }] : []),
                ].map((info) => (
                  <div key={info.label} className="p-4 rounded-xl bg-card shadow-card border border-border">
                    <info.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="font-medium text-sm">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Smart Touring Info */}
              {((event as any).riding_hours_per_day > 0 || (event as any).fatigue_level > 1 || ((event as any).motor_types || []).length > 0) && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-heading font-semibold text-lg">🔎 Info Touring</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(event as any).riding_hours_per_day > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Jam Riding / Hari</p>
                          <p className="font-medium flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {(event as any).riding_hours_per_day} jam</p>
                        </div>
                      )}
                      {(event as any).fatigue_level > 1 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Tingkat Capek</p>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${((event as any).fatigue_level / 5) * 100}%`,
                                  backgroundColor: (event as any).fatigue_level <= 2 ? 'hsl(var(--primary))' : (event as any).fatigue_level <= 3 ? 'hsl(40 100% 50%)' : 'hsl(var(--destructive))',
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">{FATIGUE_LABELS[(event as any).fatigue_level]}</span>
                          </div>
                        </div>
                      )}
                      {(event as any).rider_level && (event as any).rider_level !== 'all' && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Level Rider</p>
                          <p className="font-medium">{RIDER_LEVELS[(event as any).rider_level as RiderLevel]?.icon} {RIDER_LEVELS[(event as any).rider_level as RiderLevel]?.label}</p>
                        </div>
                      )}
                    </div>
                    {((event as any).motor_types || []).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Tipe Motor yang Cocok</p>
                        <div className="flex flex-wrap gap-2">
                          {((event as any).motor_types as string[]).map((mt) => (
                            <Badge key={mt} variant="secondary">{MOTOR_TYPES[mt as MotorType]?.icon} {MOTOR_TYPES[mt as MotorType]?.label}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 🛡️ Safety Score Panel */}
              {(() => {
                const safety = calculateSafetyScore({
                  road_condition: (event as any).road_condition,
                  difficulty: event.difficulty,
                  fatigue_level: (event as any).fatigue_level,
                  distance: event.distance,
                });
                const levelInfo = SAFETY_LEVEL_LABELS[safety.level];
                const breakdownItems = [
                  { label: 'Kondisi Jalan', value: safety.breakdown.roadCondition, max: 5, detail: ROAD_CONDITION_LABELS[safety.breakdown.roadCondition] },
                  { label: 'Medan', value: safety.breakdown.difficulty, max: 3, detail: event.difficulty.charAt(0).toUpperCase() + event.difficulty.slice(1) },
                  { label: 'Tingkat Capek', value: safety.breakdown.fatigue, max: 5, detail: FATIGUE_LABELS[safety.breakdown.fatigue] },
                  { label: 'Jarak Tempuh', value: safety.breakdown.distance, max: 3, detail: event.distance || '-' },
                ];
                return (
                  <Card className="border-2" style={{ borderColor: safety.color + '40' }}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5" style={{ color: safety.color }} /> Safety Score
                        </h3>
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm"
                          style={{ backgroundColor: safety.color, color: '#fff' }}
                        >
                          <Shield className="h-4 w-4" />
                          {safety.score} / 10
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(safety.score / 10) * 100}%`, backgroundColor: safety.color }}
                          />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: safety.color }}>
                          {levelInfo.icon} {levelInfo.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {breakdownItems.map((item) => (
                          <div key={item.label} className="p-3 rounded-lg bg-muted">
                            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(item.value / item.max) * 100}%`,
                                    backgroundColor: item.value / item.max > 0.66 ? 'hsl(0 84% 60%)' : item.value / item.max > 0.33 ? 'hsl(40 100% 50%)' : 'hsl(142 71% 45%)',
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium whitespace-nowrap">{item.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {safety.tips.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border">
                          {safety.tips.slice(0, 3).map((tip, i) => (
                            <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span>💡</span> {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

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
                      <RichTextContent content={(event as any).insurance_description || 'Event ini menyediakan asuransi untuk peserta.'} className="text-sm text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Towing Motor */}
              {(event as any).towing_enabled && (
                <Card className="border-accent/20">
                  <CardContent className="flex items-start gap-3 pt-6">
                    <Truck className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-heading font-semibold">Towing Motor Tersedia</p>
                      <RichTextContent content={(event as any).towing_description || 'Event ini menyediakan layanan towing motor untuk peserta.'} className="text-sm text-muted-foreground" />
                      <div className="flex gap-4 mt-2">
                        {(event as any).towing_pergi_price > 0 && (
                          <span className="text-sm font-medium">Pergi: <span className="text-primary">{formatPrice((event as any).towing_pergi_price)}</span></span>
                        )}
                        {(event as any).towing_pulang_price > 0 && (
                          <span className="text-sm font-medium">Pulang: <span className="text-primary">{formatPrice((event as any).towing_pulang_price)}</span></span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 🗺️ Route Preview */}
              {user ? (
                <RoutePreview routeData={(event as any).route_data} />
              ) : (
                (event as any).route_data && (
                  <Card className="border-2 border-destructive/40 bg-destructive/5">
                    <CardContent className="pt-6">
                      <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-3">
                        <MapPin className="h-5 w-5 text-destructive" /> Rute Touring
                      </h3>
                      <div className="rounded-lg bg-destructive text-destructive-foreground p-6 text-center space-y-3">
                        <Lock className="h-8 w-8 mx-auto" />
                        <p className="font-semibold">Login/Daftar untuk melihat</p>
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="secondary" asChild>
                            <Link to="/login">Login</Link>
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent text-destructive-foreground border-destructive-foreground/40 hover:bg-destructive-foreground/10 hover:text-destructive-foreground" asChild>
                            <Link to="/register">Daftar</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              {/* Itinerary */}
              {itineraries && itineraries.length > 0 && (
                user ? (
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
                              <RichTextContent content={it.description} className="text-sm text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-destructive/40 bg-destructive/5">
                    <CardContent className="pt-6">
                      <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-3">
                        <CalendarDays className="h-5 w-5 text-destructive" /> Itinerary Perjalanan
                      </h3>
                      <div className="rounded-lg bg-destructive text-destructive-foreground p-6 text-center space-y-3">
                        <Lock className="h-8 w-8 mx-auto" />
                        <p className="font-semibold">Login/Daftar untuk melihat</p>
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="secondary" asChild>
                            <Link to="/login">Login</Link>
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent text-destructive-foreground border-destructive-foreground/40 hover:bg-destructive-foreground/10 hover:text-destructive-foreground" asChild>
                            <Link to="/register">Daftar</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-card shadow-card border border-border space-y-4 sticky top-24">
                {isTentative ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">Biaya perjalanan akan diupdate!</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}

                {isTentative && <InterestedUsers eventId={event.id} interestCount={interestCount || 0} />}

                <EventRegistrationForm event={event} />

                {/* Live Tracking CTA — peserta confirmed, window aktif */}
                {(() => {
                  if (!isConfirmedParticipant) return null;
                  const now = new Date();
                  const start = new Date(event.date);
                  const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
                  // Window: 1 hari sebelum start sampai end_date + 1 hari
                  const windowStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
                  const windowEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
                  if (now < windowStart || now > windowEnd) return null;
                  return (
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-5 w-5 text-primary" />
                        <p className="font-heading font-semibold text-sm">Live Tracking Touring</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Share lokasi real-time ke keluarga selama touring.</p>
                      <Button size="sm" className="w-full" asChild>
                        <Link to={`/tracking/start/${event.id}`}>📍 Mulai Tracking</Link>
                      </Button>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                    <a href={waLink} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                  <ShareButton
                    contentType="event"
                    contentId={event.id}
                    title={event.title}
                    description={event.description?.replace(/<[^>]*>/g, '').slice(0, 160)}
                    slug={event.slug || event.id}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rekomendasi Event */}
          <EventRecommendations currentEvent={event} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
