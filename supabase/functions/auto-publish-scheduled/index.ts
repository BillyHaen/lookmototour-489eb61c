import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const nowIso = new Date().toISOString();

    const { data: posts, error: postsErr } = await supabase
      .from('blog_posts')
      .update({ status: 'published', published_at: nowIso })
      .eq('status', 'draft')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', nowIso)
      .select('id, title');
    if (postsErr) throw postsErr;

    const { data: journals, error: jerr } = await supabase
      .from('trip_journals')
      .update({ status: 'published', published_at: nowIso })
      .eq('status', 'draft')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', nowIso)
      .select('id, title');
    if (jerr) throw jerr;

    return new Response(
      JSON.stringify({
        published_posts: posts?.length || 0,
        published_journals: journals?.length || 0,
        items: { posts, journals },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('auto-publish-scheduled error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
