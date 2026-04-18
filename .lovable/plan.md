

## 📍 Live Tracking Touring — Implementation Plan

### Keputusan Berdasarkan Diskusi

| Aspek | Pilihan |
|---|---|
| Pendekatan | **Hybrid** — Fase 1: Google Maps share link, Fase 2: custom GPS tracking |
| Eligibility | **Hanya peserta confirmed** di event_registrations |
| Visibility | **Hanya keluarga yang ditambahkan** (per-recipient unique link) |

### Konsep Fase 1

Peserta share link Google Maps Live Location → app simpan link → peserta tambah anggota keluarga (nama + WA) → sistem generate **link unik per keluarga** → keluarga buka link → lihat halaman tracking branded LookMotoTour (embed Google Maps + info event + ETA dari Google + tombol kontak darurat).

### Database Schema (Fase 1)

**Tabel `tracking_sessions`** — sesi tracking aktif per peserta per event
```sql
- id (uuid)
- event_id (uuid, FK events)
- user_id (uuid, peserta)
- google_maps_url (text) — link share dari Google Maps
- status (text: 'active' | 'ended')
- started_at (timestamp)
- ended_at (timestamp, nullable)
- expires_at (timestamp) — auto-stop berdasarkan event end_date
- notes (text, optional)
```

**Tabel `tracking_recipients`** — daftar keluarga yang dishare
```sql
- id (uuid)
- session_id (uuid, FK tracking_sessions)
- name (text) — "Istri", "Ibu", dll
- phone (text) — WA untuk auto-send link
- access_token (text, unique) — random token untuk URL public
- last_accessed_at (timestamp, nullable)
- created_at (timestamp)
```

**RLS Policies**:
- `tracking_sessions`: User CRUD own session (with check user is confirmed in event_registrations); admin view all
- `tracking_recipients`: User manage recipients of own sessions; **public SELECT by access_token** (untuk halaman keluarga)
- Function `get_tracking_by_token(token)` SECURITY DEFINER untuk fetch session+event data dari token tanpa expose user_id

### Validasi Eligibility

Sebelum start tracking, cek:
```sql
EXISTS (
  SELECT 1 FROM event_registrations
  WHERE user_id = auth.uid() 
    AND event_id = ?
    AND status = 'confirmed'
)
```
Tanpa ini, INSERT ditolak via RLS check expression.

### Routes Baru

| Route | Akses | Fungsi |
|---|---|---|
| `/tracking/start/:eventId` | Auth (peserta confirmed) | Form: paste Google Maps link + add recipients |
| `/tracking/manage` | Auth | List sesi aktif user, tombol stop, manage recipients |
| `/track/:token` | **Public** | Halaman keluarga: embed Google Maps + info event + ETA + tombol WA emergency |

### UI Components Baru

```text
src/
├── pages/
│   ├── TrackingStart.tsx        ← form start tracking + add recipients
│   ├── TrackingManage.tsx       ← dashboard sesi aktif user
│   └── TrackPublic.tsx          ← halaman keluarga (NO navbar, branded simple)
├── components/
│   ├── tracking/
│   │   ├── GoogleMapsLinkForm.tsx     ← input + tutorial cara dapat link
│   │   ├── RecipientManager.tsx       ← add/remove keluarga + share via WA
│   │   ├── TrackingStatusBadge.tsx    ← active/ended indicator
│   │   └── HowToShareLocation.tsx     ← step-by-step modal panduan
└── hooks/
    └── useTrackingSession.ts    ← logic CRUD sesi
```

### UI Integration Existing

**EventDetail.tsx** (untuk peserta confirmed):
- Tambah card hijau "📍 Mulai Live Tracking" → CTA ke `/tracking/start/:eventId`
- Hanya muncul jika user ada di event_registrations dengan status confirmed
- Hanya muncul saat tanggal event ≤ today ≤ end_date (window aktif)

**Profile.tsx**:
- Tambah section "Sesi Tracking Aktif" → list + link ke manage

**Navbar.tsx**:
- Tambah indicator kecil 🟢 "Tracking Aktif" jika user punya sesi active (klik → /tracking/manage)

**Admin AdminEvents.tsx** (Fase 1.5, opsional):
- Per event, tab baru "Live Tracking" — admin lihat semua peserta yang aktif share lokasi (peace of mind untuk admin yang lead trip)

### Halaman Public `/track/:token` (untuk Keluarga)

Layout simple, mobile-first, NO navbar lookmototour standar:

```text
┌─────────────────────────────────┐
│ 🏍️ LookMotoTour                  │
│                                 │
│ [Nama Peserta] sedang touring   │
│ 📅 Event: Bromo Sunrise Ride    │
│ 📍 Tujuan: Bromo, Jatim         │
│ ⏱️ Mulai: 14 Apr 06:00          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  [Google Maps iframe embed] │ │ ← live location dari Google
│ │  300px height               │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🟢 Status: Tracking Aktif       │
│ Update terakhir: 2 menit lalu   │
│                                 │
│ [📞 Hubungi Admin Trip]         │ ← WA admin event
│ [💬 Chat Peserta]               │ ← WA peserta langsung
│                                 │
│ Powered by LookMotoTour         │
└─────────────────────────────────┘
```

Jika `status = 'ended'`: Replace map dengan card "✅ Trip Selesai dengan Selamat".  
Jika `expires_at` lewat: Token tidak lagi valid → halaman "Link sudah tidak aktif".

### Auto-Send Link ke Keluarga

Saat tambah recipient (nama + WA), generate WhatsApp deep link:
```
https://wa.me/{phone}?text=Halo {name}, ini link untuk track perjalanan touring saya: {public_url}
```
User tap → buka WA → tinggal kirim. Tidak butuh integrasi WA Business API.

### Auto-Expiry Logic

`expires_at` di-set otomatis = `event.end_date + 24 jam` saat create session.
Halaman public cek `expires_at < now()` → tampilkan "Link expired".
Optional: cron edge function harian untuk soft-end session yang expired (set status='ended').

### Anti-Duplikasi vs Fitur Existing

| Fitur | Konflik? | Catatan |
|---|---|---|
| Safety Score | ❌ Tidak | Pre-trip prediksi vs realtime status |
| Route Preview | ❌ Tidak | Rencana rute vs aktual lokasi |
| Notifications | ✅ Sinergi | Notif admin saat peserta start tracking |
| event_registrations | ✅ Sinergi | Source eligibility |
| ShareButton | ❌ Tidak | Itu share konten, ini share lokasi |
| Profile | ✅ Extend | Tambah section tracking |

### Yang TIDAK Dibuat (Hindari Over-Engineering Fase 1)

- ❌ Tidak parsing/scrape lokasi dari Google Maps URL (Google tidak expose API public, cukup embed iframe)
- ❌ Tidak hitung ETA sendiri (Google sudah kasih di iframe-nya)
- ❌ Tidak push notification real-time ke keluarga (Fase 2 saja)
- ❌ Tidak background GPS tracking (itu Fase 2)
- ❌ Tidak integrasi WA Business API (cukup wa.me deep link)

### Dependencies

**Tidak ada package baru.** Semua bisa pakai stack existing:
- Leaflet (sudah ada) — TIDAK dipakai di Fase 1, hanya untuk Fase 2
- Google Maps embed via iframe (no SDK, no API key)
- Supabase Realtime (sudah ada) — untuk update status session ke admin dashboard

### File yang Akan Dibuat/Diubah

| File | Aksi |
|---|---|
| Migration SQL | NEW — `tracking_sessions` + `tracking_recipients` + RLS + RPC `get_tracking_by_token` |
| `src/pages/TrackingStart.tsx` | NEW |
| `src/pages/TrackingManage.tsx` | NEW |
| `src/pages/TrackPublic.tsx` | NEW |
| `src/components/tracking/*` | NEW — 4 komponen |
| `src/hooks/useTrackingSession.ts` | NEW |
| `src/pages/EventDetail.tsx` | Tambah CTA "Mulai Tracking" untuk peserta confirmed |
| `src/pages/Profile.tsx` | Tambah section sesi aktif |
| `src/components/Navbar.tsx` | Tambah indicator tracking aktif |
| `src/App.tsx` | Tambah 3 route baru |

### Fase 2 (Roadmap, Tidak Sekarang)

- Custom browser geolocation tracking dengan Supabase Realtime
- Multi-peserta map view (lihat seluruh rombongan dalam 1 peta)
- Geofencing alert ke admin (peserta keluar jalur > 5km)
- Battery/koneksi indicator
- Web push notification ke keluarga saat peserta sampai checkpoint

