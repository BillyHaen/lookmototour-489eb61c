

## Problem
Site is on Lovable hosting (not Cloudflare). The `og-prerender` Worker we built never runs for `lookmototour.com`. WhatsApp/FB hit the SPA's `index.html` and see only the global tags, so they show the LookMotoTour logo + generic title for every blog/event/journal link.

The Supabase `share-meta` edge function is fully working — verified it returns the correct title and post image when called directly. We just need crawlers to reach it.

## Fix: Use Share Redirect URLs (works on any host)

Change `ShareButton` to share a **share-meta URL** instead of the canonical page URL. The edge function:
- Returns full OG HTML to crawlers (WhatsApp, FB, IG, Twitter, etc.) — they see correct image/title/description
- Issues a `302` redirect to the real page for normal users (already implemented)

So when a user clicks "Bagikan" on a blog post, the URL copied / sent to WhatsApp becomes:
```
https://efrwzkdfkfvedtdrxrfg.supabase.co/functions/v1/share-meta?type=blog_post&slug=<slug>&site=https://lookmototour.com
```

When pasted in WhatsApp/FB → crawler sees post-specific OG tags → preview shows the real image and post title. When clicked by a user → 302 redirects to `https://lookmototour.com/blog/<slug>`.

## Changes (1 file)

**`src/components/ShareButton.tsx`** — replace `getPageUrl()` with a `getShareUrl()` that builds the edge-function URL with `type`, `slug`, and `site` params. Use this URL for both `navigator.share()` and clipboard copy. Keep the share-count RPC call unchanged.

```ts
const SHARE_META = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-meta`;
const shareUrl = `${SHARE_META}?type=${contentType}&slug=${encodeURIComponent(slug || contentId)}&site=${encodeURIComponent(window.location.origin)}`;
```

## Cleanup (optional, recommended)
Since the Cloudflare Worker isn't being used by the live domain, the `og-prerender` Worker setup adds dependencies and a deploy step that always runs but does nothing useful. After confirming the share-redirect fix works, we can:
- Remove `@cloudflare/vite-plugin`, `wrangler` from `package.json`
- Delete `wrangler.jsonc`
- Remove `cloudflare()` plugin from `vite.config.ts`
- Remove the `deploy` script

I'll leave this for a follow-up after confirming the share fix works on real WhatsApp/FB.

## Validation
1. After deploy, click "Bagikan" on a blog post → paste link in WhatsApp → preview shows post image + post title.
2. Same for an event and a trip journal.
3. FB Sharing Debugger should also show post-specific OG data.

