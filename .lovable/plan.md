

## Masalah yang akan diperbaiki

### 1. Email konfirmasi pendaftaran tidak terkirim
**Penyebab:** `EventRegistrationForm.tsx` belum invoke `send-transactional-email` setelah RPC `create_registration_with_rentals` sukses (wiring Fase 1 belum selesai untuk trigger ini).

**Fix:** Setelah RPC sukses, panggil `supabase.functions.invoke('send-transactional-email', ...)` dengan:
- 1× email `event-registration-confirmation` ke user (idempotency `reg-confirm-{regId}`)
- Loop per rental → 1× email `gear-rental-confirmation` per rental (idempotency `rental-confirm-{regId}-{idx}`)

### 2. Detail peserta event di admin
**a) "GRATIS" muncul untuk pembayaran 0**
- Penyebab: `formatPrice(0)` mengembalikan "GRATIS" (rule global di `src/data/events.ts`).
- Fix: di `AdminEventParticipants.tsx`, untuk field "Sudah Dibayar" gunakan formatter lokal — kalau `paid === 0` tampilkan `Rp 0` (bukan GRATIS). Field "Total Biaya" & "Sisa" tetap pakai `formatPrice` (kalau total benar-benar 0, "GRATIS" wajar).

**b) Munculkan detail sewa gear & breakdown biaya towing/sewa**
- Saat ini query rentals hanya ambil `total_price`. Ubah jadi ambil `id, qty, total_price, status, products(name, image_url)`.
- Tambah panel breakdown di tiap registrasi:
  - Biaya tier (Single/Sharing/Couple): `Rp X`
  - Biaya towing pergi (kalau ada): `Rp X`
  - Biaya towing pulang (kalau ada): `Rp X`
  - Daftar Sewa Gear (per item dengan qty + total)
  - Total: `Rp X`

**c) Sewa Gear status "belum dikonfirmasi" → ikon kuning**
- Tiap rental ditampilkan dengan badge berwarna:
  - `pending` → kuning (`bg-yellow-100 text-yellow-800`, ikon `AlertCircle` kuning)
  - `confirmed` → biru/secondary
  - `picked_up` → hijau
  - `returned` → muted
  - `cancelled` → merah

### 3. Inventori produk berubah-ubah sesuai status sewa
**Status saat ini:** RPC `get_product_availability` SUDAH menghitung `currently_rented` dari rental berstatus `confirmed` atau `picked_up`. Jadi:
- Sewa `pending` → BELUM mengurangi inventori (perlu admin konfirmasi dulu)
- Sewa `confirmed` atau `picked_up` → SUDAH mengurangi inventori (otomatis)
- Sewa `returned` atau `cancelled` → SUDAH dikembalikan ke inventori (otomatis)

**Yang perlu diperbaiki sesuai permintaan user (#3 & #4):**
- User minta: "bila produk sedang disewa/sudah di book sewa, harus mengurangi inventori". Artinya **`pending` juga harus mengurangi** (saat user submit booking). 
- Update RPC `get_product_availability` agar `currently_rented` juga termasuk `pending` (selain `confirmed` & `picked_up`).
- Saat status berubah ke `returned` atau `cancelled`, inventori otomatis kembali (sudah berjalan via filter status di RPC).

**#4 (Admin Kelola Produk):** Di `AdminProducts.tsx`, tampilkan inventori dinamis (Total / Disewa / Tersedia) memakai RPC `get_product_availability`, sama seperti `ProductCard`. Saat ini cuma tampil `Inventori: X • Terjual: Y`. Tambah: `Disewa: Z • Sisa Tersedia: W`.

## Files yang diubah

| File | Perubahan |
|---|---|
| `src/components/EventRegistrationForm.tsx` | Invoke `send-transactional-email` setelah RPC sukses (registration + per-rental loop) |
| `src/pages/admin/AdminEventParticipants.tsx` | Query rentals lengkap (`status`, `products(name, image_url)`), panel breakdown biaya, badge status rental berwarna kuning untuk pending, formatter lokal untuk "Sudah Dibayar" |
| `src/pages/admin/AdminProducts.tsx` | Fetch availability per product (via RPC), tampilkan "Disewa: X • Tersedia: Y" |
| Migration baru | Update RPC `get_product_availability` — sertakan status `pending` di `currently_rented` |

## Validasi
1. Daftar event baru → cek inbox: dapat email konfirmasi (+ email per rental kalau ada).
2. Buka admin Peserta → "Sudah Dibayar" `Rp 0` (bukan GRATIS) saat belum bayar.
3. Lihat breakdown: tier, towing pergi, towing pulang, list sewa gear muncul terpisah.
4. Sewa gear status `pending` → badge kuning. Setelah admin konfirmasi → biru.
5. Submit sewa baru → langsung `pending` & inventori berkurang di Shop & admin.
6. Mark `returned` di Sewa Gear → inventori bertambah lagi otomatis.
7. Buka /admin/products → tiap baris produk yang rentable menunjukkan "Disewa: X • Tersedia: Y" real-time.

