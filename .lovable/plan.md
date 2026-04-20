

## Fix: WhatsApp Preview Hilang untuk Profil Rider

### Akar masalah
URL `https://lookmototour.com/riders/billyhn` di-share langsung. Tidak ada Cloudflare Worker yang mendeteksi crawler (WhatsApp/FB/X) di domain utama, jadi WA mengambil `index.html` statis yang berisi meta tag default LookMotoTour. Edge function `share-meta` tetap berfungsi, tetapi hanya kalau URL pakai prefix `s.lookmototour.com/s/rider/...` — yang tidak terjadi saat user salin URL dari address bar.

`wrangler.jsonc` saat ini hanya mengaktifkan static asset SPA fallback, **tidak ada worker script** yang berjalan di request.

### Solusi
Tambahkan **Cloudflare Worker entry script** yang berjalan untuk setiap request ke `lookmototour.com`:

1. Periksa header `User-Agent`. Kalau cocok regex crawler (`whatsapp|facebookexternalhit|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|skypeuripreview|embedly|redditbot|googlebot|bingbot|applebot|pinterest|tiktok`):
   - Untuk path `/riders/:username` → proxy ke `share-meta?type=rider&slug=:username&site=https://lookmototour.com`
   - Untuk path `/blog/:slug` → proxy ke `share-meta?type=blog_post&slug=:slug`
   - Untuk path `/jurnal/:slug` → proxy ke `share-meta?type=trip_journal&slug=:slug`
   - Untuk path `/events/:slug` → proxy ke `share-meta?type=event&slug=:slug`
   - Stream HTML response dari edge function ke crawler (status 200 + meta tag yang benar)
2. Untuk semua user/UA lain → lanjut ke SPA static asset (perilaku saat ini).

Worker dipasang lewat `wrangler.jsonc` dengan `main: "worker/index.ts"` dan handler `fetch` standar Cloudflare Workers. Static assets tetap di-serve via `env.ASSETS.fetch(request)` untuk request non-crawler.

### File yang dibuat / diubah

| File | Perubahan |
|---|---|
| `worker/index.ts` (baru) | Cloudflare Worker entry: deteksi UA crawler, mapping path → param `share-meta`, proxy fetch ke edge function, fallback ke `env.ASSETS.fetch()` |
| `wrangler.jsonc` | Tambah `"main": "worker/index.ts"`, binding `ASSETS` (sudah implisit lewat `assets`), set `assets.binding = "ASSETS"` |

### Detail teknis

**Mapping path → share-meta param:**
```ts
const ROUTES: Array<[RegExp, string]> = [
  [/^\/riders\/([^\/]+)\/?$/, "rider"],
  [/^\/blog\/([^\/]+)\/?$/, "blog_post"],
  [/^\/jurnal\/([^\/]+)\/?$/, "trip_journal"],
  [/^\/events\/([^\/]+)\/?$/, "event"],
];
```

**Endpoint share-meta:**
```
https://efrwzkdfkfvedtdrxrfg.supabase.co/functions/v1/share-meta?type=...&slug=...&site=https://lookmototour.com
```
Worker meneruskan `User-Agent` asli supaya edge function tetap mendeteksi crawler dan mengembalikan HTML (bukan redirect 302).

**Worker pseudocode:**
```ts
export default {
  async fetch(req: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(req.url);
    const ua = req.headers.get("user-agent") || "";
    const isCrawler = /whatsapp|facebookexternalhit|.../i.test(ua);

    if (isCrawler) {
      for (const [re, type] of ROUTES) {
        const m = url.pathname.match(re);
        if (m) {
          const target = `https://efrwzkdfkfvedtdrxrfg.supabase.co/functions/v1/share-meta?type=${type}&slug=${encodeURIComponent(m[1])}&site=${url.origin}`;
          const r = await fetch(target, { headers: { "user-agent": ua } });
          return new Response(r.body, {
            status: r.status,
            headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
          });
        }
      }
    }
    return env.ASSETS.fetch(req);
  },
};
```

### Validasi
1. Deploy worker → debug pakai `curl -A "WhatsApp/2.0" https://lookmototour.com/riders/billyhn` → terima HTML dengan `<meta property="og:image" content="{avatar_url}">`, `<meta property="og:title" content="Riders Billy ... – ...">`
2. Curl tanpa UA crawler → terima SPA `index.html` (tidak berubah)
3. Tempel ulang `https://lookmototour.com/riders/billyhn` di chat WhatsApp → preview menampilkan **avatar rider**, judul "Riders Billy – {badge}", dan deskripsi excerpt LookMotoTour
4. Tempel link blog/journal/event → preview meta-nya juga benar (bonus, karena route ikut tertangani)
5. Browse normal di `/riders/billyhn` → tidak ada perubahan UX, tetap SPA

### Dampak
- Tidak mengubah React app, tidak mengubah edge function
- Hanya menambah entry worker script + binding `ASSETS`
- Setelah live, semua link riders existing langsung punya preview yang benar — tanpa perlu user pakai prefix `s.lookmototour.com`

