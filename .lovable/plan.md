

## Redesign Halaman Rider — Facebook-style Cover & Profile Header

Mengubah `/riders/:username` agar mengikuti pola layout cover + profile Facebook dari screenshot referensi.

### Perubahan visual

**1. Cover Banner (Foto Sampul)**
- Banner full-width edge-to-edge (no rounded di mobile, rounded-b-xl di desktop tetap), tinggi lebih dominan: mobile `aspect-[16/9]` (640×360), desktop `aspect-[2.6/1]` max-h `~360px` — sudah sesuai.
- Tombol **"Edit Foto Sampul"** (putih, dengan ikon kamera) overlay di **pojok kanan-bawah banner** — hanya tampil jika `isOwner`. Klik → buka file picker → masuk ke `BannerCropDialog` (zoom + crop sudah ada).
- Saat hover (desktop) overlay gelap halus muncul di seluruh banner sebagai indikator klikable bagi owner.

**2. Avatar (Foto Profil)**
- Avatar bulat besar (mobile 112px / desktop 144px) dengan **ring putih tebal 4px**, posisi **overlap banner** (-mt-14 mobile / -mt-16 desktop), align kiri (di mobile dan desktop), bukan center.
- Tombol kamera kecil bulat (badge) di **pojok kanan-bawah avatar** — hanya untuk owner. Klik → buka `AvatarCropDialog` (zoom + crop sudah ada).
- Hover state pada avatar dihilangkan — diganti badge kamera permanen agar konsisten dengan FB.

**3. Info Block (di samping avatar pada desktop, di bawah pada mobile)**
- Layout desktop: `flex-row` — avatar kiri, info di tengah (nama + meta), tombol aksi (Follow / Edit Profil) di **kanan**.
- Layout mobile: `flex-col` — avatar kiri di atas, nama + meta di bawah avatar, tombol aksi full-width di paling bawah.
- Nama: `font-bold text-2xl sm:text-3xl`, baris berikutnya counter: **"{follower_count} pengikut · {following_count} mengikuti"** (format ringkas: 1,4 rb dst via helper `Intl.NumberFormat('id-ID', { notation: 'compact' })`).
- Baris bio singkat (jika ada).
- Baris meta dengan ikon kecil: `riding_style`, `location` (gunakan ikon Bike & MapPin yang sudah ada).
- **TrustBadge** dipindah ke samping nama (inline, kecil).

**4. Tombol aksi**
- Owner: **Edit Profil** (variant default solid, ikon Pencil) → link ke `/profile`.
- Visitor login: **Follow / Following** (FollowButton existing) + tombol **Message** (variant outline, ikon MessageSquare) — placeholder, disable jika DM belum tersedia, atau buka WhatsApp jika nomor publik (skip untuk sekarang, hanya Follow).
- Spacing: `gap-2`, di mobile turun ke baris baru, full width grid 2 kolom.

**5. Separator**
- Tambahkan garis pemisah halus (`border-b`) di bawah header sebelum stat bar, mengikuti pola FB.

### File yang diubah

| File | Perubahan |
|---|---|
| `src/components/rider/RiderHeader.tsx` | Restruktur layout cover+avatar+info ala FB; tambahkan tombol "Edit Foto Sampul" overlay di banner; badge kamera di avatar; counter pengikut/mengikuti; layout responsif baru. |
| `src/components/AvatarUpload.tsx` | Tambah prop `variant?: 'overlay' \| 'badge'`. Mode `badge` menampilkan tombol kamera kecil permanen di pojok kanan-bawah avatar (bukan overlay hover). |
| `src/components/BannerUpload.tsx` | Tambah prop `variant?: 'card' \| 'inline'`. Mode `inline` hanya merender tombol "Edit Foto Sampul" + dialog (tanpa preview area), karena banner sudah dirender oleh `RiderHeader`. |
| `src/components/rider/RiderHeader.tsx` (baru terima `isOwner` prop) | Komposisi `BannerUpload variant="inline"` + `AvatarUpload variant="badge"` saat `isOwner=true`. |
| `src/pages/RiderProfile.tsx` | Pass `isOwner` ke `RiderHeader`. |

### Catatan teknis

- Tetap pakai `react-easy-crop` (sudah terpasang) untuk avatar & banner.
- Format counter pakai `Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })` → "1,4 rb", "12 jt".
- Variant lama `BannerUpload` (card) tetap dipertahankan untuk `Profile.tsx` agar tidak rusak.
- Variant lama `AvatarUpload` (overlay hover) tetap default; halaman lain tidak terpengaruh.
- Tidak ada perubahan database/RLS.

### Validasi

1. Visitor (belum login / bukan owner): tidak ada tombol Edit Sampul / kamera avatar, hanya tombol Follow.
2. Owner: tombol "Edit Foto Sampul" di pojok kanan-bawah banner; badge kamera di avatar; klik → dialog crop dengan zoom in/out berfungsi.
3. Mobile (375px): avatar overlap banner, info stack vertikal, tombol Edit Profil full-width.
4. Desktop: layout 3-kolom horizontal (avatar | info | actions) seperti FB.
5. Counter "1,4 rb pengikut · 3,2 rb mengikuti" tampil dengan format Indonesia.
6. Refresh halaman → banner & avatar tetap tampil (cache-busting `?t=` sudah ada).

