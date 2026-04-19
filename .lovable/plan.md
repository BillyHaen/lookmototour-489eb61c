
Worker live di `s.lookmototour.com`. Update 1 file untuk arahkan tombol Bagikan ke subdomain itu.

## Perubahan

**`src/components/ShareButton.tsx`** — ganti `getShareUrl()` agar return URL ke Cloudflare Worker:

```ts
const SHARE_BASE = 'https://s.lookmototour.com';

function getShareUrl(contentType: string, slug: string): string {
  return `${SHARE_BASE}/s/${contentType}/${encodeURIComponent(slug)}`;
}
```

Hasil: tombol Bagikan generate link `https://s.lookmototour.com/s/blog_post/<slug>`. Crawler WA/FB → dapat OG tags lengkap dari Worker → preview gambar+judul post asli. User klik → 302 redirect ke `https://lookmototour.com/blog/<slug>`.

Sisa logika (`navigator.share`, clipboard, `increment_share_count` RPC) tidak berubah.

## Validasi
1. Klik Bagikan di blog post → paste di WhatsApp → preview muncul gambar+judul post.
2. Ulangi untuk event dan trip journal.
3. Cek FB Sharing Debugger: https://developers.facebook.com/tools/debug/ → input link share → confirm OG data per-post.
