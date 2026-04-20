

## Sumba Exploride 360 — SEO Landing Page via Admin Event System

I'll explore current event structure to map every required SEO/landing-page element to an existing field — and identify what's missing and must be added.

### Investigation Findings

**Current event schema** (from prior context: `EventDetail.tsx`, `AdminEvents.tsx`, `useEvents.ts`):
- Has: `title`, `description` (rich text WYSIWYG), `date`, `endDate`, `location`, `price`, `image`, `highlights[]`, `difficulty`, `distance`, tier pricing (Single/Sharing/Couple), towing, gear rentals, testimonials (moderated per event), `currentParticipants/maxParticipants` (urgency).
- Missing for full SEO landing: `slug` (currently uses ID — `sumba-exploride-360` won't work), `meta_title`, `meta_description`, `hero_subheadline`, `cta_label`, `opening_hook` (rich text), `why_join` (rich text or list), `experience_section` (rich text), `itinerary` (structured per-day: `day, title, description, image`), `about_destination` (rich text 300-500 words for SEO), `included[]` / `excluded[]` (checklist arrays), `target_audience` (rich text), `trust_section` (rich text), `faq` (Q&A array), `gallery` (already supported via MultiImageUpload? confirm), `internal_links` (auto from blog tag).

### Proposed Solution

**1. DB Migration — extend `events` table:**

| Column | Type | Purpose |
|---|---|---|
| `slug` | text UNIQUE | URL like `/events/sumba-exploride-360` |
| `meta_title` | text | `<title>` & og:title |
| `meta_description` | text | meta description & og |
| `hero_subheadline` | text | emotional sub under H1 |
| `cta_primary_label` | text | default "🔥 Secure Your Slot Now" |
| `opening_hook` | text (HTML) | hook paragraphs |
| `why_join` | text (HTML) | bulleted reasons |
| `experience_section` | text (HTML) | what you'll experience |
| `itinerary` | jsonb | `[{day, title, description, image_url, image_alt}]` |
| `about_destination` | text (HTML) | 300-500 word SEO section |
| `included` | text[] | checklist |
| `excluded` | text[] | checklist |
| `target_audience` | text (HTML) | who it's for |
| `trust_section` | text (HTML) | trust copy |
| `faq` | jsonb | `[{question, answer}]` |
| `gallery` | jsonb | `[{url, alt}]` (SEO alt text) |
| `internal_link_blog_tag` | text | auto-pull related blog posts |

Add unique index on `slug`.

**2. Routing update (`App.tsx` + `EventDetail.tsx`):**
- Support both `/events/:idOrSlug` — resolve by slug first, fallback to UUID.
- `useSeoMeta` already exists → use `meta_title` + `meta_description` + `og:image`.

**3. Admin editor (`AdminEvents.tsx` → `EventEditor` dialog):**

Reorganize into tabs to keep it usable:
- **Tab "Dasar"**: title, slug (auto-generate from title with edit), date/location/price/difficulty/distance, hero image, gallery.
- **Tab "SEO"**: meta_title, meta_description, hero_subheadline, cta_primary_label.
- **Tab "Konten Landing"** (semua RichTextEditor + bantuan placeholder copy):
  - Opening Hook
  - Why Join (H2 section)
  - What You'll Experience
  - About Destination (300-500 words)
  - Target Audience
  - Trust Section
- **Tab "Itinerary"**: dynamic list — add/remove/reorder days (`day #`, title, description, optional image upload + alt).
- **Tab "Included/Excluded"**: dua list editor (chip-style, tambah/hapus item).
- **Tab "FAQ"**: dynamic Q&A list (add/remove/reorder).
- **Tab "Pricing & Tier"**: existing tier/towing/gear settings (unchanged).

Slug auto-generator: lowercase, dash, strip special chars; uniqueness check via debounced query.

**4. Frontend rendering (`EventDetail.tsx`) — full SEO landing layout:**

Sections (in order, each conditional — hide if empty so existing events don't break):
1. **Hero** — H1 = `title`, subheadline = `hero_subheadline`, CTA button = `cta_primary_label`, hero image with keyword-rich alt = `${title} - motor adventure tour`. Sticky scarcity bar: "Hanya {maxParticipants - currentParticipants} slot tersisa".
2. **Opening Hook** — RichTextContent.
3. **Why Join** (H2) — RichTextContent.
4. **What You'll Experience** (H2) — RichTextContent + gallery slider.
5. **Route & Itinerary** (H2) — render `itinerary[]` as cards/timeline (Day N, title, desc, image).
6. **About Destination** (H2) — RichTextContent (SEO body).
7. **What's Included / Excluded** (H2) — two-column checklist (✅ / ❌).
8. **Who Is This Trip For** (H2) — RichTextContent.
9. **Pricing & Booking** (H2) — existing tier UI + CTA #2.
10. **Why Riders Trust Us** (H2) — `trust_section` RichTextContent.
11. **Testimonials** (H2) — existing moderated testimonials per event.
12. **FAQ** (H2) — Accordion from `faq[]` + JSON-LD `FAQPage` schema in `<script type="application/ld+json">` for SEO rich snippets.
13. **Final CTA** — sticky/banner repeat ("Join The Ride – Apply Now").
14. **Internal links** — auto-list 2-3 related blog posts (filter by `internal_link_blog_tag`) + link to homepage with anchor "motor adventure tour Indonesia".

Add CTA in Hero (1), after Itinerary (2), Pricing (3), Final banner (4) → ≥4 CTAs.

**5. Structured data (SEO boost):**
- Inject JSON-LD `Event` schema (name, description, startDate, endDate, location, image, offers/price) + `FAQPage` schema in `EventDetail.tsx`.

**6. Image SEO:**
- Gallery uploader stores `alt` per image (already partially supported in MultiImageUpload — verify, extend if needed).
- Itinerary images include alt field in editor.
- Hero auto-alt fallback: `${title} - ${location} motor tour`.

**7. Seed Sumba Exploride 360 (optional helper):**
- Provide a "Duplicate from template" button or a one-click migration that seeds the Sumba event with all sections pre-filled with the brief's copy (H1, hook, why-join, itinerary days, FAQ, etc.). User can then edit in admin.

### Files Created/Modified

| File | Change |
|---|---|
| Migration (new) | Add columns to `events`, unique slug index |
| `src/pages/admin/AdminEvents.tsx` | Tabbed editor with all new fields |
| `src/components/admin/ItineraryEditor.tsx` (new) | Dynamic day list editor |
| `src/components/admin/FaqEditor.tsx` (new) | Dynamic Q&A editor |
| `src/components/admin/ChecklistEditor.tsx` (new) | Included/excluded chips |
| `src/components/admin/SlugInput.tsx` (new) | Auto-gen + uniqueness check |
| `src/pages/EventDetail.tsx` | Full landing layout with all 14 sections + JSON-LD |
| `src/components/EventLandingSections/*` (new) | Hero, Itinerary, FAQ, Checklist, Gallery, FinalCTA components |
| `src/App.tsx` | Route accepts slug or ID |
| `src/hooks/useEvents.ts` | Fetch by slug, include new fields |
| `src/integrations/supabase/types.ts` | Auto-regenerated |

### Validation
1. Buat event "Sumba Exploride 360" via admin — semua tab terisi.
2. URL `/events/sumba-exploride-360` muncul (slug routing jalan).
3. View source → meta title/description benar, og:image set, JSON-LD `Event` + `FAQPage` valid (test di Google Rich Results).
4. Semua 14 section render, 4 CTA muncul, scarcity bar tampil.
5. Itinerary, FAQ accordion, included/excluded checklist, gallery dengan alt benar.
6. Existing events tanpa data baru tetap render (graceful fallback ke layout lama).
7. Lighthouse SEO ≥ 95.
8. Edit event dari admin → preview update real-time.

### Out of scope
- Multi-language (ID/EN toggle) — bisa fase berikutnya.
- A/B testing CTA copy.
- Auto-generate copy via AI (bisa ditambah tombol "AI generate" nanti).

