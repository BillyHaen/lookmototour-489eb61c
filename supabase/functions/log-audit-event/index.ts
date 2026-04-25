import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require an authenticated caller; derive identity from JWT, never trust client-supplied user fields.
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authedUser = userData.user;

    const body = await req.json().catch(() => ({}));
    const { action, status = 'success', error_message, metadata } = body ?? {};

    if (!action || typeof action !== 'string' || action.length > 100) {
      return new Response(JSON.stringify({ error: 'action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || null;
    const userAgent = req.headers.get('user-agent') || null;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolve user_name from server-side profile; ignore client-supplied identity fields.
    let userName: string | null = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', authedUser.id)
      .maybeSingle();
    userName = profile?.name ?? null;

    const safeStatus = ['success', 'failure', 'warning'].includes(status) ? status : 'success';

    const { error } = await supabase.from('audit_logs').insert({
      user_id: authedUser.id,
      user_email: authedUser.email ?? null,
      user_name: userName,
      action,
      status: safeStatus,
      ip_address: ip,
      user_agent: userAgent,
      error_message: typeof error_message === 'string' ? error_message.slice(0, 1000) : null,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });

    if (error) {
      console.error('audit insert error', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('log-audit-event error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
