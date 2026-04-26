import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Category relevance lookup: motor_type -> sponsor categories with weight
const RELEVANCE_MAP: Record<string, Record<string, number>> = {
  sport: { gear: 1.0, accessories: 0.8, apparel: 0.7, dealer: 0.6, service: 0.5, other: 0.3 },
  touring: { accessories: 1.0, gear: 0.9, dealer: 0.8, service: 0.7, apparel: 0.6, other: 0.3 },
  adventure: { accessories: 1.0, gear: 1.0, dealer: 0.7, service: 0.7, apparel: 0.6, other: 0.3 },
  naked: { gear: 0.9, accessories: 0.8, apparel: 0.7, dealer: 0.6, service: 0.5, other: 0.3 },
  cruiser: { apparel: 1.0, accessories: 0.8, dealer: 0.7, gear: 0.6, service: 0.5, other: 0.3 },
  default: { dealer: 0.7, gear: 0.7, accessories: 0.7, apparel: 0.6, service: 0.5, other: 0.3 },
};

const PACKAGE_TIER: Record<string, number> = { gold: 3, silver: 2, bronze: 1, custom: 1.5 };

function inferUserSegments(motorTypes: string[], category: string | null): string[] {
  const segs: string[] = [];
  motorTypes.forEach((m) => segs.push(`motor_type:${m.toLowerCase()}`));
  if (category) segs.push(`category:${category}`);
  return segs;
}

function detectMotorClass(motorType: string): string {
  const t = motorType.toLowerCase();
  if (t.includes("sport") || t.includes("supersport")) return "sport";
  if (t.includes("tour")) return "touring";
  if (t.includes("adv") || t.includes("trail")) return "adventure";
  if (t.includes("naked")) return "naked";
  if (t.includes("cruiser") || t.includes("chopper")) return "cruiser";
  return "default";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(url, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { context = {}, limit = 10, fast = false, target_user_id } = body;
    const { event_id = null } = context;

    // Resolve user
    let userId: string | null = null;
    if (target_user_id) {
      // Admin preview mode
      const { data: { user } } = await anon.auth.getUser(token);
      if (!user) return new Response(JSON.stringify({ error: "Auth required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      userId = target_user_id;
    } else {
      const { data: { user } } = await anon.auth.getUser(token);
      userId = user?.id || null;
    }

    // Load config
    const { data: config } = await admin.from("sponsor_ai_config").select("*").eq("id", 1).maybeSingle();
    const W = {
      relevance: Number(config?.weight_relevance ?? 1),
      behavior: Number(config?.weight_behavior ?? 1),
      priority: Number(config?.weight_priority ?? 1),
      performance: Number(config?.weight_performance ?? 1),
      trip_context: Number(config?.weight_trip_context ?? 1),
    };
    const useAi = !!config?.use_ai_rerank && !fast && !!lovableKey;

    // Load active sponsors
    const { data: sponsors } = await admin.from("sponsors").select("id, name, slug, logo_url, tagline, category").eq("status", "active");
    if (!sponsors?.length) return new Response(JSON.stringify({ recommendations: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // User context
    let userMotorClass = "default";
    let userSegments: string[] = [];
    let pastEventCategories: string[] = [];

    if (userId) {
      const { data: regs } = await admin
        .from("event_registrations")
        .select("motor_type, status, events(category)")
        .eq("user_id", userId);
      const confirmed = (regs || []).filter((r: any) => r.status === "confirmed");
      const motorTypes = Array.from(new Set(confirmed.map((r: any) => r.motor_type).filter(Boolean)));
      pastEventCategories = Array.from(new Set(confirmed.map((r: any) => r.events?.category).filter(Boolean)));
      if (motorTypes.length) userMotorClass = detectMotorClass(motorTypes[0] as string);
      userSegments = inferUserSegments(motorTypes as string[], pastEventCategories[0] || null);
    }

    // Blacklist
    const { data: blacklist } = await admin.from("sponsor_blacklist").select("sponsor_id, segment");
    const blockedSponsors = new Set(
      (blacklist || []).filter((b: any) => userSegments.includes(b.segment)).map((b: any) => b.sponsor_id)
    );

    // Boosts (active)
    const { data: boosts } = await admin.from("sponsor_boosts").select("sponsor_id, boost_multiplier, expires_at");
    const boostMap = new Map<string, number>();
    (boosts || []).forEach((b: any) => {
      if (!b.expires_at || new Date(b.expires_at) > new Date()) {
        boostMap.set(b.sponsor_id, Math.max(boostMap.get(b.sponsor_id) || 1, Number(b.boost_multiplier) || 1));
      }
    });

    // Packages (latest active per sponsor)
    const { data: packages } = await admin.from("sponsor_packages").select("sponsor_id, package_type").eq("is_active", true);
    const tierMap = new Map<string, number>();
    (packages || []).forEach((p: any) => {
      tierMap.set(p.sponsor_id, Math.max(tierMap.get(p.sponsor_id) || 0, PACKAGE_TIER[p.package_type] || 1));
    });

    // Performance (last 30d)
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data: perf } = await admin.from("sponsor_performance_daily").select("sponsor_id, clicks, conversions, impressions").gte("date", since);
    const perfMap = new Map<string, { clicks: number; conv: number; imp: number }>();
    (perf || []).forEach((p: any) => {
      const cur = perfMap.get(p.sponsor_id) || { clicks: 0, conv: 0, imp: 0 };
      cur.clicks += p.clicks; cur.conv += p.conversions; cur.imp += p.impressions;
      perfMap.set(p.sponsor_id, cur);
    });

    // User behavior with each sponsor
    const behaviorMap = new Map<string, { clicks: number; leads: number; conv: number }>();
    if (userId) {
      const { data: ev } = await admin.from("sponsor_events").select("sponsor_id, event_type").eq("user_id", userId);
      (ev || []).forEach((e: any) => {
        const cur = behaviorMap.get(e.sponsor_id) || { clicks: 0, leads: 0, conv: 0 };
        if (e.event_type === "click") cur.clicks++;
        else if (e.event_type === "lead") cur.leads++;
        else if (e.event_type === "conversion") cur.conv++;
        behaviorMap.set(e.sponsor_id, cur);
      });
    }

    // Trip context
    let tripSponsorIds = new Set<string>();
    if (event_id) {
      const { data: rels } = await admin.from("sponsor_trip_relations").select("sponsor_id").eq("event_id", event_id);
      (rels || []).forEach((r: any) => tripSponsorIds.add(r.sponsor_id));
    }

    // Score each sponsor
    const relTable = RELEVANCE_MAP[userMotorClass] || RELEVANCE_MAP.default;
    const scored = sponsors
      .filter((s: any) => !blockedSponsors.has(s.id))
      .map((s: any) => {
        const relevance = relTable[s.category] ?? 0.4;
        const beh = behaviorMap.get(s.id) || { clicks: 0, leads: 0, conv: 0 };
        const behavior = Math.log(1 + beh.clicks * 1 + beh.leads * 3 + beh.conv * 5);
        const tier = tierMap.get(s.id) || 1;
        const boost = boostMap.get(s.id) || 1;
        const priority = (tier / 3) * boost;
        const pf = perfMap.get(s.id) || { clicks: 0, conv: 0, imp: 0 };
        const performance = pf.clicks > 0 ? pf.conv / pf.clicks : 0;
        const trip_context = tripSponsorIds.has(s.id) ? 1 : 0;

        const final =
          relevance * W.relevance +
          behavior * W.behavior +
          priority * W.priority +
          performance * W.performance +
          trip_context * W.trip_context;

        return {
          sponsor: s,
          score: Number(final.toFixed(4)),
          reason: { relevance, behavior, priority, performance, trip_context, boost, tier },
        };
      })
      .sort((a, b) => b.score - a.score);

    let top = scored.slice(0, limit);

    // Optional AI re-rank of top 10
    if (useAi && top.length > 1) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You re-rank motorcycle sponsor recommendations based on user fit. Return only the tool call." },
              {
                role: "user",
                content: `User motor class: ${userMotorClass}. Past trip categories: ${pastEventCategories.join(",") || "none"}. Candidates:\n${top.map((t, i) => `${i}. ${t.sponsor.name} (${t.sponsor.category}) score=${t.score}`).join("\n")}\n\nReturn re-ranked indices best-fit first.`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "rerank",
                description: "Return reordered candidate indices.",
                parameters: { type: "object", properties: { order: { type: "array", items: { type: "integer" } } }, required: ["order"], additionalProperties: false },
              },
            }],
            tool_choice: { type: "function", function: { name: "rerank" } },
          }),
        });
        if (aiResp.ok) {
          const j = await aiResp.json();
          const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (args) {
            const order: number[] = JSON.parse(args).order;
            const reranked = order.map((i) => top[i]).filter(Boolean);
            if (reranked.length === top.length) top = reranked;
          }
        }
      } catch (e) {
        console.error("AI rerank failed:", e);
      }
    }

    // Cache scores for this user
    if (userId && top.length) {
      const rows = top.map((t) => ({
        user_id: userId,
        sponsor_id: t.sponsor.id,
        score: t.score,
        reason: t.reason,
        computed_at: new Date().toISOString(),
      }));
      await admin.from("sponsor_user_scores").upsert(rows);
    }

    return new Response(JSON.stringify({ recommendations: top, user_class: userMotorClass }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-sponsors error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
