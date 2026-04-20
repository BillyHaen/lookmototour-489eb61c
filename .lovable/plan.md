

## Tambah Role "Vendor" — Akses Khusus Produk & Sewa Gear

Memperluas sistem role dari `user`/`admin` menjadi `user`/`admin`/`vendor`. Vendor login mendapat dashboard khusus untuk mengelola produk & sewa gear miliknya saja.

### Perubahan Database

**1. Tambah enum value `vendor`** ke type `app_role`:
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';
```

**2. Link vendor ke user account** — tambah kolom di `vendors`:
```sql
ALTER TABLE public.vendors ADD COLUMN owner_user_id uuid;
CREATE UNIQUE INDEX ON public.vendors(owner_user_id) WHERE owner_user_id IS NOT NULL;
```
Satu user vendor terkait ke satu vendor record.

**3. Helper RPC `get_my_vendor_id()`** (security definer):
```sql
SELECT id FROM public.vendors WHERE owner_user_id = auth.uid() LIMIT 1
```

**4. RLS baru:**
- `products`: vendor bisa SELECT/INSERT/UPDATE/DELETE produk **hanya jika** `vendor_id = get_my_vendor_id()`. Saat INSERT, `vendor_id` di-force ke vendor-nya via trigger `BEFORE INSERT` jika role vendor.
- `gear_rentals`: vendor bisa SELECT semua sewa di mana `product.vendor_id = get_my_vendor_id()`, dan UPDATE status (confirmed/picked_up/returned/cancelled + notes).
- `vendors`: vendor bisa SELECT & UPDATE record sendiri (kecuali kolom `owner_user_id`, dijaga trigger).
- `profiles`: vendor bisa SELECT profil renter pada sewa miliknya (untuk nama+phone) — pakai SECURITY DEFINER RPC `get_renter_contact_for_vendor(_rental_id)`.

**5. Update trigger `handle_new_user`** tetap sama — vendor di-assign role manual oleh admin via UI.

### Perubahan UI

**Admin:**
- `AdminUsers.tsx` → di dialog detail user, tambah dropdown role: `user / admin / vendor`. Jika dipilih `vendor`, muncul dropdown "Link ke Vendor" (list vendor yang `owner_user_id IS NULL` + vendor yang sedang terkait user ini). Simpan via 2 RPC: `admin_set_user_role(_user_id, _role)` + `admin_link_vendor_to_user(_vendor_id, _user_id)`.
- `AdminVendors.tsx` → tampilkan kolom "Owner" (nama user terkait) dengan tombol link/unlink.

**Hook baru:** `useMyVendor()` — return vendor record milik user login (atau null).

**Hook baru:** `useUserRole()` — return `'admin' | 'vendor' | 'user'` berbasis check `has_role` berurutan.

**Layout vendor baru:** `src/pages/vendor/VendorLayout.tsx` — sidebar minimal dengan 2 menu: **Produk Saya** & **Sewa Gear Saya**. Guard: redirect ke `/` jika bukan vendor.

**Halaman vendor:**
- `src/pages/vendor/VendorProducts.tsx` — clone `AdminProducts` tapi:
  - Query produk pakai filter `vendor_id = my_vendor_id`
  - Form **tanpa** dropdown Vendor (vendor_id di-set otomatis ke `my_vendor_id` sebelum insert)
  - Tetap punya semua field produk (beli/sewa/inventori/dll)
- `src/pages/vendor/VendorRentals.tsx` — clone `AdminRentals` tapi:
  - Pakai hook baru `useVendorRentals()` yang query `gear_rentals` join `products` dengan filter `products.vendor_id = my_vendor_id`
  - Tombol aksi sama (Konfirmasi, Mark Diambil, Mark Dikembalikan, Batal)
  - Tambah tombol **Chat WhatsApp Penyewa** → buka `https://wa.me/{phone}?text=Halo {name}, terkait sewa gear {product.name}...`. Phone diambil dari RPC `get_renter_contact_for_vendor`.

**Routing (`App.tsx`):**
```
/vendor             → VendorLayout > VendorProducts (default)
/vendor/products    → VendorProducts
/vendor/rentals     → VendorRentals
```

**Navbar (`Navbar.tsx`):**
- Jika `useUserRole() === 'vendor'`: tampilkan tombol "Vendor" → `/vendor` (mirip tombol Admin existing). Sembunyikan tombol Admin.
- User biasa & admin: tidak ada perubahan.

**Login redirect:** Setelah login, kalau user adalah vendor (bukan admin), redirect ke `/vendor`.

### Validasi
1. Admin set seorang user jadi `vendor` & link ke vendor "Bengkel A" → user logout/login → navbar tampilkan tombol "Vendor".
2. User vendor buka `/vendor/products` → hanya lihat produk milik Bengkel A. Buat produk baru → form tidak ada field Vendor → produk tersimpan dengan `vendor_id = Bengkel A`.
3. Coba akses `/admin` sebagai vendor → di-redirect ke `/`.
4. User vendor buka `/vendor/rentals` → hanya lihat sewa untuk produk Bengkel A. Klik **Konfirmasi** → status berubah. **Mark Diambil**/**Dikembalikan** → status berubah. Klik tombol WhatsApp → buka chat ke penyewa.
5. Vendor coba PATCH produk vendor lain via Supabase client → ditolak RLS.
6. Admin tetap punya akses penuh ke semua produk & semua sewa.

### File yang dibuat / diubah

| File | Perubahan |
|---|---|
| Migration baru | enum value, kolom `owner_user_id`, RLS produk/rentals/vendors, trigger force vendor_id, RPC `get_my_vendor_id`, `admin_link_vendor_to_user`, `admin_set_user_role`, `get_renter_contact_for_vendor` |
| `src/hooks/useUserRole.ts` (baru) | Return role efektif |
| `src/hooks/useMyVendor.ts` (baru) | Vendor terkait user login |
| `src/hooks/useVendorRentals.ts` (baru) | Query rentals filter vendor |
| `src/pages/vendor/VendorLayout.tsx` (baru) | Layout sidebar vendor |
| `src/pages/vendor/VendorProducts.tsx` (baru) | CRUD produk milik vendor |
| `src/pages/vendor/VendorRentals.tsx` (baru) | Manajemen sewa + WA chat |
| `src/pages/admin/AdminUsers.tsx` | Dropdown role + link vendor |
| `src/pages/admin/AdminVendors.tsx` | Kolom owner + link/unlink |
| `src/components/Navbar.tsx` | Tombol "Vendor" untuk role vendor |
| `src/App.tsx` | Routes `/vendor/*` |
| `src/pages/Login.tsx` | Redirect vendor ke `/vendor` |

### Dampak & keamanan
- Role enforcement 2 lapis: RLS + RPC security definer. Vendor tidak bisa lihat/ubah data vendor lain meski memanggil API langsung.
- Admin tetap berhak penuh.
- User biasa tidak terdampak sama sekali.

