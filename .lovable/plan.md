

## Audit Trail (Jejak Audit) Admin

### 1. Skema Database

**Tabel baru `audit_logs`:**
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `user_id` | uuid | aktor (NULL = system / anon) |
| `user_email` | text | snapshot email saat aksi |
| `user_name` | text | snapshot name |
| `action` | text | `create`, `update`, `delete`, `login`, `logout`, `login_failed`, `signup`, `password_reset`, dll. |
| `table_name` | text | objek (mis. `events`, `products`, `gear_rentals`) |
| `record_id` | uuid/text | ID baris yang dipengaruhi |
| `old_values` | jsonb | sebelum (NULL untuk create/login) |
| `new_values` | jsonb | sesudah (NULL untuk delete/logout) |
| `ip_address` | text | dari edge function `req` headers |
| `user_agent` | text | browser/device |
| `status` | text | `success` / `failed` |
| `error_message` | text | nullable |
| `metadata` | jsonb | konteks tambahan |
| `created_at` | timestamptz | default `now()` |

**Indeks:** `(created_at DESC)`, `(user_id)`, `(table_name)`, `(action)`.

**RLS (sangat ketat — append-only):**
- SELECT: hanya admin (`has_role(auth.uid(),'admin')`).
- INSERT: hanya `service_role` (dari edge functions/triggers).
- UPDATE & DELETE: **DITOLAK SEMUA** (no policy = no access). Bahkan admin tidak bisa edit/hapus → memenuhi kriteria "tidak bisa diubah".

### 2. Pencatatan Otomatis (DB Triggers)

Buat fungsi trigger generik `public.log_audit_event()` yang dipasang di tabel-tabel kritikal: `events`, `products`, `event_registrations`, `gear_rentals`, `vendors`, `sponsors`, `blog_posts`, `site_settings`, `email_template_overrides`, `user_roles`, `profiles`.

Trigger menangkap `TG_OP` (INSERT/UPDATE/DELETE), `OLD`, `NEW`, dan `auth.uid()` lalu insert ke `audit_logs`. IP/user_agent di trigger DB **tidak tersedia** — itu di-enrich dari edge function untuk auth events.

### 3. Pencatatan Auth Events (Edge Function)

Buat edge function baru `log-audit-event` (verify_jwt = false; validasi internal):
- Dipanggil dari frontend setelah `signIn`, `signUp`, `signOut`, gagal login, reset password.
- Menerima `action`, `status`, `metadata`, dan otomatis menangkap `req.headers` → `x-forwarded-for` (IP), `user-agent`.
- Insert ke `audit_logs` via service role.

Wiring di `useAuth.tsx`: invoke setelah setiap aksi auth (success & failure).

### 4. Halaman Admin `/admin/audit-logs`

**File baru:** `src/pages/admin/AdminAuditLogs.tsx` + tambah link sidebar `AdminLayout.tsx` (icon `ShieldCheck`).

**UI:**
- Tabel paginated (50 per halaman) urut `created_at DESC`.
- Kolom: Waktu, User (nama+email), Aksi (badge berwarna), Tabel, Record ID, Status, IP, Aksi (tombol "Detail").
- **Filter:** rentang tanggal, user (search), action (dropdown), table_name (dropdown), status.
- **Detail dialog:** menampilkan diff `old_values` vs `new_values` side-by-side (JSON viewer rapi), full metadata, IP, user-agent.
- **Export CSV** untuk rentang tertentu (compliance).
- Read-only — tidak ada tombol edit/delete.

### 5. Routing & Akses

- Route `/admin/audit-logs` di `App.tsx`.
- `AdminLayout` sudah memblokir non-admin → otomatis aman.
- Tambahkan ke `ADMIN_NAV` array.

### 6. Files yang dibuat / diubah

**Migration baru:**
- Buat `audit_logs` + RLS + trigger function + attach trigger ke 11 tabel kritikal.

**Edge function baru:**
- `supabase/functions/log-audit-event/index.ts` (untuk auth events + IP enrichment).

**Frontend baru:**
- `src/pages/admin/AdminAuditLogs.tsx` (halaman utama)
- `src/components/admin/AuditLogDetailDialog.tsx` (modal diff)
- `src/hooks/useAuditLogs.ts` (query + filter)

**Frontend diubah:**
- `src/App.tsx` — daftarkan route
- `src/pages/admin/AdminLayout.tsx` — tambah menu sidebar
- `src/hooks/useAuth.tsx` — invoke `log-audit-event` setelah signIn/signUp/signOut/resetPassword (success & error)

### 7. Validasi
1. Login admin → muncul entry `action=login, status=success` dengan IP & user-agent.
2. Salah password → entry `action=login_failed, status=failed`.
3. Edit event di admin → entry `action=update, table=events` dengan diff old/new.
4. Hapus produk → entry `action=delete` dengan `old_values` lengkap.
5. Buka `/admin/audit-logs` → list kronologis terbaru di atas, filter by user/action/date jalan.
6. Klik Detail → lihat diff JSON old vs new + IP/user-agent/metadata.
7. Coba akses `/admin/audit-logs` sebagai non-admin → di-redirect ke `/`.
8. Coba `UPDATE`/`DELETE` audit_logs sebagai admin via SQL → ditolak RLS.
9. Export CSV → file ter-download dengan kolom lengkap.

### Out of scope
- Retensi otomatis (purge log lama) — bisa ditambah cron nanti.
- Real-time live tail — admin refresh manual.
- Logging untuk SELECT (hanya mutations + auth).

