import { Card, CardContent } from '@/components/ui/card';
import { Map as MapIcon, TrendingUp, ExternalLink } from 'lucide-react';
import RouteMap from './RouteMap';
import ElevationChart from './ElevationChart';
import type { RouteData } from '@/lib/gpxParser';
import { WAYPOINT_META } from '@/lib/gpxParser';

interface RoutePreviewProps {
  routeData: RouteData | null | undefined;
}

export default function RoutePreview({ routeData }: RoutePreviewProps) {
  if (!routeData || !routeData.polyline || routeData.polyline.length === 0) return null;

  const allWaypoints = [
    ...(routeData.start ? [{ ...routeData.start, type: 'start' as const, name: routeData.start.name }] : []),
    ...(routeData.waypoints || []),
    ...(routeData.end ? [{ ...routeData.end, type: 'end' as const, name: routeData.end.name }] : []),
  ];

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" /> Rute Touring
        </h3>

        <RouteMap data={routeData} height={320} />

        {routeData.stats && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Jarak Total</p>
              <p className="font-bold text-sm">{routeData.stats.distance} km</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Total Naik</p>
              <p className="font-bold text-sm text-primary">↑ {routeData.stats.gain} m</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Total Turun</p>
              <p className="font-bold text-sm text-destructive">↓ {routeData.stats.loss} m</p>
            </div>
          </div>
        )}

        {routeData.elevation && routeData.elevation.length > 1 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Profil Elevasi
            </p>
            <ElevationChart data={routeData.elevation} />
          </div>
        )}

        {allWaypoints.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">🚏 Titik Penting ({allWaypoints.length})</p>
            <div className="space-y-1.5">
              {allWaypoints.map((wp, i) => {
                const meta = WAYPOINT_META[wp.type];
                const sv = `https://www.google.com/maps?q=&layer=c&cbll=${wp.lat},${wp.lng}`;
                return (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span className="truncate">{wp.name}</span>
                      {(wp as any).description && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                          — {(wp as any).description}
                        </span>
                      )}
                    </span>
                    <a
                      href={sv}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" /> Street View
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
