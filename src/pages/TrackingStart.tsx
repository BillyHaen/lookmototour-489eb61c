import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, MapPin, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import GoogleMapsLinkForm from '@/components/tracking/GoogleMapsLinkForm';
import RecipientManager from '@/components/tracking/RecipientManager';
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/hooks/useEvents';
import { useIsConfirmedParticipant, useStartTrackingSession } from '@/hooks/useTrackingSession';
import { toast } from '@/hooks/use-toast';
import { useSeoMeta } from '@/hooks/useSeoMeta';

export default function TrackingStart() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: isConfirmed, isLoading: confirmLoading } = useIsConfirmedParticipant(event?.id);
  const startSession = useStartTrackingSession();
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  useSeoMeta({ title: 'Mulai Live Tracking' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  if (authLoading || eventLoading || confirmLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 container text-center py-20">
          <h1 className="font-heading font-bold text-2xl mb-4">Event tidak ditemukan</h1>
          <Button asChild><Link to="/events">Kembali</Link></Button>
        </div>
      </div>
    );
  }

  if (!isConfirmed) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 container max-w-xl">
          <Card className="border-2 border-destructive/40">
            <CardContent className="pt-6 text-center space-y-4">
              <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="font-heading font-bold text-xl">Akses Ditolak</h1>
              <p className="text-muted-foreground text-sm">
                Live tracking hanya tersedia untuk peserta yang sudah <strong>confirmed</strong> di event ini.
              </p>
              <Button asChild><Link to={`/events/${event.slug || event.id}`}>Kembali ke Event</Link></Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const handleStart = async (url: string, notes: string) => {
    try {
      const baseDate = event.end_date ? new Date(event.end_date) : new Date(event.date);
      const expiresAt = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const data = await startSession.mutateAsync({
        eventId: event.id,
        googleMapsUrl: url,
        notes,
        expiresAt,
      });
      setCreatedSessionId(data.id);
      toast({ title: 'Tracking dimulai!', description: 'Sekarang tambahkan keluarga untuk dishare.' });
    } catch (err: any) {
      toast({ title: 'Gagal mulai tracking', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container max-w-2xl space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/events/${event.slug || event.id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Event</Link>
          </Button>

          <div>
            <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> Mulai Live Tracking
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Event: <strong>{event.title}</strong></p>
          </div>

          {!createdSessionId ? (
            <GoogleMapsLinkForm onSubmit={handleStart} loading={startSession.isPending} />
          ) : (
            <>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 text-center">
                  <p className="font-semibold text-primary">✅ Tracking Aktif</p>
                  <p className="text-sm text-muted-foreground mt-1">Tambahkan keluarga di bawah untuk share link tracking.</p>
                </CardContent>
              </Card>
              <RecipientManager sessionId={createdSessionId} />
              <Button variant="outline" className="w-full" asChild>
                <Link to="/tracking/manage">Kelola Sesi Tracking</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
