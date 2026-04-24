
# Revamp Halaman Profile → Dashboard Bento-Grid Modern

## Tujuan
Mengubah `src/pages/Profile.tsx` dari layout single-column panjang menjadi dashboard 2-kolom (70/30) dengan hero header, stat cards, tabs system, dan sidebar — aesthetic putih + slate-gray + deep blue (primary brand).

## Struktur Baru

### A. Hero Header (full width)
- Avatar besar (96px) di kiri dengan `AvatarUpload` (tetap pakai komponen yang ada).
- Nama user + badge "Verified" (kalau ada `username` valid) atau "Pro Member" (kalau confirmed events ≥ 5).
- Username `@handle` + tombol "Lihat Profil Publik" → `/riders/{username}`.
- Stat cards horizontal di kanan (3 kotak `rounded-xl shadow-sm`):
  - **Kredit Saya** (Wallet icon) → balance dari `useWalletBalance`.
  - **Total Events** (CalendarDays icon) → `confirmedCount`.
  - **Live Tracking** (Navigation icon) → jumlah `activeSessions`, dengan dot pulse hijau bila > 0.
- Tombol "Logout" di pojok kanan atas (ghost variant).

### B. Layout 2 Kolom
- Container `max-w-6xl` (lebih lebar dari current 3xl).
- Grid: `lg:grid-cols-[1fr_340px] gap-6`.

### C. Kolom Kiri (Main, 70%) — Tabs System
Pakai `@/components/ui/tabs`. 4 tab:

1. **Aktivitas** (default)
   - Card "Badge Saya" (kalau ada) — pakai logic `BADGES` existing.
   - Card "Sponsor untuk Saya" → `<RecommendedSponsors limit={4} />`.

2. **Sewa Gear**
   - Grid `sm:grid-cols-2` rental cards.
   - Komponen baru `RentalCard` (inline atau file terpisah `src/components/profile/RentalCard.tsx`):
     - Image kiri (64px square `rounded-lg`).
     - Nama produk + vendor.
     - Status badge berwarna (pending=outline, confirmed=secondary, picked_up=default biru, returned=hijau muted, cancelled=destructive).
     - Tanggal sewa + qty + total price.
     - Tombol "Detail" (ghost sm) → buka dialog atau link ke event/produk.
   - Empty state ramah bila kosong.

3. **Riwayat Pendaftaran**
   - List bersih (bukan card tebal): row dengan border-bottom, tanggal kiri, judul event tengah, status + payment badge kanan, tombol "View Ticket" (link ke `/events/{slug}`).
   - Update query `my-registrations` untuk `select` field `slug` dari `events` agar bisa link.
   - Tetap support tombol "Tulis Testimoni" untuk completed events (logic existing dipindah ke sini).

4. **Pengaturan**
   - Form profil existing (name, username, phone, riding_style, location, bio) dipindah ke sini.
   - Tombol "Simpan" high-contrast `bg-primary` deep blue.
   - Tambah link kecil "Ganti banner / avatar" mengarah ke field upload (avatar di hero, banner di pengaturan).

### D. Kolom Kanan (Sidebar, 30%)
Stack vertical, sticky `lg:sticky lg:top-24`:

1. **Live Tracking Widget**
   - Card `rounded-xl shadow-sm` border-primary/20.
   - Icon Navigation dengan pulse dot bila ada sesi aktif (`relative` + `animate-ping`).
   - Teks "{n} sesi aktif" atau "Belum ada sesi tracking".
   - Tombol primary "Kelola Sesi" → `/tracking/manage`.

2. **Wallet Compact**
   - Versi ringkas `WalletCard`: hanya saldo besar + tombol "Lihat Riwayat" yang expand inline (atau buka Dialog).
   - Bisa reuse `WalletCard` apa adanya untuk simplicity (komponen sudah self-contained).

3. **Sponsor Deals Highlight**
   - Card dengan `bg-gradient-to-br from-primary/10 via-accent/10 to-background`.
   - Icon Gift, judul "Deals Eksklusif", subtitle 1 baris, tombol "Lihat Semua" → `/sponsor-deals`.

## Komponen Baru (file terpisah, kecil & focused)
- `src/components/profile/ProfileHero.tsx` — header + stat cards.
- `src/components/profile/StatCard.tsx` — reusable kotak stat (icon, label, value, optional pulse).
- `src/components/profile/RentalCard.tsx` — kartu rental.
- `src/components/profile/RegistrationRow.tsx` — row pendaftaran.
- `src/components/profile/LiveTrackingWidget.tsx` — sidebar tracking.
- `src/components/profile/SponsorDealsCard.tsx` — sidebar deals card.

`Profile.tsx` di-rewrite menjadi shell yang merangkai komponen-komponen di atas + form di tab Pengaturan. Form logic (react-hook-form + zod + mutation) **dipertahankan persis** seperti sekarang, hanya dipindah lokasi render-nya.

## Data & Hooks
- Tetap pakai: `useMyProfile`, `useAuth`, `useMyTrackingSessions`, `useMyRentals`, `useWalletBalance`, query `my-registrations`.
- Update query `my-registrations` untuk include `slug` di select events.
- Tidak ada perubahan database / RLS / migration.

## Styling Rules
- Semua card: `rounded-xl shadow-sm border border-border bg-card`.
- Spacing antar section: `space-y-6` di main, `space-y-4` di sidebar.
- Stat cards: `rounded-xl bg-gradient-to-br from-primary/5 to-transparent` border-primary/20.
- Badge status rental pakai class warna eksplisit (emerald/amber/blue/red).
- Tetap mobile-first: di mobile, sidebar pindah ke bawah main (`grid-cols-1`), tabs scroll horizontal bila perlu (`overflow-x-auto`).
- Pakai Lucide icons: User, Wallet, Package, Map/Navigation, Gift, CalendarDays, Award, Settings, Ticket.

## Yang TIDAK Diubah
- `useMyProfile`, `useWallet*`, `useGearRentals`, `useTrackingSession`, `WalletCard`, `RecommendedSponsors`, `AvatarUpload`, `BannerUpload`.
- Schema database, RLS, edge functions.
- Routing — tetap `/profile`.
- Header `Navbar` / `Footer` global.

## QA Checklist Sesudah Build
- Tabs aktif dengan keyboard.
- Mobile (<768px): single column, hero stack vertical, stat cards jadi 3 kolom kecil 1 baris.
- Desktop (≥1024px): 2 kolom 70/30, sidebar sticky.
- Empty states untuk: no rentals, no registrations, no tracking sessions.
- Form Pengaturan tetap save & invalidate query yang sama.
- Tidak ada regression pada link ke `/riders/:username`, `/tracking/manage`, `/sponsor-deals`.

Setelah plan ini disetujui, implementasi dilakukan dalam 1 batch edit (rewrite `Profile.tsx` + create 6 file komponen baru).
