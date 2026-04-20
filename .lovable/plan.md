
## Fitur "Try First, Buy Later" — Sewa Gear

Sistem persewaan gear terintegrasi dengan pendaftaran trip, rekomendasi cerdas berdasarkan karakter trip + motor, dan inventori real-time.

## Review: yang sudah ada vs baru

**Sudah ada (REUSE):**
- ✅ `products` table (name, price, stock, category, image_url, is_active, description)
- ✅ `Shop.tsx` page + `AdminProducts.tsx` admin
- ✅ `EventRegistrationForm.tsx` dengan field `motor_type`
- ✅ Event punya: `touring_style`, `motor_types[]`, `difficulty`, `riding_hours_per_day`, `road_condition`, `distance`
- ✅ AI infrastructure: Lovable AI Gateway pattern (`ai-trip-match`, `recommend-sponsors`)

**Yang perlu dibuat:**
1. Vendor sebagai entitas terpisah
2. Field sewa di products (rentable, daily price, deposit)
3. Inventori real-time (qty for sale vs rent vs in-use)
4. Tabel rental (booking ↔ event ↔ user)
5. UI sewa di registration form + rekomendasi
6. Toko dengan toggle "Sewa / Beli"
7. Admin: vendor manager, rental config, riwayat sewa

## Database (1 migration)

**Tabel baru:**
- `vendors` (id, name, slug, logo_url, contact_phone, contact_email, description, is_active)
- `gear_rentals` (id, product_id, user_id, event_id, registration_id nullable, qty, daily_price, total_days, total_price, deposit_amount, start_date, end_date, status enum [pending/confirmed/picked_up/returned/cancelled], pickup_notes, return_notes, created_at)
- `product_recommendations_log` (id, user_id, event_id, product_id, score, reason jsonb, computed_at) — cache rekomendasi

**Perubahan `products`:**
- `vendor_id` (FK ke vendors, nullable awal lalu wajib via UI)
- `is_rentable` boolean default false
- `is_purchasable` boolean default true
- `daily_rent_price` integer default 0
- `rent_deposit` integer default 0
- `total_inventory` integer default 0 (replaces simple `stock` semantics; `stock` jadi computed view: `total_inventory - sold - currently_rented`)
- `gear_type` text (helmet / jacket / gloves / boots / luggage / camera / etc) — untuk matching rekomendasi
- `suitable_motor_types` text[] (sport/touring/adventure/naked/cruiser/matic)
- `suitable_trip_styles` text[] (adventure/touring/city)
- `motor_brands` text[] (honda/yamaha/kawasaki/etc — opsional, untuk merk-spesifik)
- `min_difficulty` int (1-5) — gear perlu untuk minimal level kesulitan ini

**RPC:**
- `get_product_availability(_product_id, _start_date, _end_date)` returns `{ available_to_rent, available_to_buy, currently_rented }` — hitung dari `gear_rentals` yang overlap tanggal.
- `recommend_rental_gear(_event_id, _user_id, _motor_type, _motor_brand)` returns scored list — deterministic scoring berdasar match motor_types / trip_style / difficulty / brand. Cache ke `product_recommendations_log`.

**RLS:** vendors public select (active), admin CRUD. `gear_rentals` users SELECT own, admin CRUD, users INSERT own. Recommendations log: own SELECT.

## Frontend

### Komponen baru
- **`RentalGearRecommendations.tsx`** — dipasang di `EventRegistrationForm.tsx`. Memanggil `recommend_rental_gear` setelah user pilih motor_type. Tampilkan grid kartu gear: nama, vendor logo, harga/hari × hari trip = subtotal, badge "Direkomendasikan", checkbox pilih qty. Total update real-time dipassing ke parent form.
- **`ProductCard.tsx`** (refactor dari Shop) — toggle dual-mode "Sewa | Beli" jika product `is_rentable && is_purchasable`. Tampilkan stok tersedia untuk masing-masing.
- **`RentalCheckoutDialog.tsx`** — dialog di Shop untuk pilih tanggal sewa standalone (di luar event), hitung total + deposit.

### Updates
- **`EventRegistrationForm.tsx`** — tambah section "Sewa Gear (Opsional)" antara field motor & towing. Pass selected rentals ke handler simpan. Total harga registrasi ditambah total sewa. Saat submit confirmed, insert ke `gear_rentals` dengan registration_id.
- **`Shop.tsx`** — filter: "Semua / Beli / Sewa". Card pakai `ProductCard` baru dengan toggle.
- **`Profile.tsx`** — tab/section baru "Sewa Gear Saya" tampil daftar rental aktif & history dengan status.

### Admin
- **`AdminVendors.tsx`** (route `/admin/vendors`) — CRUD vendor (logo upload, kontak).
- **`AdminProducts.tsx`** — extend existing:
  - Field baru: vendor_id (Select dari vendors), toggle `is_rentable`/`is_purchasable`, daily_rent_price, deposit, gear_type, suitable_motor_types (multi-select chips), suitable_trip_styles, motor_brands, min_difficulty, total_inventory.
  - Display "Stok: X tersedia (Y disewa, Z terjual)".
- **`AdminRentals.tsx`** (route `/admin/rentals`) — list semua rental, filter status, action: confirm / mark picked_up / mark returned / cancel + edit notes.
- **`AdminLayout.tsx`** — nav baru: "Vendor" + "Sewa Gear".

## Logika rekomendasi (RPC, deterministic, no AI needed dulu)
```text
score = 0
+10 jika motor_type match
+5  jika motor_brand match
+8  jika trip_style match
+5  jika difficulty event >= product.min_difficulty
+3  jika gear_type "essential" (helmet, jacket) dan trip > 1 hari
+2  jika multi-day trip dan gear_type = luggage
filter: only is_rentable && available_qty > 0
sort by score desc, ambil top 6
```

## Validation
1. Admin buat vendor "MotoGear ID" → buat product "Jaket Touring AGV" linked vendor, is_rentable=true, daily_rent_price=50k, total_inventory=5, suitable_motor_types=[touring,adventure].
2. User registrasi event "Sumatra Adventure 5 hari" pilih motor_type=adventure → section Sewa Gear muncul → Jaket AGV tampil dengan badge "Direkomendasikan", subtotal = 50k×5=250k.
3. Pilih qty 1 → total registrasi otomatis +250k +deposit.
4. Submit → record di `gear_rentals` status=pending, registration_id terhubung.
5. Buka /shop → Jaket AGV muncul dengan toggle "Sewa | Beli" → toggle "Beli" tampil stok beli.
6. Admin buka `/admin/rentals` → confirm rental → mark picked_up saat user ambil → returned saat kembali.
7. Setelah picked_up, stok available di Shop berkurang otomatis (cek via `get_product_availability`).
8. User bisa lihat rental di Profile → "Sewa Gear Saya".

## Files
- 1 migration (1 tabel baru + alter products + 2 tabel rental/log + 2 RPC + RLS)
- New: `RentalGearRecommendations.tsx`, `ProductCard.tsx`, `RentalCheckoutDialog.tsx`, `useVendors.ts`, `useGearRentals.ts`, `useGearRecommendations.ts`, `admin/AdminVendors.tsx`, `admin/AdminRentals.tsx`
- Edited: `EventRegistrationForm.tsx`, `Shop.tsx`, `Profile.tsx`, `admin/AdminProducts.tsx`, `admin/AdminLayout.tsx`

## Out of scope
- Pembayaran deposit otomatis (manual via WhatsApp dulu, sama seperti Shop sekarang)
- Auto-reminder email pengembalian (bisa fase berikutnya pakai email queue yang sudah ada)
- AI re-rank rekomendasi (skor deterministic cukup; bisa ditambah nanti)
- Multi-vendor checkout cart (1 rental = 1 vendor untuk simplicity awal)
