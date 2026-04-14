import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, events } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const eventsContext = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      location: e.location,
      price_sharing: e.price_sharing,
      price_single: e.price_single,
      difficulty: e.difficulty,
      touring_style: e.touring_style,
      rider_level: e.rider_level,
      motor_types: e.motor_types,
      distance: e.distance,
      tentative_month: e.tentative_month,
      status: e.status,
    }));

    const systemPrompt = `Kamu adalah AI trip advisor untuk komunitas motor touring Indonesia.
User menjawab kuisioner dan kamu harus mencocokkan mereka dengan event touring yang tersedia.

Aturan matching:
- experience: "pemula" → cocokkan dengan difficulty mudah/sedang dan rider_level all/pemula. "menengah" → sedang. "expert" → sulit.
- budget: cocokkan dengan price_sharing/price_single. "<500000" = murah, "500000-1500000" = menengah, "1500000-3000000" = premium, ">3000000" = luxury.
- style: "santai" → touring_style adventure/leisure. "gaspol" → adventure/enduro. "luxury" → luxury. "spiritual" → spiritual/cultural.
- view: cocokkan dengan location keywords. pantai=pantai/beach/coast/laut. gunung=gunung/mountain/highland. kota=kota/city/urban. pedesaan=desa/village/rural.

Kategorikan event menjadi:
1. "Perfect Match" (🎯) - cocok di 3-4 kriteria
2. "Worth Trying" (🔥) - cocok di 2 kriteria  
3. "Something Different" (💡) - wildcard yang menarik walaupun tidak matching sempurna

Berikan alasan singkat dalam bahasa Indonesia untuk setiap event (1-2 kalimat).
Jika tidak ada event yang cocok untuk suatu kategori, kosongkan array-nya.`;

    const userPrompt = `Jawaban user:
- Pengalaman: ${answers.experience}
- Budget: ${answers.budget}
- Gaya touring: ${answers.style}
- Prefer view: ${answers.view}

Event tersedia:
${JSON.stringify(eventsContext, null, 2)}

Cocokkan user dengan event yang tersedia.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "trip_match_results",
              description: "Return categorized event recommendations",
              parameters: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        emoji: { type: "string" },
                        event_ids: { type: "array", items: { type: "string" } },
                      },
                      required: ["label", "emoji", "event_ids"],
                    },
                  },
                  reasons: {
                    type: "object",
                    additionalProperties: { type: "string" },
                  },
                },
                required: ["categories", "reasons"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "trip_match_results" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak request, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-trip-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
