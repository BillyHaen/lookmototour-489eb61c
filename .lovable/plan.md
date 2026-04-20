

## Akar masalah (sudah dikonfirmasi via DB query)

RPC `recommend_rental_gear` melempar error PostgreSQL:
```
ERROR: 42702: column reference "available_qty" is ambiguous
```
Ada nama `available_qty` baik di SELECT (alias kolom) maupun sebagai variabel PL/pgSQL → query gagal eksekusi → frontend dapat error → `recs.length === 0` → empty state muncul (yang user lihat di screenshot).

Data lain sudah benar:
- Produk SHAD TR08 ada (rentable, harga 50k, stok 3, brand & motor types lengkap).
- Event Sumba: `touring_style=adventure`, `difficulty=sedang`. Match seharusnya skor tinggi.

## Fix (1 migration SQL)

Rename alias di CTE dari `available_qty` → `avail_qty` (atau qualify dengan nama CTE) supaya tidak bentrok dengan variabel PL/pgSQL. Hanya 1 file yang berubah.

```sql
CREATE OR REPLACE FUNCTION public.recommend_rental_gear(...)
-- di dalam WITH scored AS (...): ganti `AS available_qty` → `AS avail_qty`
-- di WHERE akhir: `WHERE avail_qty > 0`
-- di SELECT akhir: alias balik jadi `avail_qty AS available_qty` agar TS type tetap kompatibel
```

## Bagian setup yang perlu user kerjakan agar gear muncul

Untuk produk lain yang ingin masuk rekomendasi, di `/admin/products` pastikan tiap produk punya:
1. **Vendor** ter-assign (sudah ada `MotoGear`/dst).
2. **Aktif** & toggle **Bisa Disewa** ON.
3. **Harga sewa/hari** > 0.
4. **Total inventory** > 0.
5. **Suitable motor types** terisi (minimal 1 dari: sport/touring/adventure/naked/cruiser/matic).
6. **Suitable trip styles** terisi (adventure/touring/city) — match dengan `touring_style` event.
7. **Motor brands** opsional (boost skor +5 jika match merek user).
8. **Min difficulty** ≤ difficulty event (mudah=1, sedang=2, sulit=3, ekstrem=4).

## Validasi setelah fix
1. Buka event Sumba → Daftar Sekarang → pilih Brand `Honda` Model `CRF250 Rally` (kategori adventure).
2. Section "Sewa Gear" tampil produk SHAD TR08 dengan badge "Rekomen" (skor: 10 motor + 8 style + 5 brand + 5 difficulty + 2 luggage = 30).
3. Pilih qty → total registrasi bertambah otomatis.

## Files
- **New migration**: fix `recommend_rental_gear` (rename alias).
- Tidak ada perubahan frontend.

