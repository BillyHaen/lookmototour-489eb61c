

## Diagnosis

Saya cek database — ada 1 rental dengan `registration_id = NULL` (artinya rental orphan tanpa pendaftaran). Setelah audit:

**Flow registrasi event (`EventRegistrationForm.onSubmit`)**: secara teknis sudah benar — gear rental hanya di-insert SETELAH user klik "Kirim Pendaftaran" (selection cuma local state sampai submit). 

**Tapi** ada 2 masalah nyata yang menimbulkan persepsi "rental terproses padahal batal":

### Masalah #1 — Tidak atomic
Di `onSubmit`: registration di-insert dulu → lalu rental di-insert terpisah. Kalau insert rental gagal, registration tetap ada. Lebih buruk: kalau user **menutup tab di tengah submit** (network slow), bisa terjadi parsial.

### Masalah #2 — Tidak ada cascade saat batal
Kalau admin/user batalkan `event_registrations` (set status `cancelled` atau hapus row), `gear_rentals` terkait tetap `pending` di tabel — muncul di "Sewa Gear Saya" & dihitung di availability inventori. Inilah yang terlihat user: registrasi batal, tapi sewa masih nyangkut.

### Masalah #3 — Rental orphan dari Shop (`RentalCheckoutDialog`)
Path Shop insert rental tanpa `event_id`/`registration_id` — itu by design (sewa standalone). Bukan bug, tapi user mungkin bingung melihatnya di "Sewa Gear Saya".

## Fix

### 1. Atomic insert via RPC baru `create_registration_with_rentals`
Migration SQL: function `SECURITY DEFINER` yang insert registration + rentals dalam **1 transaksi**. Kalau salah satu gagal → rollback semua. Frontend cuma panggil 1 RPC.

```sql
CREATE FUNCTION public.create_registration_with_rentals(
  _event_id uuid, _payload jsonb, _rentals jsonb
) RETURNS uuid -- returns registration id
-- BEGIN; insert registration; loop insert rentals; COMMIT (atomic by default in plpgsql)
```

### 2. Cascade trigger: registration cancelled → rentals cancelled
Migration SQL: trigger `AFTER UPDATE OF status ON event_registrations` — kalau `NEW.status = 'cancelled'` (atau payment_status = 'batal'), set semua `gear_rentals.status = 'cancelled'` yang `registration_id = NEW.id` & masih `pending`/`confirmed`.

Plus: trigger `AFTER DELETE` untuk hard-delete registration → cascade cancel rentals (bukan delete, agar audit trail tetap).

### 3. Frontend `EventRegistrationForm.onSubmit`
Refactor: ganti 2 insert terpisah → 1 panggilan `supabase.rpc('create_registration_with_rentals', {...})`. Lebih bersih, atomic, no parsial state.

### 4. Cleanup orphan rental
1 SQL one-shot: `UPDATE gear_rentals SET status='cancelled' WHERE id='96970955-...'` (rental test orphan).

### 5. Profile UX (kecil)
Filter di `useMyRentals` query — exclude `status='cancelled'` dari tampilan default, atau tampilkan dengan badge "Dibatalkan" (sudah ada). Optional, tapi disarankan: sembunyikan cancelled lebih dari 30 hari.

## Files
- **New migration**: 
  - `create_registration_with_rentals` RPC
  - `cascade_cancel_rentals_on_registration_cancel` trigger
  - Cleanup orphan
- **Edited**: `src/components/EventRegistrationForm.tsx` (pakai RPC tunggal)
- **Optional edit**: `src/hooks/useGearRentals.ts` (filter cancelled lama)

## Validasi
1. Buka registrasi event Sumba, pilih gear, **tutup dialog tanpa submit** → cek DB: tidak ada row baru di `gear_rentals`. ✅ (sudah benar sekarang juga)
2. Submit registration + gear → cek DB: keduanya ada, terhubung via `registration_id`.
3. Admin batalkan registration (`payment_status='batal'` atau `status='cancelled'`) → otomatis `gear_rentals` jadi `cancelled`, hilang dari "Sewa Gear Saya" aktif.
4. Submit dengan gear yang stoknya habis → seluruh transaksi rollback, registration tidak terbuat.

## Out of scope
- Auto-refund deposit (manual via admin).
- Notifikasi WhatsApp ke vendor saat cancel (bisa fase berikutnya).

