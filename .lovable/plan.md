

## Rider Identity Platform — "LinkedIn for Riders" inside LookMotoTour

Modular extension. Reuses existing `profiles`, `event_registrations`, `events`, `testimonials`, `useAuth`. New routes live under `/riders/*` (existing `/member/:userId` will redirect to `/riders/:username` for back-compat).

### 1. Database (migration)

**Extend `profiles`:**
- `username` text UNIQUE (slug, auto-gen from name, editable)
- `banner_url` text
- `riding_style` text (`santai|adventure|touring|racing`)
- `location` text
- `total_trips` int (denormalized, updated by trigger)
- `total_km` numeric (denormalized, updated by trigger)
- `trust_score` int (denormalized)

**New tables (UUID PK, RLS on):**

| Table | Columns | Access |
|---|---|---|
| `garage_bikes` | user_id, brand, model, year, description, photo_url | owner CRUD; public SELECT |
| `garage_gear` | user_id, category (helmet/jacket/gloves/boots/luggage/other), brand, name, photo_url | owner CRUD; public SELECT |
| `achievements` | code (PK-text), name, description, icon, criteria_type (trips/km), threshold | public SELECT; admin manage |
| `user_achievements` | user_id, achievement_code, unlocked_at | public SELECT; system insert |
| `follows` | follower_id, following_id, created_at, PK(follower_id, following_id) | owner CRUD; public SELECT counts |
| `endorsements` | from_user_id, to_user_id, rating 1-5, content, created_at | author insert/delete; public SELECT; no self-endorse trigger |

Seed `achievements`:
- `first_ride` (1 trip), `explorer` (3), `road_warrior` (5), `legend` (10), `grand_master` (20)
- `100km`, `500km`, `1000km_club`, `5000km`
- `island_rider` (≥3 distinct event locations)

**Triggers / Functions (SECURITY DEFINER):**
- `recalc_rider_stats(user_id)` — counts confirmed registrations, sums `events.distance` (parsed numeric), computes `trust_score = trips*10 + completion_rate*50 + avg_rating*20`, upserts achievements based on thresholds; updates denormalized cols on `profiles`.
- Trigger on `event_registrations` (AFTER INSERT/UPDATE of status) → call `recalc_rider_stats(NEW.user_id)`.
- Trigger on `endorsements` (AFTER INSERT/DELETE) → recalc target's score.
- `generate_unique_username(name)` helper for backfill + on signup (extend `handle_new_user`).

**RPC for public profile (replaces narrow `get_public_profile`):**
- `get_rider_public_profile(_username text)` returns name, username, avatar, banner, bio, riding_style, location, total_trips, total_km, trust_score, follower_count, following_count.

### 2. API surface (Supabase client + RPCs, no REST server needed)

All CRUD via existing supabase-js + RLS. Helpers in new hooks:
- `useRider(username)`, `useMyRider()`
- `useGarageBikes(userId)`, `useGarageGear(userId)`
- `useRiderTrips(userId)`
- `useAchievements(userId)`
- `useFollow(targetUserId)` → `isFollowing`, counts, toggle
- `useEndorsements(userId)` → list + create

### 3. Routes

| Route | Page |
|---|---|
| `/riders/:username` | Public rider profile (SEO-friendly) |
| `/riders/me` | Redirect to `/riders/{my-username}` |
| `/profile` (existing) | Edit mode — extended with username, banner, riding_style, location |
| `/member/:userId` | Redirect → `/riders/:username` (back-compat) |

### 4. UI (mobile-first, dark accent on existing Navy/Sky-Blue palette)

**`/riders/:username` page sections:**
1. **Header** — banner image (16:9, fallback gradient), avatar overlay, name + username, **Trust Badge** (New / Trusted ≥100 / Pro ≥300), Follow button (if logged in & not self).
2. **Stat bar** — 4 cards: Trips, Total KM, Achievements unlocked, Followers.
3. **Tabs** (Radix Tabs):
   - **About** — bio, riding_style chip, location, member since.
   - **Trips** — list of `event_registrations` joined with `events` (image, title, location, date, status badge); link to event.
   - **Garage** — two grids: Bikes + Gear; owner sees "+ Add" buttons that open dialogs.
   - **Achievements** — badge grid; locked badges grayscale with progress hint ("4/5 trips").
   - **Endorsements** — list (avatar, name, rating, content); "Tulis Endorsement" CTA for logged-in non-self.
4. **JSON-LD `Person` schema** + `useSeoMeta` for SEO.

**New components** in `src/components/rider/`:
- `RiderHeader.tsx`, `TrustBadge.tsx`, `StatCard.tsx`, `TripCard.tsx`, `BikeCard.tsx`, `GearCard.tsx`, `AchievementBadge.tsx`, `EndorsementCard.tsx`, `FollowButton.tsx`, `BikeFormDialog.tsx`, `GearFormDialog.tsx`, `EndorsementFormDialog.tsx`.

**Profile edit (`/profile`) additions:**
- Username field (with availability check + slug normalize).
- Banner upload (uses existing `avatars` bucket with `banners/` prefix, or new `banners` bucket — will use `avatars/banners/{uid}/...`).
- Riding style select, Location input.
- "Lihat Profil Publik" link → `/riders/{username}`.

**Bonus widgets (trip page):**
- "Riders yang ikut trip ini" — list participants (avatar + name + trust badge) on `EventDetail.tsx` (only confirmed, only public profiles).
- "Recommended trips for you" — already covered by `useRecommendedEvents`; surface a strip on `/riders/me`.

### 5. Auto-update logic (server-side via triggers)

```
event_registrations change ─▶ recalc_rider_stats(user_id):
  trips = count(status='confirmed')
  km    = sum(parsed events.distance)
  rate  = completed / total
  avg_r = avg(testimonials.rating where user_id)
  score = trips*10 + rate*50 + avg_r*20
  ▶ UPDATE profiles SET total_trips, total_km, trust_score
  ▶ For each achievement where threshold met → INSERT user_achievements (ON CONFLICT DO NOTHING)
```

Trust badge tier (client side from `trust_score`):
- 0–99 → "New Rider"
- 100–299 → "Trusted Rider"
- 300+ → "Pro Rider"

### 6. RLS summary

- `garage_bikes` / `garage_gear`: SELECT public; INSERT/UPDATE/DELETE only `user_id = auth.uid()`.
- `follows`: SELECT public; INSERT/DELETE only `follower_id = auth.uid()`; constraint `follower_id <> following_id`.
- `endorsements`: SELECT public; INSERT only `from_user_id = auth.uid()` AND `from <> to`; DELETE only own; admin can delete any.
- `user_achievements`: SELECT public; INSERT/UPDATE only via SECURITY DEFINER function; no client write.

### 7. Storage

Add `garage` public bucket for bike/gear photos with RLS: anyone read; only owner write to `{uid}/...`. Use existing `avatars` bucket for banners under `{uid}/banner.*`.

### 8. SEO

- `/riders/:username` uses `useSeoMeta`: title `{name} (@{username}) – Rider Profile | LookMotoTour`; description from bio + stats.
- JSON-LD `Person` with `image`, `description`, `knowsAbout: [riding_style]`, `address.addressLocality: location`.
- Add to Cloudflare prerender allowlist (per existing seo-prerendering memory).

### 9. Files to create / modify

**Migrations:** 1 file — schema + triggers + seed achievements + backfill usernames + storage bucket.

**New pages:** `src/pages/RiderProfile.tsx`, `src/pages/RiderMeRedirect.tsx`.

**New hooks:** `src/hooks/useRider.ts`, `useGarage.ts`, `useFollow.ts`, `useEndorsements.ts`, `useAchievements.ts`.

**New components:** `src/components/rider/*` (10 files listed above).

**Modified:**
- `src/App.tsx` — add `/riders/:username`, `/riders/me`; redirect `/member/:userId`.
- `src/pages/Profile.tsx` — username/banner/riding_style/location fields + link to public profile.
- `src/pages/MemberProfile.tsx` — replace body with redirect to `/riders/{username}`.
- `src/pages/EventDetail.tsx` — add "Riders yang ikut" section.
- `src/integrations/supabase/types.ts` — auto-regen.
- Memory file `mem://features/rider-identity` (new) + update `mem://index.md`.

### 10. MVP build order (matches your priority)

1. DB + triggers + RLS + storage.
2. Profile fields (username/banner/riding_style/location) + `/riders/:username` shell.
3. Trips tab (reuses existing data).
4. Trust score + Trust badge.
5. Garage (bikes + gear CRUD).
6. Achievements (engine + UI grid).
7. Follow system.
8. Endorsements.
9. Bonus: "Riders on this trip" + "Recommended trips for you" strip.

### Validation
1. Signup → username auto-generated unique; visiting `/riders/{username}` shows fresh profile with 0 stats.
2. Confirm a registration → trips count, km, trust_score auto-updated; "First Ride" badge unlocks.
3. Add bike + gear → appears in Garage tab; only owner sees Edit/Delete.
4. Follow another rider → counts update; double-click toggles correctly.
5. Endorse another rider → appears on their profile; cannot self-endorse; rating affects trust_score.
6. `/member/{uuid}` (old links) → 301 to `/riders/{username}`.
7. View source on `/riders/{username}` → meta + JSON-LD `Person` valid.
8. Mobile (375px): tabs scroll horizontally, stat bar wraps 2x2, all CTAs reachable.
9. RLS: non-owner cannot insert garage rows for someone else; cannot self-endorse.

### Out of scope (phase 2)
- Real GPS-based KM tracking (currently parsed from `events.distance`).
- Direct messaging between riders.
- Activity feed / posts.
- Verified rider badge (manual admin grant).
- Notifications when followed/endorsed (can plug into existing `notifications` table later).

