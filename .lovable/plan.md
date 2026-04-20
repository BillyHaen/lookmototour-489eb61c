

## Share Profil Rider ke Sosial Media

Menambahkan kemampuan untuk membagikan halaman `/riders/:username` ke sosial media (WhatsApp, FB, IG, X, dll) dengan preview kartu yang menampilkan **foto profil rider**, **nama + badge**, dan **excerpt ajakan bergabung**.

### Yang akan dibangun

#### 1. Tombol "Bagikan" di header rider
Tambah tombol share di `RiderHeader.tsx`, sejajar dengan tombol Edit Profil / Follow.

Perilaku tombol:
- Di perangkat yang mendukung Web Share API (mobile) → buka native share sheet (WA, IG, FB, X, Telegram, dll)
- Di desktop → fallback dropdown berisi:
  - Salin Link
  - WhatsApp
  - Facebook
  - X (Twitter)
  - Telegram
- Setelah salin link → toast "Link profil berhasil disalin"
- Hitung share count via RPC `increment_share_count` yang sudah ada (extend untuk `content_type = 'rider'`)

URL yang dibagikan:
```
https://lookmototour.com/riders/{username}
```

Pakai prefix share `s.lookmototour.com/s/rider/{username}` agar konsisten dengan pola `ShareButton.tsx` existing dan supaya Cloudflare Worker prerender meta tag untuk crawler sosial media.

#### 2. Meta tag (Open Graph & Twitter Card) untuk preview sosmed
Update `useSeoMeta` call di `RiderProfile.tsx` agar saat di-share menghasilkan kartu kaya:

- **og:title / twitter:title**: `Riders {nama} – {badge utama} | LOOKMOTOTOUR`
- **og:description / twitter:description**:
  > Riders {nama} – {badge} ada di LOOKMOTOTOUR. Ayo gabung di platform ekosistem motor terbesar di Indonesia bersama ratusan ribu riders!
- **og:image / twitter:image**: `avatar_url` rider (fallback ke `banner_url`, fallback ke logo LookMotoTour)
- **og:image:width / height**: pastikan square 1200×1200 untuk avatar atau 1200×630 untuk banner
- **og:type**: `profile`
- **og:url**: URL kanonik `/riders/{username}`
- **twitter:card**: `summary_large_image`

Karena sebagian besar crawler sosmed tidak mengeksekusi JS, manfaatkan **Cloudflare Worker prerender** existing (`share-meta` edge function pattern) untuk meng-inject meta tag server-side saat User-Agent terdeteksi sebagai bot (FB, WA, Twitter, LinkedIn, Telegram, Slack).

#### 3. Penentuan "badge" rider untuk excerpt
Excerpt menampilkan badge utama rider. Logika prioritas:
1. Achievement tertinggi yang sudah unlocked (mis. "Veteran Touring", "1000 KM Club")
2. Jika belum ada achievement → fallback ke `riding_style` ter-label ("Adventure", "Touring", dll)
3. Jika tidak ada → fallback ke "Rider"

Diambil dari data yang sudah ada (`useUserAchievements`, `riding_style`).

#### 4. Tracking share count
- Extend tabel `share_counts` agar mendukung `content_type = 'rider'` (kolom `content_id` = `user_id` rider)
- Tampilkan jumlah share kecil di samping tombol (opsional, mengikuti pola `ShareButton.tsx`)
- RPC `increment_share_count` sudah generic, hanya perlu memastikan nilai content_type baru diterima

### File yang akan diubah / dibuat

| File | Perubahan |
|---|---|
| `src/components/rider/RiderShareButton.tsx` (baru) | Tombol share khusus rider: Web Share API + dropdown fallback (Salin, WA, FB, X, Telegram) |
| `src/components/rider/RiderHeader.tsx` | Pasang `RiderShareButton` di area actions, tampil untuk semua user (owner & visitor) |
| `src/pages/RiderProfile.tsx` | Update `useSeoMeta` dengan title/description/image kartu sosmed sesuai format excerpt |
| `src/hooks/useRider.ts` | Tambah util `buildRiderShareCopy(rider, badge)` untuk konsistensi teks share |
| `supabase/functions/share-meta/index.ts` | Tambah handler untuk path `/s/rider/{username}` agar crawler dapat meta tag yang benar (judul, deskripsi, og:image avatar) |
| Migration SQL | Pastikan CHECK constraint `share_counts.content_type` mengizinkan nilai `'rider'` |

### Detail teknis

**Format share text (untuk WA/Telegram/Twitter yang pakai text body):**
```
Riders {nama} – {badge} ada di LOOKMOTOTOUR.
Ayo gabung di platform ekosistem motor terbesar di Indonesia bersama ratusan ribu riders!

{shareUrl}
```

**Web Share API payload:**
```ts
navigator.share({
  title: `Riders ${rider.name} – ${badge}`,
  text: shareText,
  url: shareUrl,
});
```

**Deep link sosmed (fallback desktop):**
- WhatsApp: `https://wa.me/?text={encoded text + url}`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u={url}`
- X/Twitter: `https://twitter.com/intent/tweet?text={text}&url={url}`
- Telegram: `https://t.me/share/url?url={url}&text={text}`

### Validasi
1. Klik tombol Bagikan di mobile → muncul native share sheet
2. Klik di desktop → muncul dropdown 5 opsi (Salin, WA, FB, X, Telegram)
3. Salin link → toast sukses, link berformat `https://lookmototour.com/riders/{username}`
4. Tempel link di WA/Telegram → muncul preview dengan avatar rider, nama + badge, dan excerpt ajakan
5. Tempel link di Facebook debugger → kartu OG benar (judul, deskripsi, gambar)
6. Share count bertambah di tombol setelah aksi share berhasil
7. Tombol responsif di mobile (full-width di stack actions, bersanding dengan Follow/Edit di desktop)

### Dampak
- Tidak mengubah skema data utama; hanya menambah `'rider'` sebagai content_type valid di `share_counts`
- Tidak mengganggu RLS — profil rider sudah publik via RPC `get_rider_public_profile`
- Cloudflare Worker prerender sudah ada → cukup tambah route handler untuk rider

