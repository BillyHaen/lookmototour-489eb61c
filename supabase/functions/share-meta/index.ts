import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // blog_post, trip_journal, event
  const slug = url.searchParams.get("slug");

  if (!type || !slug) {
    return new Response("Missing params", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Determine the site base URL from the request's origin or referer
  const siteUrl = url.searchParams.get("site") || "https://lookmototour.com";

  let title = "";
  let description = "";
  let imageUrl = "";
  let pageUrl = "";

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const column = isUuid ? "id" : "slug";

  if (type === "blog_post") {
    const { data } = await supabase.from("blog_posts").select("*").eq(column, slug).single();
    if (data) {
      title = data.title;
      description = data.excerpt || data.content?.replace(/<[^>]*>/g, "").slice(0, 160) || "";
      imageUrl = data.image_url || "";
      pageUrl = `${siteUrl}/blog/${data.slug || data.id}`;
    }
  } else if (type === "trip_journal") {
    const { data } = await supabase.from("trip_journals").select("*").eq(column, slug).single();
    if (data) {
      title = data.title;
      description = data.content?.replace(/<[^>]*>/g, "").slice(0, 160) || "";
      pageUrl = `${siteUrl}/jurnal/${data.slug || data.id}`;
      // Get first image from journal
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
      description = data.description?.replace(/<[^>]*>/g, "").slice(0, 160) || "";
      imageUrl = data.image_url || "";
      pageUrl = `${siteUrl}/events/${data.slug || data.id}`;
    }
  }

  if (!pageUrl) {
    return new Response("Not found", { status: 404 });
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : ""}
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ""}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
