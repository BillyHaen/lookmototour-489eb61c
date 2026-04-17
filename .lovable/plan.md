

## 🗺️ Interactive Route Preview — Diskusi & Plan

### Pendapat Saya

Fitur ini **strategic banget** dan melengkapi Safety Score dengan sempurna:
- **Safety Score** = "Seberapa aman trip ini?" (data analitik)
- **Route Preview** = "Seperti apa rasanya trip ini?" (data visual)

Dua-duanya jawab pertanyaan calon peserta sebelum daftar. Tidak ada duplikasi.

### Cek Duplikasi vs Fitur Existing

| Fitur Existing | Status | Catatan |
|---|---|---|
| `location` (text) | KEEP | Tetap untuk display ringkas & SEO |
| `distance` (text "350 km") | KEEP | Manual input admin, dipakai Safety Score |
| `highlights` (array text) | **MERGE** | Sekarang text doang. Akan jadi waypoint dengan koordinat |
| `event_itineraries` | KEEP | Untuk narasi hari per hari, bukan geo data |
| Safety Score | KEEP | Tetap pakai `road_condition`, `difficulty`, `fatigue_level` |

**Keputusan**: `highlights` text array tetap ada (backward compat), tapi data geografis disimpan di kolom baru `route_data` (JSONB). Tidak ada konflik.

### Pilihan Map Provider

Saya rekomendasikan **Leaflet + OpenStreetMap** (GRATIS, no API key):
- Mapbox/Google butuh API key + biaya
- Leaflet sudah cukup untuk: polyline rute, marker POI, popup
- Untuk Street View: link langsung ke Google Maps Street View (gratis, buka tab baru) — tidak perlu embed

### Sumber Data Rute (Bagaimana Admin Input?)

Strategi paling realistis untuk admin Indonesia:

**Mode 1: Upload GPX file** (rekomendasi utama)
- Admin record rute pakai Strava/Komoot/Google MyMaps lalu export GPX
- Sistem parse GPX → extract polyline + elevation otomatis

**Mode 2: Manual waypoint** (untuk POI: resto, SPBU, spot foto)
- Admin klik di map untuk drop pin → isi nama, tipe, deskripsi
- Tipe: 🍽️ Resto, 🌄 Viewpoint/Spot Foto, ⛽ SPBU, 🛏️ Penginapan, 🏁 Start/Finish

**Elevation**: Auto-extract dari GPX. Jika tidak ada GPX, skip elevation chart.

### Struktur `route_data` (JSONB)

```json
{
  "polyline": [[lat,lng], ...],          // dari GPX track
  "elevation": [{"distance": 0, "alt": 50}, ...],  // dari GPX
  "waypoints": [
    {
      "lat": -7.95, "lng": 112.61,
      "type": "viewpoint",
      "name": "Penanjakan Bromo",
      "description": "Spot sunrise terbaik",
      "photo_url": "..."  // optional
    }
  ],
  "start": {"lat":..., "lng":..., "name":"Malang"},
  "end": {"lat":..., "lng":..., "name":"Bromo"}
}
```

### Arsitektur Komponen

```text
src/
├── components/
│   ├── RoutePreview.tsx          ← container utama (tabs: Map | Elevation)
│   ├── RouteMap.tsx              ← Leaflet map + markers + polyline
│   ├── ElevationChart.tsx        ← Recharts line chart elevation
│   └── admin/
│       ├── RouteEditor.tsx       ← upload GPX + waypoint editor
│       └── WaypointMarker.tsx    ← form add/edit POI
├── lib/
│   └── gpxParser.ts              ← parse GPX XML → polyline + elevation
```

### Database

1 kolom baru di `events`:
```sql
ALTER TABLE events ADD COLUMN route_data JSONB DEFAULT NULL;
```

Tidak butuh tabel baru. JSONB cukup karena: ukuran kecil (<100KB per event), tidak di-query per-field, atomic update.

### UI Integration

**EventDetail.tsx** — tambah section baru "Rute Touring" di antara Itinerary dan Safety Score:
```text
┌──────────────────────────────────┐
│ 🗺️ Rute Touring                  │
│ ┌──────────────────────────────┐ │
│ │ [Peta Leaflet interaktif]    │ │
│ │  📍 Start  🌄 Spot  ⛽ SPBU   │ │
│ └──────────────────────────────┘ │
│                                  │
│ 📊 Profil Elevasi               │
│ [chart naik-turun]              │
│ Total naik: 850m | turun: 720m  │
│                                  │
│ 🚏 Titik Berhenti (5)           │
│ • 🌄 Penanjakan Bromo  [📷 SV] │ ← Street View link
│ • 🍽️ Warung Makan Pak Slamet    │
│ • ⛽ Pertamina KM 45            │
└──────────────────────────────────┘
```

**Mobile-first**: Map collapse-able, default tinggi 280px, expand ke fullscreen on tap.

**EventCard.tsx** — TIDAK ditambah map (terlalu berat). Cukup badge kecil "🗺️ Route tersedia" jika `route_data` ada.

**AdminEvents.tsx** — tambah tab "Rute" di form edit event dengan:
- Upload GPX button
- Map editor untuk add/remove waypoints
- Preview elevation chart

### Dependencies Baru

- `leaflet` + `react-leaflet` (~40KB) — map
- `@types/leaflet` — types
- GPX parser: pakai DOMParser native (no lib)
- Recharts (sudah ada di `chart.tsx`)

### Fase Implementasi

**Fase 1 (sekarang)**:
1. Migration `route_data` JSONB
2. GPX parser util
3. `RouteMap` + `ElevationChart` components
4. Section di `EventDetail`
5. Admin: upload GPX + tampil preview (waypoints kosong dulu)

**Fase 2 (lanjutan, opsional)**:
- Waypoint editor interaktif (klik map → add POI)
- Photo upload per waypoint
- Heatmap kepadatan trip (jika banyak event)

### File yang Akan Diubah/Dibuat

| File | Aksi |
|---|---|
| Migration SQL | Tambah `route_data` JSONB ke `events` |
| `src/lib/gpxParser.ts` | NEW — parse GPX |
| `src/components/RouteMap.tsx` | NEW — Leaflet map |
| `src/components/ElevationChart.tsx` | NEW — Recharts elevation |
| `src/components/RoutePreview.tsx` | NEW — wrapper untuk EventDetail |
| `src/components/admin/RouteEditor.tsx` | NEW — admin upload + editor |
| `src/pages/EventDetail.tsx` | Tambah section Rute |
| `src/pages/admin/AdminEvents.tsx` | Tambah tab Rute |
| `src/components/EventCard.tsx` | Badge "Route tersedia" |
| `index.html` | Import Leaflet CSS |
| `package.json` | + leaflet, react-leaflet |

### Yang TIDAK Dibuat (Anti-Duplikasi)

- ❌ Tidak ganti `event_itineraries` — itu untuk narasi hari, bukan peta
- ❌ Tidak ganti `highlights` array — tetap dipakai untuk bullet points cepat
- ❌ Tidak embed Google Street View (butuh API key + biaya). Pakai **link** ke Google Maps Street View dari koordinat waypoint
- ❌ Tidak buat tabel `event_waypoints` baru — JSONB lebih simple

