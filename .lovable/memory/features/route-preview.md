---
name: route-preview
description: Interactive route preview — Leaflet map, GPX upload, waypoints, elevation, Street View, plus per-day route in itinerary
type: feature
---
Rute keseluruhan disimpan di `events.route_data` (JSONB). Editor (`RouteEditor` + `RoutePreview`) sekarang ada di tab **Itinerary** admin (bukan tab Dasar lagi). Frontend `RoutePreview` di-render inline dalam Itinerary section di `EventDetail.tsx` (login-gated).

Per-hari route disimpan di `events.itinerary[i].route` dengan struktur `{ start, end, distance_km, gmaps_url }`. `ItineraryEditor` admin menyediakan field route opsional per day; `EventLanding/ItinerarySection.tsx` me-render mini-card "Rute Hari Ini" jika ada.

Dasar tab admin sekarang hanya berisi field operasional (title/slug/date/lokasi/pricing/hero/asuransi/towing/smart-touring/status). Field SEO (description rich, highlights, requirements, includes, excludes) sudah dipindah ke tab Konten / Include / Itinerary / FAQ / SEO. Legacy `event_itineraries` table dipertahankan untuk back-compat tapi auto-migrasi ke `events.itinerary` JSONB saat openEdit jika SEO itinerary kosong.

Map: Leaflet + OpenStreetMap. GPX parser di `src/lib/gpxParser.ts`. Waypoint types: start, end, resto, viewpoint, spbu, penginapan.
