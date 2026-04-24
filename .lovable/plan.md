## Popup Slider — Implementation Plan

### 1. Database Migration
Create 3 tabel + storage bucket:

**`popup_campaigns`**: id, name, is_active, force_show_logged_in, start_at, end_at, target_device (`all|mobile|desktop`), frequency (`once|daily|every_session|always`), priority, ab_enabled, ab_variant (`A|B|null`), ab_group_key (untuk pasangkan A & B), created_at, updated_at.

**`popup_slides`**: id, campaign_id (FK), order_index, image_url, content_html, cta_label, cta_url.

**`popup_events`** (analytics): id, campaign_id, slide_id, variant, event_type (`view|slide_view|click_cta|close|dismiss_outside`), user_id (nullable), session_id, device, created_at. Index on `(campaign_id, created_at)`.

**RLS**:
- campaigns/slides: SELECT publik utk row aktif & dalam window jadwal; ALL utk admin.
- events: INSERT publik (anon+auth), SELECT admin only.

**Storage**: bucket `popup-images` (public read, admin write).

### 2. Admin UI — `src/pages/admin/AdminPopups.tsx`
- Daftar kampanye: nama, status, jadwal, variant, views, clicks, CTR.
- Form Create/Edit:
  - Field umum (nama, active, force_show_logged_in, target_device, frequency, priority).
  - Date-range picker untuk start_at & end_at.
  - Toggle A/B + dropdown variant + ab_group_key.
  - Slide manager: drag-reorder, upload image (validasi 2MB jpg/png/webp), rich text editor (komponen RTE existing).
- Tab Analytics per kampanye: Total views, unique viewers, CTA clicks, CTR, dismiss rate; tabel A vs B; filter range tanggal.
- Tambah link "Popup Slider" di `AdminLayout.tsx` sidebar.

### 3. Frontend Display

**Hook `src/hooks/usePopupCampaign.ts`**:
- Fetch kampanye aktif (is_active true, dalam window jadwal) urut priority.
- Filter device match via `window.matchMedia`.
- Skip jika user logged-in kecuali `force_show_logged_in=true`.
- Cek frekuensi via localStorage `popup_seen_<campaign_id>`.
- Bila A/B: random pilih variant per `ab_group_key`, simpan di localStorage (konsisten utk visitor).
- Generate `session_id` (uuid di sessionStorage) utk anon tracking.

**Komponen `src/components/PopupSlider.tsx`**:
- shadcn Dialog mobile-first (`max-w-md`, `rounded-2xl`).
- Embla Carousel: swipe touch + thumb nav kiri/kanan + dots.
- Close X kanan atas; klik overlay/Esc → close.
- Image `object-contain max-h-[70vh]`, content_html sanitized via DOMPurify.
- CTA button bila ada cta_url.
- Mount `<PopupSlider />` di `App.tsx` agar muncul di route publik.

**Tracking** (insert ke `popup_events`, fire-and-forget):
- `view` saat mount, `slide_view` saat ganti slide, `click_cta` saat CTA, `close` saat X, `dismiss_outside` saat overlay/Esc.

### 4. Files
- `supabase/migrations/<new>.sql`
- `src/pages/admin/AdminPopups.tsx`
- `src/components/admin/PopupSlideEditor.tsx` (sub-komponen)
- `src/hooks/usePopupCampaign.ts`
- `src/components/PopupSlider.tsx`
- Edit: `src/pages/admin/AdminLayout.tsx`, `src/App.tsx`

### Catatan Teknis
- DOMPurify sudah/akan diinstall utk sanitasi HTML.
- Embla sudah tersedia via shadcn carousel.
- Overflow-x-hidden pada container popup utk mobile-friendly.