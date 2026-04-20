
## Perbaikan Sinkronisasi Data `/profile` dan `/riders/:username`

Memastikan data profil yang sudah disimpan selalu tampil konsisten di:
- halaman edit profil `/profile`
- halaman profil publik `/riders/:username`

### Akar masalah
Masalah utamanya ada pada cache query frontend:
- `Navbar.tsx` dan `Profile.tsx` memakai query key yang sama: `['profile', user.id]`
- tetapi bentuk datanya berbeda:
  - `Navbar` hanya mengambil `name, avatar_url`
  - `Profile` mengambil seluruh kolom profil
- akibatnya cache React Query bisa tertimpa data parsial dari `Navbar`, lalu form di `/profile` ter-reset dengan field kosong saat refresh / render ulang

Backend bukan sumber masalah:
- data di tabel `profiles` memang ada
- akses baca owner juga sudah diizinkan

### Yang akan diperbaiki

#### 1. Pisahkan query profil menjadi jelas dan tidak saling menimpa
Buat pemisahan query key agar tidak collision:

- `['profile-full', user.id]` untuk halaman `/profile`
- `['profile-nav', user.id]` untuk navbar
- query rider publik tetap terpisah di `['rider', username]`

Hasilnya:
- navbar tetap ringan
- halaman profil selalu memakai data lengkap
- refresh tidak lagi menghilangkan `username`, `nama`, `no. HP`, `riding style`, `lokasi`, `bio`, dan `banner`

#### 2. Rapikan sumber data profil sendiri
Refactor menjadi pola shared hook agar konsisten:

- `useMyProfile()` untuk full profile user login
- `useMyProfileSummary()` untuk navbar / kebutuhan ringan

Ini menghindari duplikasi query manual di banyak file dan menjaga struktur data selalu benar.

#### 3. Perbaiki sinkronisasi form di halaman `/profile`
Di `Profile.tsx`:
- form hanya di-reset saat data full profile benar-benar tersedia
- gunakan mapping field yang stabil dan tidak terpengaruh hasil query parsial
- pertahankan nilai yang sudah ada selama loading/refetch, supaya form tidak sempat “kosong” lalu muncul lagi

Field yang harus tetap tampil setelah refresh:
- Nama
- Username
- No. HP
- Riding Style
- Lokasi
- Bio
- Avatar
- Banner URL yang tersimpan

#### 4. Samakan invalidasi cache setelah update/upload
Setelah user:
- simpan informasi profil
- upload avatar
- upload / hapus banner

maka semua query terkait harus ikut di-refresh dengan key yang benar:
- `profile-full`
- `profile-nav`
- `my-username`
- `rider`

Ini memastikan perubahan langsung terlihat di kedua halaman tanpa mismatch.

### File yang akan diubah

| File | Perubahan |
|---|---|
| `src/pages/Profile.tsx` | Ganti query key profil penuh, pakai hook profile penuh, perbaiki reset form agar tidak tertimpa data parsial |
| `src/components/Navbar.tsx` | Pakai query key khusus navbar / hook summary agar tidak berbenturan dengan halaman profil |
| `src/components/AvatarUpload.tsx` | Ubah invalidasi query ke key baru supaya avatar update muncul di `/profile` dan `/riders/:username` |
| `src/components/BannerUpload.tsx` | Ubah invalidasi query ke key baru supaya banner update muncul di kedua halaman |
| `src/hooks/useRider.ts` atau hook baru `src/hooks/useProfile.ts` | Tambah hook profil sendiri agar pengambilan data full vs summary rapi dan reusable |

### Detail teknis
Implementasi cache akan dibuat seperti ini:

```text
/profile           -> ['profile-full', user.id]
navbar             -> ['profile-nav', user.id]
/riders/:username  -> ['rider', username]
```

Prinsipnya:
- satu key = satu bentuk data
- jangan reuse query key yang sama untuk payload berbeda

### Validasi
Setelah implementasi, alur berikut harus lolos:

1. Simpan `Nama`, `Username`, `No. HP`, `Riding Style`, `Lokasi`, `Bio` di `/profile`
2. Refresh `/profile` → semua field tetap tampil
3. Buka `/riders/{username}` → data yang sama tampil di profil publik
4. Upload avatar → avatar berubah di `/profile`, navbar, dan `/riders/{username}`
5. Upload banner → banner tetap tampil setelah refresh
6. Pindah halaman lalu kembali ke `/profile` → form tidak kosong lagi
7. Tidak ada flicker kosong akibat refetch navbar

### Dampak
- Tidak perlu perubahan database
- Tidak perlu perubahan RLS
- Fokus sepenuhnya di frontend data flow dan cache consistency
