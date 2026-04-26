
## Perbaiki dropdown role vendor yang tidak muncul di Admin Users

### Diagnosis
Masalah utamanya bukan di tabel role. Dari source saat ini, `src/pages/admin/AdminUsers.tsx` memang masih punya opsi:

- `User`
- `Vendor`
- `Admin`

untuk semua user non-admin-terproteksi.

Jadi jika di UI yang tampil hanya `User` dan `Admin`, berarti ada ketidaksesuaian antara source saat ini dan bundle frontend yang sedang terbuka/published, atau ada regresi render di komponen role selector yang belum dipaksa sinkron.

Tambahan temuan:
- tabel `user_roles` saat ini memang hanya berisi `admin` dan `user`, tetapi itu **tidak seharusnya menghilangkan** opsi `Vendor` dari dropdown
- user yang sudah terhubung ke record vendor ada di tabel `vendors.owner_user_id`, jadi jalur vendor di backend memang sudah ada
- tidak ada service worker di project, jadi masalah lebih condong ke bundle/render path, bukan cache PWA

### Yang akan diperbaiki
1. Pastikan dropdown role di halaman `/admin/users` selalu menampilkan:
   - `Admin` saja untuk admin yang diproteksi
   - `User`, `Vendor`, `Admin` untuk semua user lain
2. Rapikan logika opsi role supaya tidak bergantung implisit pada data yang datang dari query role
3. Pastikan kondisi “admin tidak punya fitur vendor” hanya berlaku untuk user yang memang role-nya admin, bukan menghilangkan opsi vendor untuk user lain
4. Force refresh pada bagian frontend terkait agar perubahan benar-benar masuk ke bundle yang dipublish
5. Verifikasi langsung di preview dan site publish bahwa opsi `Vendor` muncul lagi

### Implementasi
#### 1) Rapikan role selector di `AdminUsers`
- Ubah render dropdown menjadi helper yang eksplisit, misalnya:
  - protected admin → `['admin']`
  - user lain → `['user', 'vendor', 'admin']`
- Pisahkan aturan:
  - “admin tidak punya fitur vendor”
  - “non-admin boleh dipromosikan ke vendor”
- Jika perlu, gunakan identifier admin terproteksi yang sama seperti sekarang agar perilaku untuk akun utama tetap aman

#### 2) Cegah regresi dari state/render
- Pastikan nilai `Select` tetap valid walau role yang tersimpan saat ini adalah `user`
- Hindari kondisi yang bisa menyaring item `vendor` hanya karena role user sekarang belum `vendor`
- Tambahkan fallback render yang konsisten walau query `roles` belum selesai

#### 3) Sinkronkan publish output
- Touch/update file frontend yang relevan supaya menghasilkan bundle baru
- Publish ulang frontend setelah perubahan, karena gejalanya menunjukkan source dan UI live tidak sinkron

#### 4) Verifikasi end-to-end
Akan diuji:
- login admin
- buka `/admin/users`
- buka dropdown untuk user biasa → harus muncul `User`, `Vendor`, `Admin`
- buka dropdown untuk admin terproteksi → hanya `Admin`
- ubah 1 user ke `Vendor` → tidak error
- pastikan link vendor selector tetap muncul hanya saat role user adalah `vendor`

### Hasil akhir yang diharapkan
- opsi `Vendor` muncul kembali di menu role untuk user biasa
- akun admin utama tetap tidak bisa diubah ke role lain
- aturan “admin tidak punya fitur vendor” tetap berjalan
- tampilan preview dan published konsisten

### Detail teknis
File utama yang akan disentuh:
- `src/pages/admin/AdminUsers.tsx`

Kemungkinan penyesuaian kecil tambahan bila diperlukan:
- helper role di area admin agar aturan opsi lebih eksplisit dan tidak ambigu saat build/publish

Tidak perlu perubahan database untuk bug spesifik ini, karena gejalanya ada di layer frontend/render dropdown, bukan di schema atau RLS.
