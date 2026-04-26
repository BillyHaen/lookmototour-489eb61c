import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/pepMzwtt4BPYlFtncYYdEt05zma2/social-images/social-1776066755380-LOOKMOTOTOUR-01.webp";
const SITE_NAME = "Look Moto Tour";
const LOCALE = "id_ID";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const slug = url.searchParams.get("slug");
  const siteUrl = url.searchParams.get("site") || "https://lookmototour.com";

  if (!type || !slug) {
    return new Response("Missing params", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const column = isUuid ? "id" : "slug";

  let title = "";
  let description = "";
  let imageUrl = "";
  let pageUrl = "";
  let publishedAt = "";
  let ogType: "article" | "website" = "article";

  if (type === "blog_post") {
    const { data } = await supabase.from("blog_posts").select("*").eq(column, slug).single();
    if (data) {
      title = data.title;
      description = data.excerpt || stripHtml(data.content).slice(0, 200);
      imageUrl = data.image_url || "";
      pageUrl = `${siteUrl}/blog/${data.slug || data.id}`;
      publishedAt = data.published_at || data.created_at || "";
      ogType = "article";
    }
  } else if (type === "trip_journal") {
    const { data } = await supabase.from("trip_journals").select("*").eq(column, slug).single();
    if (data) {
      title = data.title;
      description = stripHtml(data.content).slice(0, 200);
      pageUrl = `${siteUrl}/jurnal/${data.slug || data.id}`;
      publishedAt = data.published_at || data.created_at || "";
      ogType = "article";
      const { data: images } = await supabase
        .from("trip_journal_images")
        .select("image_url")
        .eq("journal_id", data.id)
        .order("sort_order", { ascending: true })
        .limit(1);
      imageUrl = images?.[0]?.image_url || "";
    }
  } else if (type === "event") {
    const { data } = await supabase.from("events").select("*").eq(column, slug).single();
    if (data) {
      title = data.title;
      description = stripHtml(data.description).slice(0, 200);
      imageUrl = data.image_url || "";
      pageUrl = `${siteUrl}/events/${data.slug || data.id}`;
      publishedAt = data.created_at || "";
      ogType = "website";
    }
  }

  if (!pageUrl) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  // Sanitize fields per WhatsApp/Facebook/Instagram rules
  // - Title: <= 60 chars (WhatsApp truncates ~65)
  // - Description: <= 160 chars (WhatsApp truncates ~160, FB ~200)
  // - Image: must be absolute HTTPS, < 5MB, prefer 1200x630 (1.91:1)
  title = clamp(oneLine(title), 60);
  description = clamp(oneLine(description), 160);
  imageUrl = normalizeImage(imageUrl) || FALLBACK_IMAGE;
  const imageType = guessImageMime(imageUrl);

  // Detect if request is from a social media crawler
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  const isCrawler =
    /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest|googlebot|bingbot|instagram|skypeuripreview|applebot|embedly|redditbot|tiktok/i.test(
      ua,
    );

  // For regular users: redirect immediately to the actual page
  if (!isCrawler) {
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": pageUrl,
      },
    });
  }

  // For crawlers: return HTML with OG tags
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="${LOCALE}">
<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:image:secure_url" content="${esc(imageUrl)}">
<meta property="og:image:type" content="${imageType}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
${publishedAt ? `<meta property="article:published_time" content="${esc(publishedAt)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@lookmototour">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(imageUrl)}">
<meta name="twitter:image:alt" content="${esc(title)}">
<link rel="canonical" href="${esc(pageUrl)}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<img src="${esc(imageUrl)}" alt="${esc(title)}">
<p><a href="${esc(pageUrl)}">Baca selengkapnya</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function stripHtml(str: string): string {
  return (str || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function oneLine(str: string): string {
  return (str || "").replace(/\s+/g, " ").trim();
}

function clamp(str: string, max: number): string {
  if (!str) return str;
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}

function normalizeImage(src: string): string {
  if (!src) return "";
  // WhatsApp/Facebook require absolute HTTPS URLs
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("http://")) return "https://" + src.slice(7);
  if (src.startsWith("https://")) return src;
  return "";
}

function guessImageMime(src: string): string {
  const lower = src.toLowerCase().split("?")[0];
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
