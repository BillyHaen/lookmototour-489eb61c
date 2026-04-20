

## Bersihkan Tab "Dasar" & Pindahkan Rute ke Itinerary

### Tujuan
Hapus duplikasi field di tab **Dasar** yang sudah ada versi SEO-friendly-nya di tab lain. Pindahkan **Rute Touring** dari tab Dasar ke tab **Itinerary**, dan tambahkan **rute per hari** di setiap day itinerary.

### 1. Field yang DIHAPUS dari tab "Dasar" (admin)

| Field dihapus | Sudah ada di tab |
|---|---|
| `description` (Deskripsi Event - RichText) | **Konten** (Opening Hook + Why Join + Experience + About) |
| `highlights` (comma input) | **Konten** (Why Join) |
| `requirements` (comma input) | **Konten** (Target Audience) |
| `includes` (comma input) | **Include** (ChecklistEditor - SEO friendly) |
| `excludes` (comma input) | **Include** (ChecklistEditor - SEO friendly) |
| Card "Itinerary Perhari" lama (table `event_itineraries`) | **Itinerary** (ItineraryEditor SEO) |
| Card "🗺️ Rute Touring" (RouteEditor) | **Itinerary** (dipindah ke section atas + per-day) |

### 2. Field yang DIPERTAHANKAN di tab "Dasar"
Field operasional non-SEO (tidak duplikat):
- Title + Slug + Category + Difficulty
- Tentative toggle + Date / End Date / Tentative month
- Location + Distance
- Pricing (Sharing/Single/Couple) + Max Participants
- Hero Image (`image_url`)
- Asuransi (toggle + deskripsi)
- Towing (toggle + deskripsi + harga pergi/pulang)
- Smart Touring Finder Card (rider_level, motor_types, touring_style, jam riding, fatigue, road_condition, safety preview)
- Status (draft/upcoming/ongoing/completed)

### 3. Tab "Itinerary" — restruktur

Tambahkan **dua bagian**:

**A. Rute Touring Keseluruhan** (paling atas)
- Pindahkan `RouteEditor` (GPX upload + waypoint) ke sini
- Disimpan di `events.route_data` (tetap)

**B. Itinerary Per Hari + Rute Per Hari**
- `ItineraryEditor` extended → tiap day dapat field route opsional:
  - `route_data?: RouteData` (GPX upload mini per hari)
  - atau minimal `start_location`, `end_location`, `distance_km`, `gmaps_url`
- Disimpan di `events.itinerary` JSONB dengan struktur:
  ```ts
  { day, title, description, image_url, image_alt,
    route?: { start, end, distance_km, gmaps_url, polyline?, waypoints? } }
  ```

### 4. Rendering frontend (`EventDetail.tsx` + `ItinerarySection.tsx`)

Pastikan SEO-friendly:
- **Hapus** rendering field lama (description WYSIWYG generik, highlights chips, requirements, legacy itinerary table) — sekarang konten datang dari section SEO (opening_hook, why_join, experience, about, target_audience, trust, included/excluded checklist, itinerary baru, faq).
- **Itinerary per hari**: tiap card day tampilkan judul (H3 dengan keyword "Day N – {title}"), gambar dengan alt SEO, deskripsi, dan jika ada `route` → mini-section "Rute Hari Ini": start → end, distance, link Google Maps, mini-map (Leaflet) + Street View link.
- **Rute keseluruhan**: tetap di `RoutePreview` component, tapi posisinya sekarang inline di section Route & Itinerary (bukan section terpisah).
- Heading hierarchy tetap H1 (hero) → H2 per section → H3 per day → semua image punya `alt` keyword-rich.

### 5. Migrasi data lama (graceful)

- Tabel `event_itineraries` lama → tetap dibaca sekali saat openEdit untuk **konversi otomatis** ke `seoItinerary` jika `events.itinerary` JSONB masih kosong, lalu disimpan ke field baru. Setelah migrasi, hapus baris lama.
- Field `description`, `highlights`, `requirements`, `includes`, `excludes` di DB **tidak di-drop** (back-compat & data lama tidak hilang), hanya tidak lagi di-edit/render di frontend baru.

### 6. Files yang diubah

| File | Perubahan |
|---|---|
| `src/pages/admin/AdminEvents.tsx` | Hapus block field duplikat dari TabsContent "dasar"; pindahkan RouteEditor ke "itinerary"; hapus legacy itinerary card; bersihkan state itineraries lama |
| `src/components/admin/ItineraryEditor.tsx` | Tambah field route per-day (start, end, distance_km, gmaps_url, optional GPX) |
| `src/components/EventLanding/ItinerarySection.tsx` | Render route mini per day + heading SEO |
| `src/pages/EventDetail.tsx` | Hapus rendering description/highlights/requirements lama; pastikan RoutePreview muncul dalam Itinerary section, bukan terpisah; pastikan H2/H3 hierarchy benar |
| `src/components/admin/RouteEditor.tsx` | (opsional) varian "compact" untuk per-day |

### 7. Validasi

1. Buka admin → edit event → tab **Dasar** hanya berisi field operasional (no description/highlights/requirements/includes/excludes/itinerary lama/route).
2. Tab **Itinerary** menampilkan: (a) Route Editor keseluruhan di atas, (b) list day dengan field rute per-hari.
3. Frontend EventDetail: tidak ada lagi blok deskripsi generik / chip highlights / list requirements lama. Konten 100% dari section SEO.
4. Setiap day itinerary di frontend tampilkan rute mini jika diisi (start→end, distance, link GMaps).
5. JSON-LD `Event` + `FAQPage` tetap valid; tambahkan `subEvent` per day jika ada (bonus SEO).
6. Existing event tanpa data SEO tetap render (graceful — section tersembunyi jika kosong).
7. Lighthouse SEO ≥ 95.

### Out of scope
- Drop kolom DB lama (dilakukan nanti setelah verifikasi data tidak terpakai).
- Multi-language.

