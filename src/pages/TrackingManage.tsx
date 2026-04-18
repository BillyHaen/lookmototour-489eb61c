import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, MapPin, ArrowLeft, StopCircle, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMyTrackingSessions, useEndTrackingSession } from '@/hooks/useTrackingSession';
import TrackingStatusBadge from '@/components/tracking/TrackingStatusBadge';
import RecipientManager from '@/components/tracking/RecipientManager';
import { formatDate } from '@/data/events';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { toast } from '@/hooks/use-toast';

export default function TrackingManage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useMyTrackingSessions();
  const endSession = useEndTrackingSession();
  const [expanded, setExpanded] = useState<string | null>(null);

  useSeoMeta({ title: 'Kelola Tracking' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const handleEnd = async (id: string) => {
    if (!confirm('Hentikan sesi tracking ini? Keluarga tidak akan bisa lihat lokasi lagi.')) return;
    try {
      await endSession.mutateAsync(id);
      toast({ title: 'Tracking dihentikan' });
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container max-w-2xl space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/profile"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Link>
          </Button>

          <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Sesi Tracking Saya
          </h1>

          {sessions.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Belum ada sesi tracking. Mulai dari halaman event saat hari keberangkatan.
              </CardContent>
            </Card>
          )}

          {sessions.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold truncate">{s.events?.title || 'Event'}</p>
                    <p className="text-xs text-muted-foreground">{s.events?.location} • {formatDate(s.events?.date)}</p>
                  </div>
                  <TrackingStatusBadge status={s.status} expiresAt={s.expires_at} />
                </div>

                {s.notes && <p className="text-sm text-muted-foreground italic">"{s.notes}"</p>}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={s.google_maps_url} target="_blank" rel="noreferrer" className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" /> Buka Maps
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    {expanded === s.id ? 'Tutup' : 'Kelola Keluarga'}
                  </Button>
                  {s.status === 'active' && (
                    <Button size="sm" variant="destructive" onClick={() => handleEnd(s.id)} className="gap-1">
                      <StopCircle className="h-3.5 w-3.5" /> Hentikan
                    </Button>
                  )}
                </div>

                {expanded === s.id && <RecipientManager sessionId={s.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
