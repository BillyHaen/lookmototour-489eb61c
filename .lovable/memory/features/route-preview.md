---
name: route-preview
description: Interactive route preview — Leaflet map, GPX upload, waypoints (resto/SPBU/viewpoint), elevation chart, Street View links
type: feature
---
Route data disimpan di `events.route_data` (JSONB), nullable. Struktur: `{ polyline: [[lat,lng]], elevation: [{distance,alt}], waypoints: [{lat,lng,type,name,description}], start, end, stats }`.

Map: Leaflet + OpenStreetMap (gratis, no API key). Tile URL `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.

Admin input via upload GPX (.gpx) — parser di `src/lib/gpxParser.ts` pakai DOMParser native. Auto-extract polyline, elevation (sampled max 500 pts / 200 ele), stats (gain/loss/distance), wpt waypoints. Admin juga bisa add waypoint manual via koordinat.

Street View: link ke `https://www.google.com/maps?q=&layer=c&cbll={lat},{lng}` (no API key).

Waypoint types: start, end, resto, viewpoint, spbu, penginapan — di `WAYPOINT_META`.

Komponen: `RouteMap`, `ElevationChart` (Recharts AreaChart), `RoutePreview` (wrapper untuk EventDetail), `admin/RouteEditor`. EventCard menampilkan badge "🗺️ Route" jika route_data ada.
