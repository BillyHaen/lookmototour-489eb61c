import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const SITE_NAME = "LookMotoTour"
const SENDER_DOMAIN = "notify.lookmototour.com"
const FROM_DOMAIN = "notify.lookmototour.com"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Simple {{var}} placeholder replacer for admin-edited overrides.
function applyPlaceholders(input: string, data: Record<string, any>): string {
  if (!input) return input
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = data?.[key]
    if (v === undefined || v === null) return ''
    return String(v)
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // === Authentication: require valid user JWT ===
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const token = authHeader.replace('Bearer ', '')
  // Reject the anon/publishable key being used directly as a JWT
  if (token === supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  let subjectOverride: string | undefined
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') templateData = body.templateData
    if (typeof body.subjectOverride === 'string') subjectOverride = body.subjectOverride
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (!templateName) {
    return new Response(JSON.stringify({ error: 'templateName is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    return new Response(JSON.stringify({ error: `Template '${templateName}' not found` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const effectiveRecipient = template.to || recipientEmail
  if (!effectiveRecipient) {
    return new Response(JSON.stringify({ error: 'recipientEmail is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Suppression check
  const { data: suppressed } = await supabase.from('suppressed_emails').select('id').eq('email', effectiveRecipient.toLowerCase()).maybeSingle()
  if (suppressed) {
    await supabase.from('email_send_log').insert({ message_id: messageId, template_name: templateName, recipient_email: effectiveRecipient, status: 'suppressed' })
    return new Response(JSON.stringify({ success: false, reason: 'email_suppressed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Unsubscribe token (one per email)
  const normalizedEmail = effectiveRecipient.toLowerCase()
  let unsubscribeToken: string
  const { data: existingToken } = await supabase.from('email_unsubscribe_tokens').select('token, used_at').eq('email', normalizedEmail).maybeSingle()
  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    unsubscribeToken = generateToken()
    await supabase.from('email_unsubscribe_tokens').upsert({ token: unsubscribeToken, email: normalizedEmail }, { onConflict: 'email', ignoreDuplicates: true })
    const { data: storedToken } = await supabase.from('email_unsubscribe_tokens').select('token').eq('email', normalizedEmail).maybeSingle()
    if (!storedToken) {
      return new Response(JSON.stringify({ error: 'Failed to prepare email' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    unsubscribeToken = storedToken.token
  } else {
    return new Response(JSON.stringify({ success: false, reason: 'email_suppressed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // === Override check ===
  let html: string
  let plainText: string
  let resolvedSubject: string

  const { data: override } = await supabase
    .from('email_template_overrides')
    .select('subject, body_html, body_text, is_active')
    .eq('template_name', templateName)
    .eq('is_active', true)
    .maybeSingle()

  if (override) {
    html = applyPlaceholders(override.body_html || '', templateData)
    plainText = applyPlaceholders(override.body_text || '', templateData) || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    resolvedSubject = applyPlaceholders(override.subject || '', templateData)
  } else {
    html = await renderAsync(React.createElement(template.component, templateData))
    plainText = await renderAsync(React.createElement(template.component, templateData), { plainText: true })
    resolvedSubject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject
  }

  if (subjectOverride) resolvedSubject = subjectOverride

  await supabase.from('email_send_log').insert({ message_id: messageId, template_name: templateName, recipient_email: effectiveRecipient, status: 'pending' })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    await supabase.from('email_send_log').insert({ message_id: messageId, template_name: templateName, recipient_email: effectiveRecipient, status: 'failed', error_message: 'Failed to enqueue email' })
    return new Response(JSON.stringify({ error: 'Failed to enqueue email' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ success: true, queued: true, used_override: !!override }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
