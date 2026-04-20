

## Tujuan
Tambahkan halaman admin untuk **edit semua template email (auth + transactional)** + tombol **Kirim Test Email**, di samping eksekusi rencana Fase 1+2 yang sudah disetujui.

## Arsitektur penyimpanan template

Saat ini template adalah file `.tsx` React Email yang di-bundle ke edge function. Itu tidak bisa diedit dari UI tanpa redeploy. Solusi:

**Hybrid model**: file `.tsx` jadi **default/fallback**, sementara admin bisa **override** via DB. Saat kirim, edge function cek DB dulu — kalau ada override aktif → render override; kalau tidak → render template default.

### Tabel baru `email_template_overrides`
| kolom | tipe | catatan |
|---|---|---|
| `id` | uuid PK | |
| `template_name` | text UNIQUE | mis. `event-registration-confirmation`, `signup`, `recovery` |
| `subject` | text | subject line (bisa pakai placeholder `{{name}}`) |
| `body_html` | text | HTML lengkap (sudah branded, agar render konsisten) |
| `body_text` | text nullable | plain-text fallback |
| `is_active` | boolean default true | toggle override on/off tanpa hapus |
| `updated_by` | uuid | auth.uid() admin |
| `updated_at` | timestamptz | |

RLS: hanya `admin` (via `has_role`) yang bisa SELECT/INSERT/UPDATE. Edge function akses pakai service role.

### Placeholder system
Pakai sintaks `{{variable}}` mustache-style sederhana. Variable = props yang dikirim via `templateData` (mis. `{{name}}`, `{{eventTitle}}`, `{{totalAmount}}`). Edge function ganti string sebelum kirim.

Tiap template punya **daftar variable yang tersedia** (didefinisikan di registry frontend, ditampilkan di editor sebagai chips yang bisa di-klik untuk insert).

## Perubahan edge function

### `send-transactional-email/index.ts`
Tambah logic di awal render:
1. Query `email_template_overrides` where `template_name = X and is_active = true`.
2. Kalau ada → ganti `{{var}}` di `subject` & `body_html` pakai `templateData` → enqueue dengan HTML hasil render (skip React Email).
3. Kalau tidak ada → render React Email seperti biasa.

### `auth-email-hook/index.ts`
Sama — cek override untuk `template_name = signup|recovery|magic-link|invite|email-change|reauthentication` sebelum render React component.

### Edge function baru `send-test-email`
- Body: `{ templateName, recipientEmail, sampleData }`.
- Auth: hanya admin (`has_role(auth.uid(), 'admin')`).
- Kirim via `send-transactional-email` dengan idempotency unik (`test-{ts}-{admin_id}`) supaya tiap test selalu terkirim.
- Mark email subject dengan prefix `[TEST]` agar jelas.

## Frontend admin

### Halaman baru `/admin/emails`
Layout: list di kiri (semua template — auth + transactional), editor di kanan.

**List item** menampilkan:
- Display name (mis. "Konfirmasi Pendaftaran Event")
- Badge "Default" / "Custom" (kalau ada override aktif)
- Badge kategori (Auth / Transactional)

**Editor panel:**
- Field: Subject (input)
- Field: Body HTML (textarea besar, monospace) — atau opsional pakai RichTextEditor yang sudah ada di project (`src/components/RichTextEditor.tsx`).
- Sidebar variabel: chips yang bisa di-klik → insert `{{varName}}` di posisi cursor.
- Tombol **Preview** → render HTML dengan sample data di iframe.
- Tombol **Reset to Default** → hapus row override (kembali ke template `.tsx`).
- Tombol **Save** → upsert ke `email_template_overrides`.
- Tombol **Send Test** → modal input email tujuan + sample data JSON → invoke `send-test-email`.

### Registry frontend `src/lib/emailTemplateRegistry.ts`
Daftar semua template + variabelnya:
```ts
{
  'event-registration-confirmation': {
    displayName: 'Konfirmasi Pendaftaran Event',
    category: 'transactional',
    variables: ['name', 'eventTitle', 'eventDate', 'totalAmount', 'eventUrl'],
    sampleData: { name: 'Budi', eventTitle: 'Sumba Adventure', ... },
  },
  'signup': { displayName: 'Konfirmasi Email Signup', category: 'auth', variables: ['confirmation_url'], ... },
  // ...total ~15 templates (6 auth + 9 transactional)
}
```

### Navigasi admin
Tambah menu "Emails" di `AdminLayout.tsx` sidebar.

## Eksekusi (urutan)

1. **Email infra setup** (otomatis): `setup_email_infra` → `scaffold_transactional_email` → halaman `/unsubscribe`.
2. **Buat 9 template transactional `.tsx`** (Fase 1+2) sesuai branding navy/sky-blue + logo.
3. **Migration**: tabel `email_template_overrides` + RLS admin-only.
4. **Edge functions**:
   - Update `send-transactional-email/index.ts`: cek override + simple `{{var}}` replacer.
   - Update `auth-email-hook/index.ts`: cek override.
   - Buat `send-test-email/index.ts` (admin-only).
5. **Cron edge functions** (Fase 2): `event-reminders-cron`, `rental-reminders-cron` (kirim ke user + vendor via `vendors.contact_email`).
6. **Schedule cron** (SQL insert, bukan migration): pg_cron daily 09:00 WIB untuk 2 reminder cron.
7. **Frontend wiring** (semua trigger Fase 1):
   - `EventRegistrationForm.tsx` — invoke setelah RPC sukses (registration + per-rental).
   - `RentalCheckoutDialog.tsx` — invoke setelah insert.
   - `AdminEventParticipants.tsx` — invoke saat ubah `payment_status`.
   - `useGearRentals.ts` — invoke di `useUpdateRentalStatus`.
   - `AdminTestimonials.tsx` — invoke saat approve/reject.
   - Tracking session start — invoke per recipient.
8. **Halaman admin `/admin/emails`** + registry + route + sidebar entry.
9. **Halaman `/unsubscribe`** branded.
10. **Deploy semua edge functions**.

## Files

**Baru:**
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- 9× template `.tsx` Fase 1+2
- `supabase/functions/send-transactional-email/index.ts` (auto-scaffold + tambah override logic)
- `supabase/functions/handle-email-unsubscribe/index.ts` (auto)
- `supabase/functions/handle-email-suppression/index.ts` (auto)
- `supabase/functions/send-test-email/index.ts`
- `supabase/functions/event-reminders-cron/index.ts`
- `supabase/functions/rental-reminders-cron/index.ts`
- `src/lib/emailTemplateRegistry.ts`
- `src/pages/admin/AdminEmails.tsx`
- `src/components/admin/EmailTemplateEditor.tsx`
- `src/components/admin/EmailTestDialog.tsx`
- `src/pages/Unsubscribe.tsx`
- Migration: `email_template_overrides` table + RLS

**Diubah:**
- `supabase/functions/auth-email-hook/index.ts` — tambah override check
- `src/components/EventRegistrationForm.tsx`
- `src/components/RentalCheckoutDialog.tsx`
- `src/pages/admin/AdminEventParticipants.tsx`
- `src/pages/admin/AdminTestimonials.tsx`
- `src/hooks/useGearRentals.ts`
- `src/pages/TrackingStart.tsx` (atau hook tracking)
- `src/pages/admin/AdminLayout.tsx` — tambah menu Emails
- `src/App.tsx` — route `/admin/emails` & `/unsubscribe`

## Validasi
1. Buka `/admin/emails` → pilih "Konfirmasi Pendaftaran Event" → ubah subject jadi "Halo {{name}}, pendaftaranmu masuk!" → Save.
2. Klik "Send Test" → masukkan email pribadi → cek inbox: subject custom muncul dengan nama sample.
3. Daftar event sungguhan → cek inbox: pakai versi custom (override aktif).
4. Klik "Reset to Default" → daftar event lagi → kembali pakai template asli.
5. Edit template `signup` di admin → register user baru → email confirmation pakai versi custom.
6. Cron reminder: invoke manual `event-reminders-cron` dengan event H-1 → user dapat email.
7. Cron rental pickup: rental dengan vendor `contact_email` terisi → user **dan** vendor dapat email.

## Out of scope
- Versioning history template (cuma current state).
- A/B testing template.
- Multi-language template (single language: Indonesia).
- WYSIWYG visual builder (pakai HTML textarea + RichTextEditor existing).

