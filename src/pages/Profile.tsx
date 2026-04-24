import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Star, MessageSquare, Award, Shield, Flame, Trophy, Package, CalendarDays, Settings, Sparkles } from 'lucide-react';
import { formatDate } from '@/data/events';
import { useMyTrackingSessions } from '@/hooks/useTrackingSession';
import { useMyRentals } from '@/hooks/useGearRentals';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMyProfile } from '@/hooks/useProfile';
import { useWalletBalance } from '@/hooks/useWallet';

import RecommendedSponsors from '@/components/RecommendedSponsors';
import WalletCard from '@/components/WalletCard';
import ProfileHero from '@/components/profile/ProfileHero';
import RentalCard from '@/components/profile/RentalCard';
import RegistrationRow from '@/components/profile/RegistrationRow';
import LiveTrackingWidget from '@/components/profile/LiveTrackingWidget';
import SponsorDealsCard from '@/components/profile/SponsorDealsCard';

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
  const { data: walletBalance = 0 } = useWalletBalance();

  const { data: registrations } = useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, events(id, slug, title, date, location, price, price_sharing, price_single, price_couple, towing_pergi_price, towing_pulang_price, status)')
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

  const p: any = profile || {};

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-6xl">
          {/* Hero */}
          <ProfileHero
            userId={user.id}
            name={p.name}
            username={p.username}
            avatarUrl={p.avatar_url}
            confirmedCount={confirmedCount}
            walletBalance={walletBalance}
            activeSessions={activeSessions.length}
            onLogout={handleLogout}
          />

          {/* 2-col layout */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Main */}
            <div className="min-w-0">
              <Tabs defaultValue="aktivitas" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto bg-card border border-border h-auto p-1">
                  <TabsTrigger value="aktivitas" className="gap-1.5"><Sparkles className="h-4 w-4" />Aktivitas</TabsTrigger>
                  <TabsTrigger value="sewa" className="gap-1.5"><Package className="h-4 w-4" />Sewa Gear</TabsTrigger>
                  <TabsTrigger value="riwayat" className="gap-1.5"><CalendarDays className="h-4 w-4" />Riwayat</TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-4 w-4" />Pengaturan</TabsTrigger>
                </TabsList>

                {/* Aktivitas */}
                <TabsContent value="aktivitas" className="space-y-6 mt-4">
                  {badges.length > 0 && (
                    <Card className="rounded-xl shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
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

                  <Card className="rounded-xl shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Sponsor untuk Saya</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RecommendedSponsors limit={4} />
                    </CardContent>
                  </Card>

                  {completedEvents.length > 0 && (
                    <Card className="rounded-xl shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary" /> Tulis Testimoni
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {completedEvents.map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{(r as any).events?.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(r as any).events?.date ? formatDate((r as any).events.date) : ''}
                                </p>
                              </div>
                              <TestimonialButton eventId={(r as any).events?.id} userId={user!.id} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Sewa Gear */}
                <TabsContent value="sewa" className="mt-4">
                  <Card className="rounded-xl shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" /> Sewa Gear Saya
                        {myRentals.length > 0 && <Badge variant="secondary" className="ml-auto">{myRentals.length}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {myRentals.length === 0 ? (
                        <div className="text-center py-10">
                          <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Belum ada sewa gear.</p>
                          <Button asChild variant="outline" size="sm" className="mt-3">
                            <Link to="/shop">Jelajahi Gear</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {myRentals.map((r: any) => <RentalCard key={r.id} rental={r} />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Riwayat */}
                <TabsContent value="riwayat" className="mt-4">
                  <Card className="rounded-xl shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" /> Riwayat Pendaftaran
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!registrations?.length ? (
                        <div className="text-center py-10">
                          <CalendarDays className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Belum ada pendaftaran event.</p>
                          <Button asChild variant="outline" size="sm" className="mt-3">
                            <Link to="/events">Lihat Events</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {registrations.map((r) => <RegistrationRow key={r.id} reg={r} />)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings */}
                <TabsContent value="settings" className="mt-4">
                  <Card className="rounded-xl shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" /> Informasi Profil
                      </CardTitle>
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
                                  → /riders/{field.value}
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
                          <Button type="submit" disabled={updateProfile.isPending} className="bg-primary hover:bg-primary/90">
                            {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Simpan
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <LiveTrackingWidget activeCount={activeSessions.length} totalCount={trackingSessions.length} />
              <WalletCard />
              <SponsorDealsCard />
            </aside>
          </div>
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
