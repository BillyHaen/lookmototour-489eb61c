
## Scope
Major upgrade to Blog & Trip Journal admin: filtering, scheduling, preview, categories/tags, multi-image gallery slider, rich content editor with inline media, and a Media Library. All Indonesian UI, mobile-first, navy/sky blue aesthetic.

## Database changes (1 migration)

**New columns on `blog_posts`:**
- `scheduled_at timestamptz` — for future-publish
- `gallery jsonb default '[]'` — array of `{image_url, caption}` (slider)

**New columns on `trip_journals`:**
- `scheduled_at timestamptz`

**New tables:**
- `blog_categories` (id, name, slug, created_at) — admin-managed
- `blog_tags` (id, name, slug, created_at) — admin-managed
- `blog_post_categories` (post_id, category_id) — many-to-many
- `blog_post_tags` (post_id, tag_id) — many-to-many
- `media_library` (id, file_url, file_name, file_type [image/video/document], mime_type, size_bytes, bucket, uploaded_by, created_at) — central catalog of all uploads

**New storage bucket:** `media-library` (public) for documents/videos. Reuse `blog-images` & `journal-images` for images already.

**Cron job:** every 5 min → flips `status` from `draft` to `published` when `scheduled_at <= now()`.

RLS: admin full CRUD on all new tables; public SELECT on categories/tags only.

## Frontend changes

### `src/pages/admin/AdminBlog.tsx` (rewrite)
- **Filter bar**: search by title, status select (all/draft/scheduled/published), date-range picker, category multi-select, tag multi-select, **Reset Filters** button.
- **Post list**: shows status badge (Draft / Terjadwal / Published) + scheduled date.
- **Editor dialog**: tabs for `Konten | Galeri | Kategori & Tag | SEO`. Status dropdown gains "Terjadwal" with date-time picker. **Preview** button opens new tab `/blog/<slug>?preview=<token>`.

### `src/pages/admin/AdminTripJournals.tsx` (similar treatment)
- Same filter bar + scheduled status + preview.

### `src/components/RichTextEditor.tsx` (extend)
Add Tiptap extensions:
- `@tiptap/extension-image` — insert image (from upload or Media Library picker)
- Custom `YouTubeEmbed` node — paste YouTube URL → embedded responsive iframe
- Custom `DocumentLink` node — insert PDF/doc link with icon

Toolbar gets 3 new buttons: 🖼 Image, ▶ YouTube, 📎 Document. Each opens `MediaPickerDialog` (browse Media Library or upload new).

### `src/components/GallerySlider.tsx` (new, public-facing)
Embla carousel showing `gallery` array on blog detail page, with caption overlay.

### `src/pages/admin/AdminMedia.tsx` (new) — Media Library
- Grid view of all uploaded media with filter (type: image/video/document, search by name).
- Upload button supports multiple files; auto-detects type, stores in correct bucket, indexes in `media_library` table.
- Click a file → copy URL / delete / view metadata.
- Linked from admin sidebar as "Media".

### `src/components/admin/MediaPickerDialog.tsx` (new)
Reusable picker used by RichTextEditor, gallery uploader, and cover-image fields. Tabs: "Pilih dari Library" + "Upload Baru".

### `src/components/admin/CategoryTagManager.tsx` (new)
Inline manager inside post editor — create new category/tag on the fly.

### `src/pages/BlogDetail.tsx` (update)
- Render `gallery` via `GallerySlider` above content.
- Show categories & tags as badges.
- Support `?preview=<token>` to render unpublished post for admin.

### `src/pages/Blog.tsx` (update)
- Filter chips by category & tag.

## Edge function
**`auto-publish-scheduled`** (cron every 5 min) — flips `blog_posts` and `trip_journals` from draft to published when `scheduled_at <= now()`. Triggers existing notification logic.

## Files touched (summary)
- Migration: 1 new
- New: `AdminMedia.tsx`, `MediaPickerDialog.tsx`, `GallerySlider.tsx`, `CategoryTagManager.tsx`, `useMedia.ts`, `useBlogTaxonomy.ts`, edge function `auto-publish-scheduled`
- Edited: `AdminBlog.tsx`, `AdminTripJournals.tsx`, `RichTextEditor.tsx`, `BlogDetail.tsx`, `Blog.tsx`, `TripJournalDetail.tsx`, `AdminLayout.tsx` (add Media nav)

## Validation
1. Create post → schedule for 5 min ahead → wait → confirm auto-published.
2. Upload 5 images to gallery, add captions → verify slider works on blog detail.
3. In editor, insert YouTube link, image from library, PDF document → confirm rendering.
4. Filter blog list by status=draft + date range → confirm correct posts.
5. Create category "Touring Tips" + tag "Sumatra" → assign to post → filter public Blog page by both.
6. Open Media Library → upload mixed files → confirm type detection and copy-URL works.
7. Click "Preview" on a draft post → opens correctly without publishing.

## Out of scope (call out)
- Per-user media ownership/quotas (admins only for now)
- Video transcoding (videos stored as-is; YouTube embed is the primary video path)
- Cropping/editing tools inside Media Library
