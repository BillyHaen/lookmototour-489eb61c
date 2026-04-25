# Rekomendasi Fix Security Findings

## Ringkasan Status

| Finding | Tindakan | Risiko Fix |
|---|---|---|
| `profiles_phone_not_public` | **FIX** — pisah field publik vs privat | Rendah-Sedang |
| `sponsor_benefit_claims_insert_missing` | **IGNORE** — claim hanya via SECURITY DEFINER RPC | Tidak ada |
| `SUPA_public_bucket_allows_listing` | Sudah di-ignore (intentional) | — |
| `SUPA_function_search_path_mutable` | Sudah di-ignore (extension functions) | — |
| `SUPA_rls_policy_always_true` | Sudah di-ignore (analytics public) | — |

Yang perlu aksi nyata: **#1** dan keputusan formal untuk **#2**.

---

## 1. `profiles_phone_not_public` — Phone bisa bocor

### Masalah
Saat ini policy SELECT di `profiles`:
- User hanya bisa lihat profil sendiri
- Admin lihat semua

Tapi banyak fitur butuh data publik user lain (nama, avatar, username, bio) — misalnya `TripParticipants`, `useEndorsements`, `useTripJournals`, `useBlog`, `MemberProfile`, `AdminEventParticipants`. Karena tidak ada policy publik, query-query ini bergantung pada RPC (`get_rider_public_profile`, `get_public_profile`) atau gagal diam-diam.

Jika nanti ada developer yang menambahkan policy publik `USING (true)` agar UI bisa join profil, **kolom `phone` ikut bocor** ke siapa saja yang login. Phone = PII sensitif (target spam/phishing/WA scam).

### Rekomendasi: View publik + base table tetap privat

**Pola yang aman (best practice Lovable Cloud):**

```sql
-- 1. Buat view publik tanpa kolom sensitif
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT user_id, name, username, avatar_url, banner_url, bio,
       riding_style, location, total_trips, total_km, trust_score,
       created_at
FROM public.profiles;

-- 2. Tambah policy SELECT publik HANYA untuk view (via security_invoker
--    view tetap pakai RLS base table, jadi kita perlu policy tambahan):
CREATE POLICY "Public can view non-sensitive profile fields"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);
```

**Tapi** ini tetap expose `phone` kalau client query base table langsung. Solusi lebih ketat:

**Opsi A (direkomendasikan): Pindah `phone` ke tabel terpisah**
```sql
CREATE TABLE public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads private" ON public.profile_private
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owner writes private" ON public.profile_private
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read private" ON public.profile_private
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Migrasi data
INSERT INTO public.profile_private (user_id, phone)
SELECT user_id, phone FROM public.profiles WHERE phone IS NOT NULL;

ALTER TABLE public.profiles DROP COLUMN phone;

-- Tambah policy publik untuk profiles (sekarang aman, no phone)
CREATE POLICY "Authenticated view public profile fields"
  ON public.profiles FOR SELECT TO authenticated USING (true);
```

**Opsi B (lebih ringan): Pertahankan kolom, tapi jangan tambah policy publik. Pakai RPC saja.**
Tetap pakai `get_rider_public_profile` & `get_public_profile` untuk semua lookup cross-user. Tidak ada perubahan schema, hanya **dokumentasikan rule**: jangan pernah `SELECT * FROM profiles WHERE user_id != auth.uid()`. Ini sudah kondisi sekarang dan secara teknis aman — finding bisa di-mark fixed dengan justifikasi.

### Side Impact Opsi A (pisah tabel)

Komponen yang perlu update karena `profiles.phone` hilang:
- `src/pages/Profile.tsx` — form edit phone → query `profile_private`
- `src/components/EventRegistrationForm.tsx` — prefill phone
- `src/hooks/useGearRentals.ts`, `src/hooks/useVendorRentals.ts` — join phone untuk vendor
- `src/pages/admin/AdminUsers.tsx` — display phone di dialog
- `src/pages/admin/AdminEventParticipants.tsx` — phone diambil dari `event_registrations` (sudah ada kolom phone sendiri di registrasi, jadi tidak terdampak ✓)
- `src/pages/vendor/VendorRentals.tsx` — phone via join (sudah pakai RPC `get_renter_contact_for_vendor` ✓ aman)

Effort: ~6 file edit + 1 migration. Tidak ada user-facing breakage kalau migrasi data benar.

### Side Impact Opsi B (status quo + dokumentasi)
- Tidak ada perubahan kode
- Resiko: developer masa depan bisa tidak sengaja expose phone kalau menambah policy publik
- Lebih cepat tapi defense-in-depth lebih lemah

**Rekomendasi saya: Opsi A** — phone adalah PII tinggi-risiko di Indonesia (target scam WA), worth dipisah permanen.

---

## 2. `sponsor_benefit_claims_insert_missing` — IGNORE

### Analisis
Tabel hanya punya policy admin ALL + user SELECT. Tidak ada INSERT untuk user biasa.

Ini **memang disengaja**: claim dibuat lewat RPC `claim_sponsor_benefit()` yang `SECURITY DEFINER` dengan validasi quota & ownership. Insert langsung dari client tidak diizinkan = pattern yang benar (mencegah user bypass quota check, claim_code generation, dan logging sponsor event).

### Rekomendasi
Mark as **ignored** dengan reason: "Claims dibuat via SECURITY DEFINER RPC `claim_sponsor_benefit` yang menjamin quota check, claim code generation, dan event tracking. Direct INSERT sengaja diblokir."

### Side Impact
Tidak ada — tidak ada perubahan.

---

## Rencana Eksekusi (jika disetujui)

1. **Migration `phone` split** (Opsi A):
   - Buat tabel `profile_private` + policies
   - Migrasi data phone existing
   - Drop kolom `profiles.phone`
   - Tambah policy SELECT publik authenticated di `profiles`
2. **Update kode** yang baca/tulis `profiles.phone`:
   - `Profile.tsx`, `EventRegistrationForm.tsx`, `useGearRentals.ts`, `useVendorRentals.ts`, `AdminUsers.tsx`
   - Tambah hook `usePrivateProfile` untuk owner/admin
3. **Update RPC** `get_renter_contact_for_vendor` untuk join `profile_private` (vendor butuh phone renter)
4. **Mark security findings**:
   - `profiles_phone_not_public` → fixed
   - `sponsor_benefit_claims_insert_missing` → ignored

Konfirmasi mau jalan dengan **Opsi A (pisah tabel, lebih aman)** atau **Opsi B (status quo + dokumentasi)**?
