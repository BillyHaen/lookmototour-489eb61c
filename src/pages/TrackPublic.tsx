import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Calendar, MessageCircle, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import logo from '@/assets/logo.png';
import { formatDate } from '@/data/events';
import { useSeoMeta } from '@/hooks/useSeoMeta';

export default function TrackPublic() {
  const { token } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['public-tracking', token],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_tracking_by_token', { _token: token });
      if (error) throw error;
      return (data && data.length > 0 ? data[0] : null) as any;
    },
    enabled: !!token,
    refetchInterval: 60000,
  });

  useSeoMeta({ title: data ? `Tracking ${data.participant_name}` : 'Live Tracking' });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="font-heading font-bold text-lg">Link tidak valid</h1>
            <p className="text-sm text-muted-foreground">Link tracking ini tidak ditemukan atau sudah dihapus.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expired = new Date(data.expires_at) < new Date();
  const ended = data.status === 'ended';
  const showMap = !ended && !expired;
  // Convert google_maps_url to embed-friendly URL via iframe
  // Google Maps short links work in iframes with output=embed appended OR using the original URL in iframe
  const embedUrl = data.google_maps_url;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-2xl py-3 flex items-center gap-2">
          <img src={logo} alt="LookMotoTour" className="h-7 w-auto" />
          <span className="font-heading font-bold text-sm">LookMotoTour</span>
          <span className="ml-auto text-xs text-muted-foreground">Live Tracking</span>
        </div>
      </header>

      <main className="container max-w-2xl py-6 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Halo {data.recipient_name}</p>
                <h1 className="font-heading font-bold text-xl mt-1">
                  {data.participant_name} sedang touring
                </h1>
              </div>
              <Badge variant={showMap ? 'default' : 'secondary'} className="gap-1.5">
                <span className={`h-2 w-2 rounded-full ${showMap ? 'bg-current animate-pulse' : 'bg-current'}`} />
                {showMap ? 'Aktif' : ended ? 'Selesai' : 'Kadaluarsa'}
              </Badge>
            </div>

            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> <strong>{data.event_title}</strong></p>
              <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> Tujuan: {data.event_location}</p>
              <p className="text-xs text-muted-foreground">Mulai: {formatDate(data.started_at)}</p>
            </div>

            {data.notes && (
              <div className="rounded-lg bg-muted p-3 text-sm italic text-muted-foreground">"{data.notes}"</div>
            )}
          </CardContent>
        </Card>

        {showMap ? (
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="rounded-lg overflow-hidden bg-muted aspect-square sm:aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Live Location"
                />
              </div>
              <Button variant="outline" className="w-full gap-1" asChild>
                <a href={data.google_maps_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Buka di Google Maps
                </a>
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                💡 Jika peta tidak muncul, klik "Buka di Google Maps" untuk lihat lokasi langsung.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <p className="font-heading font-bold text-lg">
                {ended ? 'Trip Selesai dengan Selamat' : 'Link Tracking Telah Berakhir'}
              </p>
              <p className="text-sm text-muted-foreground">
                {ended
                  ? `${data.participant_name} sudah menyelesaikan perjalanan.`
                  : 'Link ini sudah tidak aktif. Hubungi peserta untuk info lebih lanjut.'}
              </p>
            </CardContent>
          </Card>
        )}

        {data.participant_phone && (
          <Button variant="default" className="w-full gap-2" asChild>
            <a href={`https://wa.me/${data.participant_phone.replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> Chat {data.participant_name}
            </a>
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Powered by <strong>LookMotoTour</strong>
        </p>
      </main>
    </div>
  );
}
