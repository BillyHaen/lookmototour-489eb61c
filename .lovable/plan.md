

## Admin Override: Badge, Jumlah Trip, dan Jumlah KM

Memberi admin kemampuan untuk meng-override stat rider (`total_trips`, `total_km`, `trust_score` / badge tier) tanpa harus mengikuti trip. Tetap aman: hanya admin, dan auto-recalc biasa tidak menimpa nilai override.

### Konsep
Tambahkan "manual override" di tabel `profiles`. Saat override aktif, fungsi `recalc_rider_stats` akan **menghormati** nilai override dan tidak menimpanya. Admin juga bisa unlock achievement (badge) secara manual.

### Perubahan database

**1. Tambah kolom override di `profiles`:**
- `override_total_trips` (int, nullable)
- `override_total_km` (numeric, nullable)
- `override_trust_score` (int, nullable)
- `override_updated_by` (uuid, nullable) — admin yang terakhir mengubah
- `override_updated_at` (timestamptz, nullable)

Logikanya: jika kolom override tidak NULL → nilai itulah yang tampil. Jika NULL → pakai hasil hitung otomatis.

**2. Update `recalc_rider_stats(_user_id)`** agar:
- hanya menulis `total_trips`, `total_km`, `trust_score` jika kolom override-nya NULL
- jika override aktif, nilai override dipakai untuk evaluasi unlock achievement (sehingga admin bisa "memberikan" Road Warrior, dst.)

**3. Update `get_rider_public_profile`** agar mengembalikan nilai final (override jika ada, else nilai hitung) — agar `/riders/:username`, share-meta, dan badge tampil benar.

**4. RLS profiles**: kolom override hanya bisa diubah admin. Karena policy update existing `(user_id = auth.uid())` membolehkan user edit profil sendiri, kita tambah trigger `BEFORE UPDATE` yang menolak perubahan kolom `override_*` jika bukan admin. User biasa tetap bisa edit nama/bio/dll seperti biasa.

**5. RPC `admin_set_rider_overrides`** (security definer, admin-only):
```
admin_set_rider_overrides(
  _user_id uuid,
  _trips int,            -- null = clear override
  _km numeric,           -- null = clear override
  _trust_score int,      -- null = clear override
  _achievement_codes text[]  -- list achievement yang ingin diunlock manual
)
```
- set kolom override
- insert ke `user_achievements` untuk kode yang dipilih (ON CONFLICT DO NOTHING)
- panggil `recalc_rider_stats(_user_id)` untuk sinkron
- catat audit log

**6. RPC `admin_revoke_achievement(_user_id, _code)`** untuk hapus achievement yang salah diberikan.

### Perubahan UI Admin

**File:** `src/pages/admin/AdminUsers.tsx` (dialog detail user yang sudah ada)

Tambah section baru di dalam dialog detail: **"Override Rider Stats (Admin)"**, hanya tampil jika user login adalah admin (sudah dijamin oleh route admin):

- Input "Jumlah Trip (override)" — kosong = pakai otomatis
- Input "Jumlah KM (override)" — kosong = pakai otomatis
- Input "Trust Score (override)" — kosong = pakai otomatis, dengan helper text "0–99 New Rider, 100–299 Trusted, 300+ Pro"
- Multi-select achievement (badge) dari katalog `achievements` table — admin bisa centang badge yang ingin diberikan secara manual
- Tombol **Simpan Override** → panggil `admin_set_rider_overrides`
- Tombol **Reset ke Otomatis** → panggil RPC dengan semua param NULL & `_achievement_codes = '{}'`
- Daftar achievement aktif user dengan tombol "Hapus" (panggil `admin_revoke_achievement`)
- Indikator visual jika nilai sedang dalam mode override (badge "Manual" di samping angka)

### Perubahan frontend lain

| File | Perubahan |
|---|---|
| `src/hooks/useRider.ts` | Tidak perlu — RPC `get_rider_public_profile` sudah disesuaikan di DB |
| `supabase/functions/share-meta/index.ts` | Tidak perlu — sudah memakai data dari profiles via RPC |
| `src/components/UserBadge.tsx` | Tidak perlu — badge dihitung dari `total_trips` (yang sekarang sudah merefleksikan override) |
| `src/integrations/supabase/types.ts` | Auto-generate setelah migration |

### Validasi
1. Login sebagai admin → buka `/admin/users` → klik user → muncul section "Override Rider Stats"
2. Set override trips=20, km=5000, trust=350, centang badge "Road Warrior" → Simpan
3. Buka `/riders/{username}` user tsb → angka & badge tampil sesuai override (tanpa user pernah ikut trip)
4. Login sebagai user biasa → coba PATCH kolom `override_*` via Supabase client → ditolak oleh trigger
5. Klik "Reset ke Otomatis" di admin → nilai kembali ke hasil kalkulasi otomatis
6. Tambah/hapus achievement manual → langsung tampil/hilang di profil rider
7. Audit log mencatat siapa admin yang melakukan override dan kapan

### Dampak & keamanan
- Hanya admin yang bisa mengubah override (dijaga 2 lapis: trigger DB + RPC security definer)
- User biasa tetap bisa edit field profil mereka sendiri seperti sebelumnya
- Trigger auto-recalc dari registrasi event tidak lagi menimpa override
- Tidak mengubah skema yang dipakai komponen existing — angka tetap diambil dari kolom yang sama (`total_trips`, `total_km`, `trust_score`)

