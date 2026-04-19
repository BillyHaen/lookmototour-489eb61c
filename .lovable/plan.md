

## Fix Cloudflare Wrangler Deploy Failure

### Root Cause
Deploy pipeline runs `npx wrangler deploy` which auto-detects this as a Cloudflare Pages/Workers project (`og-prerender` Worker for SEO prerendering). Wrangler tries to inject the Cloudflare plugin into `vite.config.ts` but fails with:

> Cannot modify Vite config: could not find a valid plugins array.

This is because line 15 uses a runtime expression:
```ts
plugins: [react(), mode === "development" && componentTagger()].filter(Boolean)
```

Wrangler's static parser only recognizes a plain array literal like `plugins: [...]`. The `.filter(Boolean)` chain breaks detection.

### Fix (single, minimal change)

Refactor `vite.config.ts` so the `plugins` key holds a plain array literal — keep the same runtime behavior by inlining the conditional inside the array (Vite already ignores `false`/`null`/`undefined` plugin entries since v5, no `.filter` needed):

```ts
plugins: [
  react(),
  mode === "development" ? componentTagger() : null,
],
```

Vite officially supports falsy entries in the plugins array, so this is functionally identical to today and removes the `.filter(Boolean)` that confuses Wrangler's AST parser.

### Files to change
| File | Change |
|---|---|
| `vite.config.ts` | Replace `plugins: [...].filter(Boolean)` with a plain array literal containing a ternary that returns `null` in production |

### What this does NOT touch
- No package.json / dependency changes
- No Wrangler config files added (Wrangler will create `wrangler.jsonc` itself once it can patch the vite config — that's the deploy step's job, not ours)
- No changes to the existing `share-meta` edge function or SEO prerendering logic
- No changes to React/Leaflet/Recharts code

### Verification
After deploy, `npx wrangler deploy` should succeed and the `og-prerender` Worker will serve OG meta tags to social crawlers (WhatsApp, FB, Twitter) for blog/journal/event share links — fixing the original "image when share blog post" issue.

