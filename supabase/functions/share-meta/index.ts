import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  if (type === "blog_post") {
    const { data } = await supabase.from("blog_posts").select("*").eq(column, slug).single();
    if (data) {
      title = data.title;
      description = data.excerpt || stripHtml(data.content).slice(0, 200);
      imageUrl = data.image_url || "";
      pageUrl = `${siteUrl}/blog/${data.slug || data.id}`;
    }
  } else if (type === "trip_journal") {
    const { data } = await supabase.from("trip_journals").select("*").eq(column, slug).single();
    if (data) {
      title = data.title;
      description = stripHtml(data.content).slice(0, 200);
      pageUrl = `${siteUrl}/jurnal/${data.slug || data.id}`;
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
    }
  }

  if (!pageUrl) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  // Detect if request is from a social media crawler
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  const isCrawler = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest|googlebot|bingbot/i.test(ua);

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
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Look Moto Tour">
${imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ""}
<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${imageUrl ? `<meta name="twitter:image" content="${esc(imageUrl)}">` : ""}
<link rel="canonical" href="${esc(pageUrl)}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
${imageUrl ? `<img src="${esc(imageUrl)}" alt="${esc(title)}">` : ""}
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

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
