
## Sponsorship Management System

End-to-end sponsorship platform: branding, leads, conversions, hybrid pricing, full tracking, admin CMS.

## Database (1 migration)

**New tables:**
- `sponsors` (id, name, slug, logo_url, website_url, tagline, description rich-text, category enum [dealer/gear/accessories/apparel/service/other], status [active/inactive], hero_image_url, created_at)
- `sponsor_packages` (id, sponsor_id, package_type [bronze/silver/gold/custom], base_price, cost_per_click, cost_per_lead, cost_per_conversion, start_date, end_date, is_active)
- `sponsor_trip_relations` (id, sponsor_id, event_id, priority int, created_at) — UNIQUE(sponsor_id, event_id)
- `sponsor_benefits` (id, sponsor_id, title, description, type [discount/free_item/experience/test_ride], terms, quota nullable, claimed_count default 0, valid_until, applicable_trips uuid[] default '{}', is_active)
- `sponsor_benefit_claims` (id, benefit_id, user_id, event_id, status [pending/claimed/used], claim_code text, created_at) — UNIQUE(benefit_id, user_id)
- `sponsor_media` (id, sponsor_id, type [banner/campaign/video], url, title, sort_order)
- `sponsor_events` (id, sponsor_id, event_type [impression/click/lead/conversion], event_id nullable, user_id nullable, metadata jsonb, revenue_amount default 0, created_at) — high-volume raw event log
- `sponsor_performance_daily` (sponsor_id, date, impressions, clicks, leads, conversions, revenue) — pre-aggregated for dashboard speed; refreshed by RPC

**RLS:** public SELECT on `sponsors` (where status=active), `sponsor_benefits` (where is_active), `sponsor_trip_relations`, `sponsor_media`. Admin-only CRUD on everything. Authenticated users can INSERT into `sponsor_benefit_claims` (own user_id only) and `sponsor_events` (impression/click public; lead/conversion authenticated).

**RPCs:**
- `track_sponsor_event(_sponsor_id, _event_type, _event_id, _metadata, _revenue)` — security definer, validates type, inserts into `sponsor_events`, increments `sponsor_performance_daily`.
- `get_sponsor_performance(_sponsor_id, _start, _end)` — aggregated stats + conversion rate + estimated payout (base_price + clicks×cpc + leads×cpl + conversions×cpcv).
- `claim_sponsor_benefit(_benefit_id, _event_id)` — checks quota, generates claim_code, inserts claim, increments claimed_count, fires lead event.

**Storage bucket:** `sponsor-assets` (public) — logos, hero images, banners, campaign visuals, videos.

## Frontend

### Public pages (new)
- **`src/pages/SponsorDetail.tsx`** (route `/sponsor/:slug`) — Hero (logo+tagline+CTA), About, Special Offers grid, Products carousel (using existing `products` table linked by sponsor_id later or sponsor_media), Media gallery, sticky mobile CTA. Fires `impression` on mount, `click` on CTA. Uses dark bg + orange accent (`hsl(24 95% 53%)`).
- **`src/pages/SponsorDeals.tsx`** (route `/dashboard/sponsor-deals`) — auth-gated. Lists user's confirmed-event sponsor benefits. Each card: claim/buy/register CTA. "Claim" calls `claim_sponsor_benefit` RPC → toast with claim code.

### Public components (new)
- **`src/components/SupportedBy.tsx`** — homepage grid section. Grayscale logos → hover full color + `scale-110` + lift. Mobile: horizontal snap carousel. Click → `/sponsor/:slug` + fires click event.
- **`src/components/TripSponsors.tsx`** — used in `EventDetail.tsx`. Lists sponsors with logo + description + benefit chips.
- **`src/components/SponsorBenefitCard.tsx`** — reusable for trip page + dashboard.
- **`src/hooks/useSponsorTracking.ts`** — `useImpressionTracker(sponsorId)` (IntersectionObserver, debounced once-per-session) + `trackClick`, `trackLead`.

### Updates to existing pages
- **`src/pages/Index.tsx`** — add `<SupportedBy />` between Testimonials and CTA.
- **`src/pages/EventDetail.tsx`** — add `<TripSponsors eventId={...} />` below itinerary.
- **`src/pages/Profile.tsx`** — add tab/section "Sponsor Deals" linking to `/dashboard/sponsor-deals` (or render inline).
- **`src/App.tsx`** — register routes.

### Admin pages (new)
- **`src/pages/admin/AdminSponsors.tsx`** (route `/admin/sponsors`) — list with filters (category, status, search), CRUD. Editor dialog tabs: `Profil | Paket | Benefit | Trip | Media | Performa`.
  - **Profil tab**: name, slug, logo upload (MediaPicker), hero image, tagline, rich-text description, website, category, status.
  - **Paket tab**: list of packages, add/edit form with all hybrid pricing fields.
  - **Benefit tab**: list + form (title, type, description, terms, quota, valid_until, applicable trips multi-select).
  - **Trip tab**: multi-select events + priority per assignment.
  - **Media tab**: upload banners/videos, reorder.
  - **Performa tab**: date range picker → calls `get_sponsor_performance` → shows KPI cards (impressions, clicks, leads, conversions, conv rate, revenue, estimated payout) + simple line chart (Recharts) of daily trend + per-trip breakdown table + CSV export.
- **`src/pages/admin/AdminLayout.tsx`** — add "Sponsor" nav item with Handshake icon.

### Tracking implementation details
- Impressions: `IntersectionObserver` on logo/card; once per sponsor per session (sessionStorage key) to prevent inflation.
- Clicks: on logo/CTA click; non-blocking RPC call before navigation.
- Leads: claim benefit, submit interest form on sponsor page.
- Conversions: when admin marks a claim as `used`, or via webhook later (out of scope to build the webhook now).

## UI Style (sponsorship surface only)
- Section bg: `bg-zinc-950` for sponsor detail hero & supported-by section.
- Accent: orange `hsl(24 95% 53%)` for CTAs, badges, hover rings.
- Cards: `hover:-translate-y-1 hover:shadow-elevated transition-all`.
- Logos: `grayscale hover:grayscale-0 hover:scale-110 transition-all duration-300`.
- Mobile: sticky bottom CTA bar on sponsor detail page.

## Validation
1. Admin creates sponsor "AHM" with logo + Bronze package + 1 benefit (10% discount, quota 50) + assign to event "Sumatra Tour".
2. Open homepage → "Supported By" shows AHM logo grayscale → hover colors → click → lands on `/sponsor/ahm` → impression+click recorded.
3. Open `/events/sumatra-tour` → "Trip Sponsors" section shows AHM with benefit chip.
4. Login as confirmed participant → `/dashboard/sponsor-deals` → AHM benefit appears → click Claim → toast with code → quota decremented to 49 → lead event recorded.
5. Admin opens AdminSponsors → AHM → Performa tab → see impressions/clicks/leads counters + estimated payout = base_price + (clicks × CPC) + (leads × CPL).
6. Mobile: logos scroll horizontally, sticky CTA visible on sponsor detail.

## Files (summary)
- 1 migration (8 tables + 3 RPCs + bucket + RLS)
- New: `SponsorDetail.tsx`, `SponsorDeals.tsx`, `SupportedBy.tsx`, `TripSponsors.tsx`, `SponsorBenefitCard.tsx`, `useSponsorTracking.ts`, `useSponsors.ts`, `AdminSponsors.tsx`, `admin/SponsorEditor.tsx`, `admin/SponsorPerformance.tsx`
- Edited: `App.tsx`, `Index.tsx`, `EventDetail.tsx`, `Profile.tsx`, `AdminLayout.tsx`

## Out of scope
- Real payment processing for "estimated payout" (display-only)
- Automated conversion webhooks from external sponsor sites (manual mark-as-used for now)
- Sponsor self-serve portal (admin-only management this phase)
- A/B testing on sponsor placements
