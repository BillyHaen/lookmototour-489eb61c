
## Review: What exists vs. what's new

**Already built (do NOT recreate):**
- ✅ Sponsor data model: `sponsors`, `sponsor_packages`, `sponsor_benefits`, `sponsor_trip_relations`, `sponsor_media`
- ✅ Performance tracking: `sponsor_events`, `sponsor_performance_daily`, `track_sponsor_event` RPC, `useSponsorTracking` hook (impressions/clicks/leads/conversions already captured)
- ✅ Benefit claiming: `claim_sponsor_benefit` RPC + `SponsorDeals` page
- ✅ Sponsor placement: `SupportedBy` (homepage), `TripSponsors` (trip page), `EventCard` logos, `SponsorDetail` page
- ✅ Admin sponsor CMS: `AdminSponsors` + `SponsorEditor` + `SponsorPerformance`
- ✅ User behavior signals already tracked: `event_registrations` (trips joined), `sponsor_events` (clicks/leads/conversions per user)
- ✅ Existing AI infrastructure: `ai-trip-match` edge function pattern (Lovable AI Gateway)
- ✅ Profile data: motor_type, plate_number on `event_registrations`

**Missing — what to build:**
1. **Scoring engine** (no `sponsor_scores`/recommendations table yet)
2. **AI weights config** (admin tunable)
3. **Manual boost / blacklist** (no override mechanism)
4. **Personalized UI surfaces**: "Recommended For You" section, dynamic ordering on trip page, personalized homepage strip
5. **Recommended badge** + swipeable mobile cards

## Scope (lean — reuse everything that exists)

### Database (1 migration)

**New tables:**
- `sponsor_ai_config` (singleton row): `weight_relevance`, `weight_behavior`, `weight_priority`, `weight_performance`, `weight_trip_context` (numeric defaults 1.0), `updated_at`
- `sponsor_boosts`: `id, sponsor_id, boost_multiplier numeric default 1.5, expires_at, created_at` (manual force-boost)
- `sponsor_blacklist`: `id, sponsor_id, segment text` (e.g. `motor_type:sport`, `category:gear`) — hide for matching segment
- `sponsor_user_scores`: `user_id, sponsor_id, score numeric, reason jsonb, computed_at` — PRIMARY KEY (user_id, sponsor_id). Cache layer.

**RLS:** admin-only writes on config/boosts/blacklist. `sponsor_user_scores`: users SELECT own rows; service-role writes.

**No new interactions table needed** — `sponsor_events` already logs click/lead/conversion per `user_id` + `sponsor_id`.

### Edge function: `recommend-sponsors`
- Input: `{ user_id, context?: { event_id, page } }`
- Logic (deterministic scoring, optional AI re-rank for top 10):
  1. Fetch active sponsors (excluding blacklisted matches for user's segment).
  2. For each sponsor compute components:
     - **relevance** = category match vs user's motor_type / past trip categories (lookup table inline).
     - **behavior** = log(1 + user's clicks×1 + leads×3 + conversions×5 with this sponsor).
     - **priority** = normalized package tier (gold=3, silver=2, bronze=1) × active boost multiplier from `sponsor_boosts`.
     - **performance** = sponsor-wide conv_rate from `sponsor_performance_daily` (last 30d).
     - **trip_context** = +bonus if sponsor is in `sponsor_trip_relations` for current event_id.
  3. Final = Σ (component × weight from `sponsor_ai_config`).
  4. Optional: send top 10 + user profile to Lovable AI (`google/gemini-3-flash-preview`) with tool-call schema to re-rank with explanation. Skip AI when `?fast=1` (homepage strip).
  5. Upsert into `sponsor_user_scores` (cache 1h).
- Returns top N sponsors with score + reason.

### Frontend

**New hook:** `useSponsorRecommendations(context?)` — calls edge function, 5-min stale cache.

**New components:**
- `RecommendedSponsors.tsx` — reusable card grid with "Recommended" badge (orange dot + sparkle icon), swipeable on mobile (Embla carousel, reuse existing).
- `PersonalizedSponsorStrip.tsx` — homepage strip variant (compact horizontal scroll).

**Updates to existing files:**
- `src/pages/Profile.tsx` — add "Recommended For You" section above existing tabs.
- `src/pages/SponsorDeals.tsx` — sort deals by recommendation score when user is logged in.
- `src/pages/EventDetail.tsx` — pass `eventId` context to `TripSponsors` and re-order sponsors by personalized score (extend existing `useTripSponsors` to accept optional ranking).
- `src/pages/Index.tsx` — add `<PersonalizedSponsorStrip />` (only if user is logged in; falls back to existing `SupportedBy` for guests).
- `src/components/SupportedBy.tsx` — when authed, fetch personalized order; keep grayscale-hover style.

**Admin:**
- New tab in existing `AdminSponsors.tsx` page header: "AI Settings" button → opens `SponsorAIControlPanel.tsx` dialog with:
  - Weight sliders (relevance / behavior / priority / performance / trip_context) → writes `sponsor_ai_config`.
  - Force-boost: pick sponsor + multiplier + expiry → inserts `sponsor_boosts`.
  - Blacklist: pick sponsor + segment string → inserts `sponsor_blacklist`.
  - Live preview: pick a test user → see their top 10 with score reasons.

### Reuse (no rebuild)
- All tracking already happens via `useSponsorTracking` — no changes needed for the feedback loop. Scores recompute from `sponsor_events` automatically.
- "Conversion" already tracked when admin marks claim as `used` (existing flow).
- Lovable AI Gateway pattern reused from `ai-trip-match`.

## Files
- 1 migration (4 tables + RLS)
- 1 edge function: `supabase/functions/recommend-sponsors/index.ts`
- New: `useSponsorRecommendations.ts`, `RecommendedSponsors.tsx`, `PersonalizedSponsorStrip.tsx`, `admin/SponsorAIControlPanel.tsx`
- Edited: `Profile.tsx`, `SponsorDeals.tsx`, `EventDetail.tsx`, `Index.tsx`, `SupportedBy.tsx`, `AdminSponsors.tsx`, `useSponsors.ts` (add optional ranking param)

## Validation
1. Login → Profile shows "Recommended For You" with top 3 sponsors + orange "Recommended" badge.
2. Click sponsor → `sponsor_events` insert → reload → that sponsor's score increases (behavior weight).
3. Admin opens AI Settings → set `weight_priority=3` → preview user's top changes immediately.
4. Add boost on sponsor X (multiplier 2, expires +7d) → user sees X jump to top.
5. Blacklist sponsor Y for `motor_type:sport` → user with sport bike no longer sees Y.
6. Mobile: Recommended section becomes swipeable carousel.
7. Trip page sponsor order differs between two test users.

## Out of scope
- Cross-device behavior tracking (uses existing `user_id` only)
- Cold-start handling beyond default weights (new users get priority+performance ranking only)
- A/B testing framework for weight variants
- Real-time websocket score updates (5-min cache is sufficient)
