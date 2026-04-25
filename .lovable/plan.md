## Tujuan
1. Onboarding ketat: setiap user baru wajib mengisi profil lengkap sebelum bisa pakai fitur lain.
2. Login berikutnya: jika profil sudah lengkap → langsung ke homepage.
3. Pendaftaran event: nama, email, no. HP otomatis dari profil (read-only) — fix security finding `event_registrations_missing_public_policy`.
4. Rename tab "Setelan" → "Profil" dan ganti tab default ke profil saat user belum lengkap.

## Definisi "Profil Lengkap"
Wajib terisi: `name`, `username`, `phone` (di `profile_private`), `location`, `riding_style`.
Opsional: `bio`, `banner_url`, `avatar_url`.

## Perubahan Frontend

### a. `src/pages/Profile.tsx`
- Ganti label tab "Setelan" → "Profil". Ikon tetap `Settings` atau ganti ke `User`.
- Tambah prop/derived `isProfileComplete` (cek 5 field wajib).
- Jika `!isProfileComplete`:
  - Set `defaultValue` Tabs ke `"settings"` (tab Profil) dan disable tab lain (atau tetap aktif tapi tampilkan banner peringatan).
  - Tampilkan `<Alert variant="destructive">` di atas form: "Lengkapi profil kamu untuk bisa daftar trip & akses fitur lain."
- Tandai field wajib dengan asterisk; tambah validasi zod `username`, `phone`, `location`, `riding_style` jadi required (saat user belum lengkap; gunakan schema dinamis atau buat semua required).
- Setelah save sukses & profil lengkap → redirect ke `/` (atau `redirect` query param jika ada).

### b. Hook baru `src/hooks/useProfileComplete.ts`
- Return `{ isComplete, isLoading, missingFields }` berdasarkan `useMyProfile` + query `profile_private`.
- Dipakai di guard, navbar badge, dan event registration.

### c. Guard component `src/components/RequireCompleteProfile.tsx`
- Wrapper untuk route yang butuh profil lengkap (Events, EventDetail, Shop, TripMatch, Tracking, RiderProfile self, dll).
- Jika belum login → redirect `/login`.
- Jika belum lengkap → tampilkan toast peringatan + `<Navigate to="/profile?incomplete=1" />`.
- Halaman yang DIKECUALIKAN (boleh diakses): `/`, `/about`, `/blog`, `/jurnal`, `/profile`, `/login`, `/register`, `/forgot-password`, `/reset-password`, public share routes.

### d. `src/App.tsx`
- Bungkus rute terbatas dengan `<RequireCompleteProfile>`: `/events`, `/events/:id`, `/calendar`, `/shop`, `/trip-match`, `/tracking/*`, `/dashboard/sponsor-deals`, `/sponsor/:slug`, `/riders/me`, `/vendor*`.
- Tetap publik: home, about, blog, jurnal, login, register, reset, share redirect, public track token, dan rider profile orang lain (`/riders/:username`, `/member/:userId`).

### e. `src/pages/Register.tsx`
- Setelah signup berhasil (atau OAuth Google success) → `navigate('/profile?welcome=1')` bukan `/login`. Pesan toast: "Lengkapi profil kamu dulu ya."
- `Login.tsx` & OAuth callback: setelah sukses, panggil cek `useProfileComplete` (atau fetch one-shot) — jika belum lengkap → `/profile?incomplete=1`, jika lengkap → behavior eksisting (vendor → `/vendor`, else `/`).

### f. `src/components/EventRegistrationForm.tsx`
- Ambil `name`, `email` (dari `user.email`), `phone` (dari `profile_private`) saat dialog dibuka.
- Field `name`, `email`, `phone` di-render `readOnly` + style muted, dengan helper text "Diambil dari profil kamu. Edit di halaman Profil."
- Hilangkan dari schema validasi user-edit (atau set sebagai non-form display) — kirim ke RPC dari nilai server-side.
- Jika salah satu kosong → tampilkan banner: "Lengkapi profil dulu" + tombol ke `/profile`.

## Perubahan Database (Migration)

### Trigger validasi `event_registrations`
Buat trigger BEFORE INSERT/UPDATE pada `event_registrations` yang memaksa `name`, `email`, `phone` cocok dengan profil user (kecuali admin):

```sql
CREATE OR REPLACE FUNCTION public.enforce_registration_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile_name text;
  _profile_phone text;
  _auth_email text;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot register on behalf of another user';
  END IF;

  SELECT name INTO _profile_name FROM public.profiles WHERE user_id = auth.uid();
  SELECT phone INTO _profile_phone FROM public.profile_private WHERE user_id = auth.uid();
  SELECT email INTO _auth_email FROM auth.users WHERE id = auth.uid();

  -- Override free-text with authoritative values from profile / auth
  NEW.name  := COALESCE(_profile_name, NEW.name);
  NEW.email := COALESCE(_auth_email, NEW.email);
  NEW.phone := COALESCE(_profile_phone, NEW.phone);

  IF COALESCE(NEW.name,'') = '' OR COALESCE(NEW.email,'') = '' OR COALESCE(NEW.phone,'') = '' THEN
    RAISE EXCEPTION 'Profil belum lengkap (nama/email/telepon)';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_enforce_registration_identity
BEFORE INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.enforce_registration_identity();
```

Setelah migration → `mark_as_fixed` security finding `event_registrations_missing_public_policy`.

## Validasi & Verifikasi
1. Jalankan `supabase--linter` setelah migration.
2. Jalankan `security--run_security_scan`, perbaiki temuan baru jika ada.
3. Manual test alur:
   - Daftar baru → diarahkan ke `/profile`, tab Profil aktif, banner peringatan tampil.
   - Coba akses `/events` saat belum lengkap → diblokir dengan toast.
   - Lengkapi profil → bisa akses semua, dialog daftar event memuat nama/email/HP read-only.
   - Logout & login lagi (profil lengkap) → langsung ke `/`.

## File yang Disentuh
- **Baru:** `src/hooks/useProfileComplete.ts`, `src/components/RequireCompleteProfile.tsx`, migration `enforce_registration_identity`.
- **Edit:** `src/App.tsx`, `src/pages/Profile.tsx`, `src/pages/Register.tsx`, `src/pages/Login.tsx`, `src/components/EventRegistrationForm.tsx`.
