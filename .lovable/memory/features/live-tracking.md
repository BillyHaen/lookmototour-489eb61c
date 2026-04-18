---
name: Live Tracking Touring
description: Phase 1 — peserta share Google Maps live link → keluarga akses via token URL
type: feature
---
**Fase 1 (active):** Hybrid approach. Peserta confirmed di event_registrations bisa start sesi tracking dengan paste link Google Maps live location. Sistem generate access_token unik per recipient (keluarga). Halaman `/track/:token` public via SECURITY DEFINER RPC `get_tracking_by_token`.

**Tables:** `tracking_sessions` (event_id, user_id, google_maps_url, status, expires_at), `tracking_recipients` (session_id, name, phone, access_token).

**Eligibility:** RLS INSERT check pakai function `is_confirmed_participant()`. CTA di EventDetail hanya muncul untuk peserta confirmed dalam window aktif (H-1 sampai end_date+1).

**Routes:** `/tracking/start/:eventId` (auth), `/tracking/manage` (auth), `/track/:token` (public, no navbar).

**Auto-expiry:** `expires_at = event.end_date + 24h`. RPC return data + check expires_at di UI.

**Sharing:** WhatsApp deep link `wa.me/{phone}?text=...{public_url}`. Tidak ada WA Business API, tidak ada parsing GPS dari Google.

**Fase 2 (roadmap):** Custom browser geolocation + Supabase Realtime, multi-peserta map, geofencing alerts.
