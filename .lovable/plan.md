

## Review: Smart Touring Finder

### Yang Sudah Ada

| Fitur | Status |
|-------|--------|
| Search teks (judul/lokasi) | Ada |
| Filter kategori (Touring, Adventure, Race, Gathering, Workshop) | Ada |
| Filter status (Akan Datang, Berlangsung, Selesai) | Ada |
| Sort tanggal & harga | Ada |
| Difficulty (mudah/sedang/sulit) | Ada di EventCard, tapi **tidak bisa difilter** |
| Jarak total | Ada di EventCard & EventDetail |
| Estimasi jam riding per hari | Tidak ada |
| Tingkat capek (visual bar) | Tidak ada |
| Filter level rider | Tidak ada |
| Filter tipe motor | Tidak ada |
| Filter style touring | Tidak ada |

### Yang Perlu Ditambahkan

Fitur ini membutuhkan **2 bagian**: perubahan database (kolom baru) + perubahan UI (filter & tampilan).

---

### 1. Database Migration -- Tambah Kolom Baru di Tabel `events`

```sql
ALTER TABLE public.events
  ADD COLUMN rider_level text NOT NULL DEFAULT 'all',
  ADD COLUMN motor_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN touring_style text NOT NULL DEFAULT 'adventure',
  ADD COLUMN riding_hours_per_day numeric(3,1) NOT NULL DEFAULT 0,
  ADD COLUMN fatigue_level integer NOT NULL DEFAULT 1;
```

Penjelasan kolom:
- `rider_level`: 'beginner' | 'intermediate' | 'hardcore' | 'all'
- `motor_types`: array, misalnya `{'sport','adv','cruiser'}`
- `touring_style`: 'santai' | 'adventure' | 'luxury' | 'spiritual'
- `riding_hours_per_day`: estimasi jam riding per hari (misal 4.5)
- `fatigue_level`: 1-5 (ditampilkan sebagai visual bar)

### 2. Admin Events -- Tambah Input Kolom Baru

Di `AdminEvents.tsx`, tambahkan field form untuk:
- Rider Level (Select: Semua / Beginner / Intermediate / Hardcore)
- Tipe Motor (multi-checkbox: Sport, ADV, Cruiser, Matic, Bebek)
- Style Touring (Select: Santai, Adventure, Luxury, Spiritual)
- Jam Riding per Hari (number input)
- Tingkat Capek (slider 1-5)

### 3. Events Page -- Smart Filter UI

Di `Events.tsx`, tambahkan filter baru:
- **Filter Difficulty** (badge pills: Mudah / Sedang / Sulit) -- sudah ada datanya, tinggal jadikan filter
- **Filter Rider Level** (badge pills: Beginner / Intermediate / Hardcore)
- **Filter Tipe Motor** (badge pills: Sport / ADV / Cruiser / Matic)
- **Filter Style Touring** (badge pills: Santai / Adventure / Luxury / Spiritual)
- Semua filter menggunakan pola badge yang sama seperti filter kategori yang sudah ada

### 4. EventCard -- Tampilkan Info Tambahan

Di `EventCard.tsx`, tambahkan:
- Estimasi jam riding per hari (icon Clock + "4.5 jam/hari")
- Tingkat capek sebagai visual progress bar mini (menggunakan warna gradient hijau-kuning-merah)

### 5. EventDetail -- Tampilkan Info Lengkap

Di `EventDetail.tsx`, tambahkan di info grid:
- Jam riding per hari
- Tingkat capek (visual bar besar + label)
- Rider level badge
- Tipe motor yang cocok (badge list)
- Style touring

### File yang Akan Diubah

1. **Database migration** -- tambah 5 kolom baru
2. `src/pages/admin/AdminEvents.tsx` -- form input kolom baru
3. `src/pages/Events.tsx` -- tambah filter baru
4. `src/components/EventCard.tsx` -- tampilkan info tambahan
5. `src/pages/EventDetail.tsx` -- tampilkan info lengkap
6. `src/data/events.ts` -- tambah konstanta untuk filter options

