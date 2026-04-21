
## Perbaiki preview share rider yang masih gagal

### Diagnosis
Masalah utamanya bukan di data rider. Data profil untuk `billyhn` sudah ada lengkap (nama, avatar, trust score). Yang gagal adalah jalur prerender untuk crawler sosial:

- URL publik masih mengembalikan **HTML SPA biasa**, bukan HTML dengan OG tags rider
- `share-meta` sudah punya logic untuk rider, tetapi **request produksi belum benar-benar melewati jalur itu**
- `s.lookmototour.com/s/rider/...` juga belum memberi hasil preview yang andal
- Akibatnya WhatsApp tetap membaca meta default/logo website

### Yang akan diperbaiki

#### 1. Pastikan request crawler benar-benar diproses server-side
Rapikan jalur prerender agar **dua URL ini sama-sama didukung**:
- `https://lookmototour.com/riders/:username`
- `https://s.lookmototour.com/s/rider/:username`

Worker akan:
- deteksi crawler (`WhatsApp`, `facebookexternalhit`, `Facebot`, `TelegramBot`, `Twitterbot`, dll)
- untuk path rider, ambil HTML dari `share-meta`
- kembalikan response `text/html` dengan OG meta rider
- untuk user biasa, tetap lanjut ke app seperti biasa

#### 2. Tambah dukungan route share domain yang konsisten
Saat ini tombol share memakai `s.lookmototour.com/s/rider/:username`, tapi alur ini belum cukup kuat. Akan dibuat konsisten:

- Worker menangani `/s/rider/:username`
- Untuk non-crawler, route share ini akan **redirect 302** ke `/riders/:username`
- Untuk crawler, route share ini akan langsung mengembalikan HTML OG rider

Dengan ini:
- tombol share tetap bisa pakai short/share URL
- user yang buka link tetap masuk ke halaman rider normal
- crawler mendapat meta yang benar

#### 3. Keras-kan `share-meta` untuk rider
Perbaiki output `share-meta` agar lebih aman untuk WhatsApp/FB:

- title: `Riders {nama} – {badge}`
- description: `Riders {nama} – {badge} ada di LOOKMOTOTOUR...`
- image: prioritaskan `avatar_url`, fallback `banner_url`, fallback logo
- tambahkan `og:image:secure_url`
- gunakan `twitter:card=summary_large_image`
- pastikan URL absolut HTTPS
- set cache singkat agar update avatar/nama cepat ikut berubah

#### 4. Sinkronkan tombol share rider
Rapikan `RiderShareButton` supaya:
- copy link dan native share memakai URL yang benar-benar didukung worker
- teks share konsisten dengan preview
- tidak ada mismatch antara URL yang dishare vs URL yang diprerender

#### 5. Tambahkan fallback route yang aman di app
Agar share URL tidak terasa rusak untuk manusia:
- buat route React khusus `/s/rider/:username`
- route ini cukup redirect ke `/riders/:username`

Ini jadi lapisan cadangan kalau ada request yang lolos tanpa worker.

### File yang akan diubah

| File | Perubahan |
|---|---|
| `worker/index.ts` | Perluas routing crawler untuk `/riders/:username` dan `/s/rider/:username`, plus redirect untuk non-crawler |
| `wrangler.jsonc` | Rapikan config worker/assets bila perlu agar binding dan deployment sesuai |
| `supabase/functions/share-meta/index.ts` | Keras-kan output OG/Twitter untuk rider |
| `src/components/rider/RiderShareButton.tsx` | Sinkronkan URL share yang dipakai tombol |
| `src/App.tsx` | Tambah route fallback `/s/rider/:username` |
| `src/pages/...` (route redirect sederhana) | Redirect human traffic dari short share URL ke profil rider |

### Validasi yang akan dilakukan
1. Buka:
   - `/riders/billyhn`
   - `/s/rider/billyhn`
   untuk user biasa → tetap masuk ke halaman rider normal
2. Simulasi crawler ke kedua URL → response HTML harus berisi:
   - `og:title` rider
   - `og:description` rider
   - `og:image` avatar rider
3. Pastikan image yang keluar adalah avatar Billy, bukan logo default
4. Tempel URL ke WhatsApp lagi → preview harus menampilkan:
   - avatar rider
   - nama rider
   - badge
   - excerpt
5. Uji juga share via tombol Bagikan dan copy URL langsung

### Hasil akhir
Setelah perbaikan ini, preview rider akan konsisten baik saat:
- link disalin langsung dari address bar `/riders/:username`
- link dibagikan dari tombol share
- link short share `/s/rider/:username` dipakai di WhatsApp / sosial media
