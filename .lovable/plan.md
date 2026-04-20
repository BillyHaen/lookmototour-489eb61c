
## Masalah & Solusi

**Akar masalah rekomendasi tidak muncul:**
1. Field "Tipe Motor" sekarang free-text (`Honda CRF250`), lalu di-regex untuk menebak kategori (`adventure`/`sport`/dll) & brand. Heuristik ini sering meleset → `motor_type` yang dikirim ke RPC `recommend_rental_gear` tidak match dengan `suitable_motor_types` produk.
2. RPC butuh exact string match terhadap array `suitable_motor_types` (`sport`/`touring`/`adventure`/`naked`/`cruiser`/`matic`).
3. Jika belum ada produk dengan `is_rentable=true` + `daily_rent_price>0` + stok tersedia, hasil tetap kosong (perlu dicek juga).

**Solusi: ganti free-text jadi 2 dropdown terstruktur — Merk Motor + Tipe Motor.**

## Perubahan

### 1. Data katalog motor (file baru `src/data/motorcycles.ts`)
Konstanta lookup brand → daftar model. Setiap model punya `category` (sport/touring/adventure/naked/cruiser/matic) sehingga kategori untuk scoring tidak perlu ditebak.

Cakupan brand yang beredar di Indonesia:
- **Honda**: BeAT, Scoopy, Vario 125/160, PCX 160, ADV 160, Genio, Stylo, Revo, Supra X 125, CRF150L, CRF250 Rally, CB150R, CB150 Verza, CB150X, CBR150R, CBR250RR, CBR500R, CBR600RR, CBR1000RR-R, Rebel 500, X-ADV, Forza 250/750, Africa Twin, Gold Wing.
- **Yamaha**: Mio, Fino, Gear, Lexi, FreeGo, NMax, Aerox 155, XMax 250, TMax, Vega Force, Jupiter Z1, MX King 150, R15, R25, R1, MT-15, MT-25, MT-09, MT-07, XSR 155, XSR 700/900, Tenere 700, WR155R.
- **Kawasaki**: Ninja 250/400/650/ZX-6R/ZX-10R, Z250/Z400/Z650/Z900/Z H2, ER-6n, KLX 150/230, W175, W800, Versys 250/650/1000, Vulcan S, Eliminator 400.
- **Suzuki**: Address, Nex II, Avenis, Burgman Street, Satria F150, GSX-R150, GSX-S150, GSX-R1000, GSX-S1000, V-Strom 250 SX/650/1050, Hayabusa.
- **Ducati**: Panigale V2/V4, Streetfighter V2/V4, Monster, Multistrada V2/V4, Scrambler, DesertX, Diavel.
- **BMW Motorrad**: G 310 R/GS, F 750/850/900 GS, R 1250 GS / GS Adventure, R nineT, S 1000 RR/XR, K 1600 GT.
- **KTM**: Duke 200/250/390/790/890/1290, RC 200/390, Adventure 250/390/790/890/1290, SX-F, EXC.
- **Royal Enfield**: Hunter 350, Classic 350, Meteor 350, Bullet 350, Himalayan 411/450, Continental GT 650, Interceptor 650, Super Meteor 650.
- **Harley-Davidson**: Sportster S, Nightster, Street Glide, Road Glide, Road King, Fat Boy, Pan America 1250.
- **Triumph**: Speed 400, Scrambler 400X, Trident 660, Speed Twin, Bonneville T100/T120, Street Triple, Speed Triple, Tiger 660/900/1200, Rocket 3.
- **Aprilia**: SR GT 200, RS 660, Tuono 660, Tuareg 660, RSV4, Tuono V4.
- **CFMOTO**: 250 SR/NK, 300 SR/NK, 450 SR/NK/MT, 650 GT/NK/MT, 800 MT, 700 CL-X.
- **Benelli**: TNT 135/150/249, 302S, 502C, Leoncino 250/500, TRK 251/502/702, Imperiale 400.
- **Vespa / Piaggio**: LX, S, Sprint, Primavera, GTS, GTV, Liberty, Medley.
- **Lainnya**: Lambretta, Italjet Dragster, Husqvarna Vitpilen/Svartpilen, Royal Alloy.

(Daftar disusun sebagai array di file untuk kemudahan maintenance; admin bisa menambah lewat update kode.)

### 2. EventRegistrationForm
- Hapus input free-text `motorType`. Schema diganti:
  - `motorBrand: z.string().min(1)` 
  - `motorModel: z.string().min(1)` (nama tipe)
- 2 `<Select>` (Shadcn): Brand (cascading) → Model. Saat brand dipilih, dropdown model di-reset & di-populate dari katalog.
- Field `motor_type` di DB tetap diisi gabungan: `"Honda CRF250 Rally"` (kompatibel data lama; tidak perlu migrasi schema).
- `motorCategory` & `motorBrand` untuk RPC diambil **langsung** dari katalog (bukan regex):
  - `motorCategory = MOTORCYCLES[brand][model].category`
  - `motorBrand = brand` (lowercase)
- Hapus helper `detectMotorCategory` & `detectMotorBrand`.

### 3. Profile (form edit motor) & MemberProfile
Cek `src/pages/Profile.tsx` — jika ada field motor yang diedit user, ganti pola sama (Brand+Model dropdown). Jika cuma display, biarkan.

### 4. Admin — `AdminProducts.tsx`
- Field `suitable_motor_types` (array kategori) tetap multi-chip: `sport/touring/adventure/naked/cruiser/matic` — selaras dengan kategori di katalog.
- Field `motor_brands` ubah dari free-text jadi multi-select chips dari brand katalog (konsisten lowercase).
- Tambahkan helper text: "Pilih kategori motor & merk yang cocok agar muncul di rekomendasi sewa saat user pilih motor sesuai."

### 5. RPC `recommend_rental_gear` — TIDAK perlu diubah
Logika scoring sudah kompatibel; cuma sekarang inputnya bersih & deterministik.

### 6. Diagnostik tambahan di `RentalGearRecommendations.tsx`
- Saat hasil kosong tapi `motorType` sudah valid, tampilkan pesan kecil: "Belum ada gear cocok untuk motor & trip ini." (bukan menyembunyikan section sepenuhnya). Sekarang dia `return null` → user mengira fitur tidak ada.

## Implikasi ke sistem sewa

| Area | Dampak |
|---|---|
| RPC scoring | Lebih akurat — `motor_type_match` & `brand_match` jadi reliable. |
| Data lama `event_registrations.motor_type` | Tetap kompatibel (string bebas). Tidak butuh migrasi. |
| Admin produk | Konsistensi data brand/kategori antara katalog motor ↔ produk. |
| Shop standalone (`RentalCheckoutDialog`) | Tidak terdampak (tidak pakai motor sebagai input). |
| Stok & availability | Tidak terdampak. |

## Validasi
1. Buka event detail → Daftar Sekarang.
2. Pilih Brand: Kawasaki → dropdown Model muncul → pilih `Versys 250` → kategori internal `adventure`.
3. Section "Sewa Gear" muncul. Jika ada produk rentable dengan `suitable_motor_types: [adventure]` atau `motor_brands: [kawasaki]` → ranking benar.
4. Jika belum ada produk cocok → muncul pesan ramah, bukan blank.
5. Submit → `motor_type` di DB tersimpan `"Kawasaki Versys 250"`.
6. Admin AdminProducts: edit produk, set `motor_brands` ke `kawasaki` & `suitable_motor_types` ke `adventure` → user dengan motor di atas otomatis dapat rekomendasi.

## Files
- **New**: `src/data/motorcycles.ts`
- **Edited**: `src/components/EventRegistrationForm.tsx`, `src/components/RentalGearRecommendations.tsx` (empty-state message), `src/pages/admin/AdminProducts.tsx` (brand multi-select dari katalog), `src/pages/Profile.tsx` (jika ada edit motor)

## Out of scope
- Migrasi data motor lama di `event_registrations` (tidak perlu — field text bebas).
- CCM/manage daftar motor via admin UI (cukup file konstanta untuk MVP).
- Auto-detect kategori untuk merk motor custom yang tidak di katalog (user bisa skip dropdown atau pilih "Lainnya" → category default `touring`).
