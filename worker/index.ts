interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

const SUPABASE_FUNCTIONS_BASE =
  "https://efrwzkdfkfvedtdrxrfg.supabase.co/functions/v1/share-meta";

const CANONICAL_ORIGIN = "https://lookmototour.com";

const CRAWLER_RE =
  /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest|googlebot|bingbot|instagram|skypeuripreview|applebot|embedly|redditbot|tiktok/i;

// Routes for canonical paths like /riders/:username
const CANONICAL_ROUTES: Array<[RegExp, string]> = [
  [/^\/riders\/([^\/]+)\/?$/, "rider"],
  [/^\/blog\/([^\/]+)\/?$/, "blog_post"],
  [/^\/jurnal\/([^\/]+)\/?$/, "trip_journal"],
  [/^\/events\/([^\/]+)\/?$/, "event"],
];

// Routes for short share paths like /s/rider/:slug
const SHARE_ROUTES: Array<[RegExp, string, (slug: string) => string]> = [
  [/^\/s\/rider\/([^\/]+)\/?$/, "rider", (s) => `/riders/${s}`],
  [/^\/s\/blog_post\/([^\/]+)\/?$/, "blog_post", (s) => `/blog/${s}`],
  [/^\/s\/blog\/([^\/]+)\/?$/, "blog_post", (s) => `/blog/${s}`],
  [/^\/s\/trip_journal\/([^\/]+)\/?$/, "trip_journal", (s) => `/jurnal/${s}`],
  [/^\/s\/jurnal\/([^\/]+)\/?$/, "trip_journal", (s) => `/jurnal/${s}`],
  [/^\/s\/event\/([^\/]+)\/?$/, "event", (s) => `/events/${s}`],
];

async function fetchShareMetaHtml(
  type: string,
  slug: string,
  ua: string,
  siteOrigin: string,
): Promise<Response | null> {
  const target = `${SUPABASE_FUNCTIONS_BASE}?type=${encodeURIComponent(
    type,
  )}&slug=${encodeURIComponent(slug)}&site=${encodeURIComponent(siteOrigin)}`;
  try {
    const r = await fetch(target, {
      headers: { "user-agent": ua, accept: "text/html" },
    });
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
    // network failure → caller falls back
  }
  return null;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const ua = req.headers.get("user-agent") || "";
    const isCrawler = CRAWLER_RE.test(ua);

    // 1. Short share URLs: /s/<type>/<slug>
    for (const [re, type, toCanonical] of SHARE_ROUTES) {
      const m = url.pathname.match(re);
      if (m) {
        const slug = decodeURIComponent(m[1]);
        if (isCrawler) {
          const prerendered = await fetchShareMetaHtml(
            type,
            slug,
            ua,
            CANONICAL_ORIGIN,
          );
          if (prerendered) return prerendered;
        }
        // Non-crawler (or prerender failed): redirect humans to canonical page
        return Response.redirect(
          `${CANONICAL_ORIGIN}${toCanonical(slug)}`,
          302,
        );
      }
    }

    // 2. Canonical URLs: only intercept for crawlers
    if (isCrawler) {
      for (const [re, type] of CANONICAL_ROUTES) {
        const m = url.pathname.match(re);
        if (m) {
          const slug = decodeURIComponent(m[1]);
          const prerendered = await fetchShareMetaHtml(
            type,
            slug,
            ua,
            url.origin,
          );
          if (prerendered) return prerendered;
          break;
        }
      }
    }

    return env.ASSETS.fetch(req);
  },
};
