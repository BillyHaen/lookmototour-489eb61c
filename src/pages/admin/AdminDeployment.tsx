import { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, RefreshCw, ExternalLink, AlertTriangle, Info, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const PUBLISHED_URL = 'https://lookmototour-dev2.lovable.app';

type HealthStatus = {
  status: 'ok' | 'down' | 'mismatch' | 'checking' | 'idle';
  httpStatus?: number;
  liveBuildId?: string;
  liveBuildTimestamp?: string;
  checkedAt?: string;
  error?: string;
  latencyMs?: number;
};

const CURRENT_BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'unknown';
const CURRENT_BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'unknown';

export default function AdminDeployment() {
  const [health, setHealth] = useState<HealthStatus>({ status: 'idle' });

  const checkHealth = useCallback(async () => {
    setHealth({ status: 'checking' });
    const start = performance.now();
    try {
      // Check root URL with cache-bust
      const rootRes = await fetch(`${PUBLISHED_URL}/?_cb=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const latency = Math.round(performance.now() - start);

      if (!rootRes.ok) {
        setHealth({
          status: 'down',
          httpStatus: rootRes.status,
          checkedAt: new Date().toISOString(),
          latencyMs: latency,
          error: `Live URL mengembalikan HTTP ${rootRes.status}`,
        });
        return;
      }

      // Try to fetch build-info.json from live deployment
      let liveBuildId: string | undefined;
      let liveBuildTimestamp: string | undefined;
      try {
        const infoRes = await fetch(`${PUBLISHED_URL}/build-info.json?_cb=${Date.now()}`, {
          cache: 'no-store',
        });
        if (infoRes.ok) {
          const info = await infoRes.json();
          liveBuildId = info.buildId;
          liveBuildTimestamp = info.buildTimestamp;
        }
      } catch {
        /* build-info missing on old deploys - that's fine */
      }

      const isMismatch =
        liveBuildId && CURRENT_BUILD_ID !== 'unknown' && liveBuildId !== CURRENT_BUILD_ID;

      setHealth({
        status: isMismatch ? 'mismatch' : 'ok',
        httpStatus: rootRes.status,
        liveBuildId,
        liveBuildTimestamp,
        checkedAt: new Date().toISOString(),
        latencyMs: latency,
      });
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      setHealth({
        status: 'down',
        checkedAt: new Date().toISOString(),
        latencyMs: latency,
        error: err instanceof Error ? err.message : 'Tidak bisa menjangkau live URL',
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const formatTime = (iso?: string) => {
    if (!iso || iso === 'dev' || iso === 'unknown') return iso || '—';
    try {
      return format(new Date(iso), "dd MMM yyyy HH:mm:ss", { locale: idLocale });
    } catch {
      return iso;
    }
  };

  const StatusBadge = () => {
    switch (health.status) {
      case 'ok':
        return (
          <Badge className="bg-green-600 hover:bg-green-700 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Live & Sinkron
          </Badge>
        );
      case 'mismatch':
        return (
          <Badge variant="secondary" className="gap-1 bg-amber-500 text-white hover:bg-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Belum Sinkron
          </Badge>
        );
      case 'down':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3.5 w-3.5" /> Down
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Memeriksa…
          </Badge>
        );
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold">Status Deployment</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pantau apakah build terakhir sudah ter-publish ke live site.
            </p>
          </div>
          <Button onClick={checkHealth} disabled={health.status === 'checking'} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${health.status === 'checking' ? 'animate-spin' : ''}`} />
            Periksa Sekarang
          </Button>
        </div>

        {/* Status banner */}
        {health.status === 'mismatch' && (
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">
              Versi live berbeda dengan versi yang sedang Anda lihat
            </AlertTitle>
            <AlertDescription className="text-sm mt-1">
              Live site masih menjalankan build lama. Klik <strong>Publish → Update</strong> untuk
              men-deploy versi terbaru.
            </AlertDescription>
          </Alert>
        )}
        {health.status === 'down' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Live site tidak bisa dijangkau</AlertTitle>
            <AlertDescription className="text-sm mt-1 space-y-2">
              <div>{health.error}</div>
              <div className="font-medium pt-1">Penyebab paling mungkin:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Build deploy gagal — cek dialog Publish untuk error message</li>
                <li>Subdomain salah atau berubah</li>
                <li>Lovable hosting incident sementara</li>
              </ul>
              <div className="font-medium pt-1">Langkah perbaikan:</div>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Klik <strong>Publish → Update</strong> sekali lagi</li>
                <li>Tunggu 2–3 menit lalu klik <em>Periksa Sekarang</em></li>
                <li>Bila tetap down, hubungi support Lovable</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
        {health.status === 'ok' && (
          <Alert className="border-green-500/50 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700 dark:text-green-400">
              Live site sehat dan sinkron
            </AlertTitle>
            <AlertDescription className="text-sm mt-1">
              Build yang sedang Anda lihat sama dengan yang ter-deploy di live URL.
            </AlertDescription>
          </Alert>
        )}

        {/* Live site card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Live Site</CardTitle>
              <StatusBadge />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-muted-foreground">URL</span>
              <a
                href={PUBLISHED_URL}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-primary hover:underline inline-flex items-center gap-1"
              >
                {PUBLISHED_URL} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">HTTP Status</span>
              <span className="font-mono">
                {health.httpStatus ?? '—'}
                {health.latencyMs !== undefined && (
                  <span className="text-muted-foreground ml-2 text-xs">{health.latencyMs}ms</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Build ID di live</span>
              <span className="font-mono text-xs">{health.liveBuildId ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Build time di live</span>
              <span className="text-xs">{formatTime(health.liveBuildTimestamp)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Cek terakhir
              </span>
              <span className="text-xs">{formatTime(health.checkedAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Current build card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Build yang Sedang Anda Lihat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Build ID</span>
              <span className="font-mono text-xs">{CURRENT_BUILD_ID}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Build time</span>
              <span className="text-xs">{formatTime(CURRENT_BUILD_TIMESTAMP)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Mode</span>
              <Badge variant="outline" className="text-xs">
                {import.meta.env.MODE}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Catatan teknis</AlertTitle>
          <AlertDescription className="text-sm mt-1 space-y-1">
            <p>
              Halaman ini melakukan <em>health check</em> publik via HTTP request ke live URL —
              bukan query ke API internal Lovable (yang tidak tersedia).
            </p>
            <p>
              Jika <strong>Build ID di live</strong> kosong setelah publish baru, kemungkinan
              deploy belum membawa file <code className="text-xs bg-muted px-1 rounded">build-info.json</code>.
              Build ID ini akan terisi mulai dari deploy berikutnya setelah perubahan ini live.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}
