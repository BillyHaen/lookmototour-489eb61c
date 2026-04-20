interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

const SUPABASE_FUNCTIONS_BASE =
  "https://efrwzkdfkfvedtdrxrfg.supabase.co/functions/v1/share-meta";

const CRAWLER_RE =
  /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest|googlebot|bingbot|instagram|skypeuripreview|applebot|embedly|redditbot|tiktok/i;

const ROUTES: Array<[RegExp, string]> = [
  [/^\/riders\/([^\/]+)\/?$/, "rider"],
  [/^\/blog\/([^\/]+)\/?$/, "blog_post"],
  [/^\/jurnal\/([^\/]+)\/?$/, "trip_journal"],
  [/^\/events\/([^\/]+)\/?$/, "event"],
];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const ua = req.headers.get("user-agent") || "";

    if (CRAWLER_RE.test(ua)) {
      for (const [re, type] of ROUTES) {
        const m = url.pathname.match(re);
        if (m) {
          const slug = decodeURIComponent(m[1]);
          const target = `${SUPABASE_FUNCTIONS_BASE}?type=${encodeURIComponent(
            type,
          )}&slug=${encodeURIComponent(slug)}&site=${encodeURIComponent(url.origin)}`;
          try {
            const r = await fetch(target, {
              headers: { "user-agent": ua, accept: "text/html" },
            });
            // Only use the share-meta HTML if it succeeded; otherwise fall through to SPA
            if (r.ok) {
              return new Response(r.body, {
                status: 200,
                headers: {
                  "content-type": "text/html; charset=utf-8",
                  "cache-control": "public, max-age=300",
                  "x-prerender-by": "share-meta",
                },
              });
            }
          } catch {
            // network failure → fall back to SPA
          }
          break;
        }
      }
    }

    return env.ASSETS.fetch(req);
  },
};
