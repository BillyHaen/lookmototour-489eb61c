import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Bike, Map, Award, Users, MessageSquare, Plus, Calendar, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRider, useRiderTrips } from '@/hooks/useRider';
import { useGarageBikes, useGarageGear, useDeleteBike, useDeleteGear } from '@/hooks/useGarage';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { useEndorsements } from '@/hooks/useEndorsements';
import { useAuth } from '@/hooks/useAuth';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import RiderHeader from '@/components/rider/RiderHeader';
import StatCard from '@/components/rider/StatCard';
import TripCard from '@/components/rider/TripCard';
import BikeCard from '@/components/rider/BikeCard';
import GearCard from '@/components/rider/GearCard';
import AchievementBadge from '@/components/rider/AchievementBadge';
import EndorsementCard from '@/components/rider/EndorsementCard';
import BikeFormDialog from '@/components/rider/BikeFormDialog';
import GearFormDialog from '@/components/rider/GearFormDialog';
import EndorsementFormDialog from '@/components/rider/EndorsementFormDialog';
import { formatDate } from '@/data/events';

export default function RiderProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rider, isLoading } = useRider(username);
  const { data: trips = [] } = useRiderTrips(rider?.user_id);
  const { data: bikes = [] } = useGarageBikes(rider?.user_id);
  const { data: gear = [] } = useGarageGear(rider?.user_id);
  const { data: allAchievements = [] } = useAchievements();
  const { data: unlockedAchievements = [] } = useUserAchievements(rider?.user_id);
  const { data: endorsements = [] } = useEndorsements(rider?.user_id);

  const [bikeDialog, setBikeDialog] = useState<{ open: boolean; bike?: any }>({ open: false });
  const [gearDialog, setGearDialog] = useState<{ open: boolean; gear?: any }>({ open: false });
  const [endorseDialog, setEndorseDialog] = useState(false);

  const isOwner = !!user && user.id === rider?.user_id;
  const deleteBike = useDeleteBike(rider?.user_id || '');
  const deleteGear = useDeleteGear(rider?.user_id || '');

  useSeoMeta({
    title: rider ? `${rider.name} (@${rider.username}) – Rider Profile | LookMotoTour` : 'Rider Profile',
    description: rider ? `${rider.bio || `${rider.total_trips} trip · ${Math.round(Number(rider.total_km))} KM · Trust Score ${rider.trust_score}`}` : 'Profil rider LookMotoTour',
    image: rider?.avatar_url || rider?.banner_url || undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  useEffect(() => {
    if (!rider) return;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: rider.name,
      alternateName: `@${rider.username}`,
      image: rider.avatar_url || undefined,
      description: rider.bio || `${rider.total_trips} trip selesai`,
      knowsAbout: rider.riding_style ? [rider.riding_style] : undefined,
      address: rider.location ? { '@type': 'PostalAddress', addressLocality: rider.location } : undefined,
    };
    let el = document.querySelector('script[data-rider-jsonld]') as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-rider-jsonld', '1');
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(ld);
    return () => { el?.remove(); };
  }, [rider]);

  if (isLoading) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="pt-24 pb-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </div>
    );
  }
  if (!rider) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="pt-24 pb-20 container text-center">
          <h1 className="font-heading font-bold text-2xl">Rider Tidak Ditemukan</h1>
          <Button className="mt-4" onClick={() => navigate('/')}>Kembali</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const unlockedSet = new Set(unlockedAchievements.map(a => a.achievement_code));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16 pb-20">
        <RiderHeader rider={rider} />

        <div className="container mt-6 space-y-6">
          {/* Stat bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={Map} label="Trips" value={rider.total_trips} />
            <StatCard icon={MapPin} label="KM" value={Math.round(Number(rider.total_km))} />
            <StatCard icon={Award} label="Badges" value={unlockedAchievements.length} />
            <StatCard icon={Users} label="Followers" value={rider.follower_count} />
          </div>

          <Tabs defaultValue="about">
            <TabsList className="w-full overflow-x-auto justify-start sm:justify-center">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="trips">Trips</TabsTrigger>
              <TabsTrigger value="garage">Garage</TabsTrigger>
              <TabsTrigger value="achievements">Badges</TabsTrigger>
              <TabsTrigger value="endorsements">Endorsements</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-3">
              <div className="rounded-lg border border-border p-4 bg-card space-y-2">
                <h2 className="font-heading font-semibold text-lg">Tentang</h2>
                {rider.bio ? <p className="text-sm">{rider.bio}</p> : <p className="text-sm text-muted-foreground">Belum ada bio.</p>}
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1 pt-2"><Calendar className="h-3 w-3" />Member sejak {formatDate(rider.member_since)}</p>
              </div>
            </TabsContent>

            <TabsContent value="trips" className="space-y-3">
              <h2 className="font-heading font-semibold text-lg">Trip Selesai ({trips.length})</h2>
              {trips.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada trip yang diikuti.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {trips.map((t: any) => <TripCard key={t.id} trip={t} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="garage" className="space-y-6">
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading font-semibold text-lg flex items-center gap-2"><Bike className="h-5 w-5" />Motor ({bikes.length})</h2>
                  {isOwner && <Button size="sm" onClick={() => setBikeDialog({ open: true })} className="gap-1"><Plus className="h-4 w-4" />Tambah</Button>}
                </div>
                {bikes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada motor di garasi.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {bikes.map((b: any) => (
                      <BikeCard key={b.id} bike={b} isOwner={isOwner}
                        onEdit={() => setBikeDialog({ open: true, bike: b })}
                        onDelete={() => { if (confirm('Hapus motor ini?')) deleteBike.mutate(b.id); }} />
                    ))}
                  </div>
                )}
              </section>
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading font-semibold text-lg">Gear ({gear.length})</h2>
                  {isOwner && <Button size="sm" onClick={() => setGearDialog({ open: true })} className="gap-1"><Plus className="h-4 w-4" />Tambah</Button>}
                </div>
                {gear.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada gear.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {gear.map((g: any) => (
                      <GearCard key={g.id} gear={g} isOwner={isOwner}
                        onEdit={() => setGearDialog({ open: true, gear: g })}
                        onDelete={() => { if (confirm('Hapus gear ini?')) deleteGear.mutate(g.id); }} />
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-3">
              <h2 className="font-heading font-semibold text-lg">Achievements ({unlockedAchievements.length}/{allAchievements.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {allAchievements.map((a) => {
                  const unlocked = unlockedSet.has(a.code);
                  let progress: string | undefined;
                  if (!unlocked) {
                    if (a.criteria_type === 'trips') progress = `${rider.total_trips}/${a.threshold} trip`;
                    else if (a.criteria_type === 'km') progress = `${Math.round(Number(rider.total_km))}/${a.threshold} KM`;
                  }
                  return <AchievementBadge key={a.code} achievement={a} unlocked={unlocked} progressLabel={progress} />;
                })}
              </div>
            </TabsContent>

            <TabsContent value="endorsements" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg">Endorsements ({endorsements.length})</h2>
                {user && !isOwner && (
                  <Button size="sm" onClick={() => setEndorseDialog(true)} className="gap-1">
                    <MessageSquare className="h-4 w-4" />Tulis Endorsement
                  </Button>
                )}
              </div>
              {endorsements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada endorsement.</p>
              ) : (
                <div className="space-y-3">
                  {endorsements.map((e: any) => <EndorsementCard key={e.id} endorsement={e} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {isOwner && (
        <>
          <BikeFormDialog open={bikeDialog.open} onOpenChange={(o) => setBikeDialog({ open: o, bike: o ? bikeDialog.bike : undefined })} userId={rider.user_id} bike={bikeDialog.bike} />
          <GearFormDialog open={gearDialog.open} onOpenChange={(o) => setGearDialog({ open: o, gear: o ? gearDialog.gear : undefined })} userId={rider.user_id} gear={gearDialog.gear} />
        </>
      )}
      {user && !isOwner && (
        <EndorsementFormDialog open={endorseDialog} onOpenChange={setEndorseDialog} toUserId={rider.user_id} toName={rider.name} />
      )}
    </div>
  );
}
