---
name: Rider Identity Platform
description: Public rider profiles at /riders/:username with garage, achievements, follows, endorsements, and auto-calculated trust score
type: feature
---
Public rider profile route: `/riders/:username`. `/riders/me` redirects to logged-in user's profile. Legacy `/member/:userId` redirects to `/riders/:username` for back-compat.

Profiles table extended with: username (unique, slug), banner_url, riding_style (santai|adventure|touring|racing), location, total_trips, total_km, trust_score (all auto-calculated via trigger).

Trust score formula: `trips*10 + completion_rate*50 + avg_endorsement_rating*20`. Tiers: 0-99 New Rider, 100-299 Trusted, 300+ Pro.

New tables: garage_bikes, garage_gear (owner CRUD, public read), achievements (catalog), user_achievements (system-managed), follows (PK follower+following, CHECK no self-follow), endorsements (UNIQUE from+to, no self-endorse).

Trigger `recalc_rider_stats(user_id)` runs on event_registrations status change and endorsement insert/delete. Unlocks achievements (first_ride, explorer, road_warrior, legend, grand_master, km_100/500/1000/5000, island_rider) automatically.

Storage: `garage` public bucket for bike/gear photos, owner-only write to `{uid}/...`.

RPC: `get_rider_public_profile(_username)` returns full public profile with follower/following counts.

JSON-LD `Person` schema injected per profile for SEO. Username auto-generated on signup via `handle_new_user`.
