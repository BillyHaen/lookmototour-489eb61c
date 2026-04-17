// Parse GPX XML using browser's DOMParser (no extra dep)

export interface RouteData {
  polyline: [number, number][];
  elevation: { distance: number; alt: number }[];
  waypoints: Waypoint[];
  start?: { lat: number; lng: number; name: string };
  end?: { lat: number; lng: number; name: string };
  stats?: { distance: number; gain: number; loss: number };
}

export type WaypointType = 'start' | 'end' | 'resto' | 'viewpoint' | 'spbu' | 'penginapan';

export interface Waypoint {
  lat: number;
  lng: number;
  type: WaypointType;
  name: string;
  description?: string;
  photo_url?: string;
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseGPX(xmlString: string): RouteData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('File GPX tidak valid');

  const trkpts = Array.from(doc.querySelectorAll('trkpt, rtept'));
  if (trkpts.length === 0) throw new Error('Tidak ada track point ditemukan di file GPX');

  const polyline: [number, number][] = [];
  const elevation: { distance: number; alt: number }[] = [];
  let cumDist = 0;
  let prevLat = 0;
  let prevLng = 0;
  let gain = 0;
  let loss = 0;
  let prevAlt: number | null = null;

  trkpts.forEach((pt, i) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lng = parseFloat(pt.getAttribute('lon') || '0');
    const eleEl = pt.querySelector('ele');
    const alt = eleEl ? parseFloat(eleEl.textContent || '0') : 0;

    if (i > 0) cumDist += haversine(prevLat, prevLng, lat, lng);
    polyline.push([lat, lng]);
    elevation.push({ distance: Math.round(cumDist * 10) / 10, alt: Math.round(alt) });

    if (prevAlt !== null) {
      const diff = alt - prevAlt;
      if (diff > 0) gain += diff;
      else loss -= diff;
    }
    prevAlt = alt;
    prevLat = lat;
    prevLng = lng;
  });

  // Sample down if too many points (cap at 500 for storage)
  const sampled = polyline.length > 500 ? sampleArray(polyline, 500) : polyline;
  const sampledEle = elevation.length > 200 ? sampleArray(elevation, 200) : elevation;

  // Waypoints from <wpt>
  const wpts = Array.from(doc.querySelectorAll('wpt'));
  const waypoints: Waypoint[] = wpts.map((wpt) => {
    const lat = parseFloat(wpt.getAttribute('lat') || '0');
    const lng = parseFloat(wpt.getAttribute('lon') || '0');
    const name = wpt.querySelector('name')?.textContent || 'Waypoint';
    const desc = wpt.querySelector('desc')?.textContent || '';
    const sym = (wpt.querySelector('sym')?.textContent || '').toLowerCase();
    let type: WaypointType = 'viewpoint';
    if (sym.includes('food') || sym.includes('restaurant')) type = 'resto';
    else if (sym.includes('fuel') || sym.includes('gas')) type = 'spbu';
    else if (sym.includes('lodging') || sym.includes('hotel')) type = 'penginapan';
    return { lat, lng, type, name, description: desc };
  });

  const first = polyline[0];
  const last = polyline[polyline.length - 1];

  return {
    polyline: sampled,
    elevation: sampledEle,
    waypoints,
    start: first ? { lat: first[0], lng: first[1], name: 'Start' } : undefined,
    end: last ? { lat: last[0], lng: last[1], name: 'Finish' } : undefined,
    stats: {
      distance: Math.round(cumDist * 10) / 10,
      gain: Math.round(gain),
      loss: Math.round(loss),
    },
  };
}

function sampleArray<T>(arr: T[], target: number): T[] {
  const step = arr.length / target;
  const out: T[] = [];
  for (let i = 0; i < target; i++) out.push(arr[Math.floor(i * step)]);
  out.push(arr[arr.length - 1]);
  return out;
}

export const WAYPOINT_META: Record<WaypointType, { icon: string; label: string; color: string }> = {
  start: { icon: '🏁', label: 'Start', color: 'hsl(142 71% 45%)' },
  end: { icon: '🎯', label: 'Finish', color: 'hsl(0 84% 60%)' },
  resto: { icon: '🍽️', label: 'Resto', color: 'hsl(35 100% 50%)' },
  viewpoint: { icon: '🌄', label: 'Spot Foto', color: 'hsl(200 80% 50%)' },
  spbu: { icon: '⛽', label: 'SPBU', color: 'hsl(280 60% 50%)' },
  penginapan: { icon: '🛏️', label: 'Penginapan', color: 'hsl(180 60% 40%)' },
};
