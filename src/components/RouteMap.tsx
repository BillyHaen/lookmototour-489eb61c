import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteData, Waypoint } from '@/lib/gpxParser';
import { WAYPOINT_META } from '@/lib/gpxParser';

interface RouteMapProps {
  data: RouteData;
  height?: number;
  className?: string;
}

function makeIcon(type: Waypoint['type']) {
  const meta = WAYPOINT_META[type];
  const html = `<div style="
    background:${meta.color};
    color:#fff;
    width:32px;height:32px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    border:2px solid #fff;
  "><span style="transform:rotate(45deg);font-size:14px;">${meta.icon}</span></div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
}

export default function RouteMap({ data, height = 320, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    // Polyline
    if (data.polyline?.length) {
      const line = L.polyline(data.polyline, {
        color: 'hsl(217 91% 60%)',
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
    } else {
      map.setView([-2.5, 118], 5); // Indonesia center fallback
    }

    // Start/End markers
    const all: Waypoint[] = [];
    if (data.start) all.push({ ...data.start, type: 'start', name: data.start.name });
    if (data.end) all.push({ ...data.end, type: 'end', name: data.end.name });
    all.push(...(data.waypoints || []));

    all.forEach((wp) => {
      const meta = WAYPOINT_META[wp.type];
      const sv = `https://www.google.com/maps?q=&layer=c&cbll=${wp.lat},${wp.lng}`;
      const popup = `
        <div style="min-width:160px">
          <div style="font-weight:600;margin-bottom:4px">${meta.icon} ${wp.name}</div>
          ${wp.description ? `<div style="font-size:12px;color:#666;margin-bottom:6px">${wp.description}</div>` : ''}
          <a href="${sv}" target="_blank" rel="noopener" style="font-size:12px;color:hsl(217 91% 60%);text-decoration:underline">📷 Lihat Street View</a>
        </div>`;
      L.marker([wp.lat, wp.lng], { icon: makeIcon(wp.type) }).addTo(map).bindPopup(popup);
    });

    // Invalidate to fix sizing in modal/tabs
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden border border-border ${className || ''}`}
      style={{ height }}
    />
  );
}
