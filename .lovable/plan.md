

## Fitur: Event Tanggal Tentative + Tombol "Saya Minat Trip Ini!"

### Konsep
- Admin bisa buat event tanpa tanggal pasti, cukup pilih **bulan & tahun** (tentative)
- Selama tanggal belum fix, tombol registrasi berubah menjadi **"Saya Minat Trip Ini!"**
- Klik tombol minat → simpan data peminat ke tabel baru `event_interests`
- Admin bisa lihat jumlah & daftar peminat di dashboard
- Setelah admin set tanggal fix → tombol otomatis berubah ke "Daftar Sekarang" seperti biasa

### Perubahan

#### 1. Database Migration
- Tambah kolom `tentative_month` (text, nullable) di tabel `events` — format "2026-07" untuk bulan tentative
- Buat tabel baru `event_interests`:
  - `id` (uuid, PK)
  - `event_id` (uuid, NOT NULL)
  - `user_id` (uuid, NOT NULL)
  - `name` (text)
  - `phone` (text)
  - `created_at` (timestamptz)
  - Unique constraint on (event_id, user_id)
- RLS: authenticated users can insert own, view own; admins can view all

#### 2. Admin Events (`AdminEvents.tsx`)
- Tambah toggle "Tanggal Tentative" — jika aktif, field tanggal berubah jadi picker bulan/tahun saja, dan kolom `date` di-set ke awal bulan sebagai placeholder
- Tampilkan badge "📅 Tentative" di list event admin
- Tambah tombol untuk melihat **daftar peminat** (mirip tombol peserta yang sudah ada)
- Buat komponen `AdminEventInterests` untuk menampilkan tabel peminat + jumlah total

#### 3. EventRegistrationForm (`EventRegistrationForm.tsx`)
- Cek apakah event tentative: `event.tentative_month && event.tentative_month !== ''`
- Jika tentative → tampilkan tombol "🙋 Saya Minat Trip Ini!" (bukan form registrasi)
- Klik → simpan ke `event_interests` (nama & phone dari profil user, atau prompt sederhana)
- Jika sudah pernah klik → tampilkan "✅ Anda Sudah Menyatakan Minat"
- Jika bukan tentative → tampilkan form registrasi seperti biasa

#### 4. EventCard & EventDetail
- Jika tentative, tampilkan bulan saja: "Juli 2026 (Tentative)" bukan tanggal lengkap
- Badge "Tentative" di EventCard

#### 5. Data Constants (`events.ts`)
- Tambah helper `formatTentativeMonth(month: string)` → "Juli 2026"

### File yang Akan Diubah
1. **Database migration** — kolom `tentative_month` + tabel `event_interests` + RLS
2. `src/pages/admin/AdminEvents.tsx` — toggle tentative, lihat peminat
3. `src/pages/admin/AdminEventInterests.tsx` — komponen baru untuk daftar peminat
4. `src/components/EventRegistrationForm.tsx` — logika tombol minat vs registrasi
5. `src/components/EventCard.tsx` — tampilkan bulan tentative
6. `src/pages/EventDetail.tsx` — tampilkan bulan tentative
7. `src/data/events.ts` — helper format bulan

