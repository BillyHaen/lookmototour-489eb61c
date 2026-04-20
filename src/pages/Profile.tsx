import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, CalendarDays, LogOut, Star, MessageSquare, Award, Shield, Flame, Trophy, Truck, Navigation, Gift, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '@/data/events';
import { useMyTrackingSessions } from '@/hooks/useTrackingSession';
import { useMyRentals } from '@/hooks/useGearRentals';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AvatarUpload from '@/components/AvatarUpload';
import { useMyProfile } from '@/hooks/useProfile';

import RecommendedSponsors from '@/components/RecommendedSponsors';

const BADGES = [
  { min: 1, label: 'Rookie Rider', icon: Star, color: 'text-muted-foreground' },
  { min: 3, label: 'Explorer', icon: Flame, color: 'text-accent' },
  { min: 5, label: 'Road Warrior', icon: Shield, color: 'text-primary' },
  { min: 10, label: 'Legend', icon: Trophy, color: 'text-primary' },
  { min: 20, label: 'Grand Master', icon: Award, color: 'text-primary' },
];

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string().min(3, 'Username min 3 karakter').regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, dan tanda hubung').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  riding_style: z.string().optional(),
  location: z.string().max(100).optional(),
  banner_url: z.string().optional(),
});

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const { data: registrations } = useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, events(id, title, date, location, price, price_sharing, price_single, price_couple, towing_pergi_price, towing_pulang_price, status)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const confirmedCount = (registrations || []).filter(r => r.status === 'confirmed').length;
  const badges = BADGES.filter(b => confirmedCount >= b.min);
  const { data: trackingSessions = [] } = useMyTrackingSessions();
  const { data: myRentals = [] } = useMyRentals();
  const activeSessions = (trackingSessions as any[]).filter(s => s.status === 'active' && new Date(s.expires_at) > new Date());

  // Completed events for testimonial
  const completedEvents = (registrations || []).filter(r => {
    const ev = (r as any).events;
    return r.status === 'confirmed' && ev?.status === 'completed';
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', username: '', phone: '', bio: '', riding_style: '', location: '', banner_url: '' },
  });

  useEffect(() => {
    if (!profile) return;
    const p: any = profile;
    form.reset({
      name: p.name ?? '',
      username: p.username ?? '',
      phone: p.phone ?? '',
      bio: p.bio ?? '',
      riding_style: p.riding_style ?? '',
      location: p.location ?? '',
      banner_url: p.banner_url ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const payload: any = { ...values };
      if (!payload.username) delete payload.username;
      const { error } = await supabase.from('profiles').update(payload).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-full', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-nav', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-username'] });
      queryClient.invalidateQueries({ queryKey: ['rider'] });
      toast({ title: 'Profil berhasil diperbarui! ✅' });
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AvatarUpload userId={user!.id} currentUrl={profile?.avatar_url} name={profile?.name} size="lg" />
              <h1 className="font-heading font-bold text-3xl">Profil Saya</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Badge Saya ({confirmedCount} event)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <Badge key={b.label} variant="outline" className="gap-1 py-1.5 px-3">
                      <b.icon className={`h-4 w-4 ${b.color}`} />
                      {b.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => updateProfile.mutate(v))} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username (URL profil publik)</FormLabel>
                      <FormControl><Input placeholder="rider-keren" {...field} /></FormControl>
                      {field.value && (
                        <Link to={`/riders/${field.value}`} className="text-xs text-primary hover:underline">
                          → Lihat profil publik: /riders/{field.value}
                        </Link>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP</FormLabel>
                      <FormControl><Input placeholder="08123456789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="riding_style" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riding Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih gaya riding" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="santai">Santai</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="touring">Touring</SelectItem>
                          <SelectItem value="racing">Racing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl><Input placeholder="Jakarta, Indonesia" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl><Textarea placeholder="Ceritakan tentang kamu..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Personalized Sponsor Recommendations */}
          <RecommendedSponsors limit={6} />

          {/* Live Tracking Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" /> Live Tracking
                {activeSessions.length > 0 && <Badge variant="default" className="ml-auto">{activeSessions.length} aktif</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trackingSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">Belum ada sesi tracking. Mulai dari halaman event saat hari keberangkatan.</p>
              ) : (
                <div className="space-y-2">
                  {activeSessions.length > 0 && (
                    <p className="text-sm text-muted-foreground">{activeSessions.length} sesi sedang aktif berbagi lokasi.</p>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/tracking/manage">Kelola Sesi Tracking</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Rentals */}
          {myRentals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Sewa Gear Saya
                  <Badge variant="secondary" className="ml-auto">{myRentals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRentals.map((r: any) => {
                    const statusLabel: Record<string, string> = {
                      pending: 'Menunggu Konfirmasi', confirmed: 'Dikonfirmasi',
                      picked_up: 'Sedang Disewa', returned: 'Dikembalikan', cancelled: 'Dibatalkan',
                    };
                    const statusVariant: any = {
                      pending: 'outline', confirmed: 'secondary',
                      picked_up: 'default', returned: 'default', cancelled: 'destructive',
                    };
                    return (
                      <div key={r.id} className="p-3 rounded-lg border border-border flex items-start gap-3">
                        {r.products?.image_url && <img src={r.products.image_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{r.products?.name}</p>
                            <Badge variant={statusVariant[r.status]} className="text-[10px]">{statusLabel[r.status]}</Badge>
                          </div>
                          {r.products?.vendors?.name && (
                            <p className="text-xs text-muted-foreground">oleh {r.products.vendors.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(r.start_date)} → {formatDate(r.end_date)} • {r.total_days} hari • Qty: {r.qty}
                          </p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatPrice(r.total_price)}
                            {r.deposit_amount > 0 && <span className="text-xs font-normal text-muted-foreground ml-1">+ deposit {formatPrice(r.deposit_amount)}</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Riwayat Pendaftaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!registrations?.length ? (
                <p className="text-muted-foreground text-sm py-4">Belum ada pendaftaran event.</p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((r) => {
                    const reg = r as any;
                    const regTypeLabel = reg.registration_type === 'sharing' ? 'Sharing' : reg.registration_type === 'couple' ? 'Couple' : 'Single';
                    const paymentStatus = reg.payment_status || 'pending';
                    const paymentLabel = paymentStatus === 'lunas' ? 'Lunas' : paymentStatus === 'batal' ? 'Batal' : paymentStatus?.startsWith('cicilan_') ? `Cicilan ${paymentStatus.split('_')[1]}` : 'Menunggu Pembayaran';
                    const paymentVariant = paymentStatus === 'lunas' ? 'default' : paymentStatus === 'batal' ? 'destructive' : paymentStatus?.startsWith('cicilan_') ? 'secondary' : 'outline';
                    return (
                      <div key={r.id} className="p-4 rounded-lg border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{reg.events?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {reg.events?.date ? formatDate(reg.events.date) : ''} • {reg.events?.location}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge variant={r.status === 'confirmed' ? 'default' : 'secondary'}>
                              {r.status === 'confirmed' ? 'Terdaftar' : r.status}
                            </Badge>
                            <Badge variant={paymentVariant as any} className="block">
                              {paymentLabel}
                              {paymentStatus?.startsWith('cicilan_') && reg.installment_amount > 0 && (
                                <span className="ml-1">— {formatPrice(reg.installment_amount)}</span>
                              )}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{regTypeLabel}</Badge>
                          {reg.towing_pergi && (
                            <Badge variant="outline" className="gap-1"><Truck className="h-3 w-3" /> Towing Pergi — {formatPrice(reg.events?.towing_pergi_price || 0)}</Badge>
                          )}
                          {reg.towing_pulang && (
                            <Badge variant="outline" className="gap-1"><Truck className="h-3 w-3" /> Towing Pulang — {formatPrice(reg.events?.towing_pulang_price || 0)}</Badge>
                          )}
                        </div>
                        {(() => {
                          const ev = reg.events;
                          if (!ev) return null;
                          const basePrice = reg.registration_type === 'sharing' ? (ev.price_sharing || 0) : reg.registration_type === 'couple' ? (ev.price_couple || 0) : (ev.price_single || ev.price || 0);
                          const towingTotal = (reg.towing_pergi ? (ev.towing_pergi_price || 0) : 0) + (reg.towing_pulang ? (ev.towing_pulang_price || 0) : 0);
                          return <p className="text-sm font-bold text-primary">{formatPrice(basePrice + towingTotal)}</p>;
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Write Testimonials for completed events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Tulis Testimoni
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!completedEvents.length ? (
                <p className="text-muted-foreground text-sm py-4">Belum ada event selesai untuk diberikan testimoni.</p>
              ) : (
                <div className="space-y-3">
                  {completedEvents.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="font-medium">{(r as any).events?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {(r as any).events?.date ? formatDate((r as any).events.date) : ''}
                        </p>
                      </div>
                      <TestimonialButton eventId={(r as any).events?.id} userId={user!.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(24 95% 53% / 0.15)' }}>
                  <Gift className="h-5 w-5" style={{ color: 'hsl(24 95% 53%)' }} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">Sponsor Deals</h3>
                  <p className="text-sm text-muted-foreground">Penawaran eksklusif dari sponsor untuk trip Anda</p>
                </div>
              </div>
              <Button asChild><Link to="/dashboard/sponsor-deals">Lihat Penawaran</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function TestimonialButton({ eventId, userId }: { eventId: string; userId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState('5');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['my-testimonial', eventId, userId],
    queryFn: async () => {
      const { data } = await (supabase.from('testimonials') as any)
        .select('*').eq('event_id', eventId).eq('user_id', userId).maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    setLoading(true);
    const { error } = await (supabase.from('testimonials') as any).insert({
      user_id: userId, event_id: eventId, rating: Number(rating), content,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Testimoni terkirim! ✅', description: 'Testimoni kamu akan ditampilkan setelah disetujui admin.' });
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ['my-testimonial', eventId, userId] });
  };

  if (existing) {
    return <Badge variant={existing.status === 'approved' ? 'default' : 'secondary'}>{existing.status === 'approved' ? 'Disetujui' : existing.status === 'pending' ? 'Menunggu' : 'Ditolak'}</Badge>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1"><MessageSquare className="h-3 w-3" /> Tulis</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Tulis Testimoni</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Rating</label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map(v => (
                  <SelectItem key={v} value={String(v)}>{'⭐'.repeat(v)} ({v})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Testimoni</label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ceritakan pengalaman kamu..." rows={4} />
          </div>
          <Button className="w-full" onClick={submit} disabled={loading || !content.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Kirim Testimoni
          </Button>
          <p className="text-xs text-muted-foreground text-center">Testimoni akan ditampilkan setelah disetujui oleh admin.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
