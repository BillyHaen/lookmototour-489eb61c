

## 🛡️ Safety Score System — Implementation Plan

### Konsep

Safety Score adalah **skor kalkulasi otomatis (1–10)** yang dihitung dari kombinasi data event yang sudah ada + 2 field baru. Admin TIDAK input safety score secara manual — sistem menghitungnya.

### Formula

```text
Safety Score = 10 - weighted_penalties

Komponen (bobot):
1. Road Condition (NEW field, 1-5)     → bobot 30%
2. Difficulty (EXISTING: mudah/sedang/sulit) → bobot 25%  ← REUSE, bukan duplikasi
3. Fatigue Level (EXISTING: 1-5)       → bobot 25%
4. Distance penalty (EXISTING)         → bobot 20%
   - <100km = 0, 100-300km = 1, 300-500km = 2, >500km = 3

Contoh: Road=2, Difficulty=sedang(2), Fatigue=3, Distance=350km(2)
Penalty = (2/5)*3 + (2/3)*2.5 + (3/5)*2.5 + (2/3)*2 = 1.2+1.67+1.5+1.33 = 5.7
Score = 10 - 5.7 = 4.3 → dibulatkan 4
```

### Field Baru di Tabel `events`

Hanya **1 kolom baru**:
- `road_condition` (integer, default 3, range 1–5): 1=Aspal mulus, 2=Aspal biasa, 3=Aspal rusak ringan, 4=Off-road, 5=Extreme trail

**Cuaca**: Tidak disimpan di DB karena berubah terus. Ditampilkan sebagai info tambahan via API cuaca gratis (opsional, fase 2). Safety Score dihitung dari data statis yang bisa dikontrol admin.

### Perubahan yang Direncanakan

**1. Database Migration**
- Tambah kolom `road_condition INTEGER DEFAULT 3` ke tabel `events`

**2. Utility Function (client-side)**
- Buat `calculateSafetyScore(event)` di `src/data/events.ts`
- Return: `{ score: number, level: 'aman'|'waspada'|'hardcore', color: string, breakdown: {...} }`
- Hijau (7-10) = Aman/Santai, Kuning (4-6) = Waspada/Moderate, Merah (1-3) = Hardcore

**3. Safety Score Badge di EventCard**
- Tambah badge kecil di pojok kanan atas card: shield icon + angka + warna
- Contoh: 🛡️ 8.2 (hijau) atau 🛡️ 3.5 (merah)

**4. Safety Score Panel di EventDetail**
- Card baru di bawah "Info Touring" dengan breakdown visual:
  - Radar/bar chart kecil menunjukkan 4 komponen
  - Overall score besar dengan warna
  - Label: "Trip ini tergolong [AMAN/WASPADA/HARDCORE]"
  - Tips keselamatan berdasarkan skor (misal: "Bawa jas hujan" jika road_condition buruk)

**5. Admin Form**
- Tambah input `Road Condition` (slider 1-5) di form create/edit event
- Safety Score preview otomatis di form agar admin bisa lihat hasilnya

**6. Filter di halaman Events**
- Tambah filter "Safety Level" (Aman / Waspada / Hardcore) — ini MENGGANTIKAN kebutuhan filter difficulty yang sudah ada, atau bisa jadi pelengkap

### Yang TIDAK Dibuat (Menghindari Duplikasi)

- **Tidak** menambah field "medan ekstrem" — sudah di-cover oleh `difficulty` + `road_condition`
- **Tidak** menambah field "jarak tempuh" baru — sudah ada `distance`
- **Tidak** menambah field fatigue baru — sudah ada `fatigue_level`
- **Tidak** input manual safety score — dikalkulasi otomatis

### Visual Preview

```text
┌─────────────────────────────────┐
│  🛡️ Safety Score                │
│                                 │
│       ██████████  8.2           │
│       ███████░░░  AMAN          │
│                                 │
│  Kondisi Jalan  ████░  4/5      │
│  Medan          ██░░░  2/5      │
│  Tingkat Capek  ███░░  3/5      │
│  Jarak Tempuh   █░░░░  1/5      │
│                                 │
│  ✅ Trip ini tergolong AMAN     │
│  💡 Cocok untuk semua level     │
└─────────────────────────────────┘
```

### File yang Akan Diubah

| File | Perubahan |
|---|---|
| Migration SQL | Tambah `road_condition` ke `events` |
| `src/data/events.ts` | Tambah `calculateSafetyScore()`, konstanta label |
| `src/components/EventCard.tsx` | Badge safety score |
| `src/pages/EventDetail.tsx` | Panel safety score dengan breakdown |
| `src/pages/admin/AdminEvents.tsx` | Input road_condition + preview score |
| `src/pages/Events.tsx` | Filter safety level (opsional) |

### Fase 2 (Opsional, Nanti)

- Integrasi cuaca real-time via API untuk menambah faktor cuaca ke skor
- Safety score history jika route berubah musiman

