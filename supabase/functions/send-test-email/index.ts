// Admin-only test email sender.
// Renders any registered template (auth or transactional) — including admin overrides —
// and sends to a chosen recipient. Bypasses suppression check (test target may already be suppressed).
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const SITE_NAME = 'LookMotoTour'
const SENDER_DOMAIN = 'notify.lookmototour.com'
const FROM_DOMAIN = 'notify.lookmototour.com'
const SITE_URL = 'https://lookmototour.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AUTH_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const AUTH_DEFAULT_SUBJECTS: Record<string, string> = {
  signup: 'Konfirmasi email kamu',
  invite: 'Kamu diundang',
  magiclink: 'Link login kamu',
  recovery: 'Reset password',
  email_change: 'Konfirmasi email baru',
  reauthentication: 'Kode verifikasi',
}

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
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Verify caller is admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const admin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
  if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  let body: any
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }

  const templateName: string = body.templateName
  const recipientEmail: string = body.recipientEmail
  const sampleData: Record<string, any> = body.sampleData || {}
  if (!templateName || !recipientEmail) {
    return new Response(JSON.stringify({ error: 'templateName & recipientEmail required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Render: check override first, then default template (auth or transactional)
  let html = ''
  let plainText = ''
  let subject = ''

  const { data: override } = await admin
    .from('email_template_overrides')
    .select('subject, body_html, body_text, is_active')
    .eq('template_name', templateName)
    .eq('is_active', true)
    .maybeSingle()

  if (override) {
    html = applyPlaceholders(override.body_html || '', sampleData)
    plainText = applyPlaceholders(override.body_text || '', sampleData) || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    subject = applyPlaceholders(override.subject || '', sampleData)
  } else if (AUTH_TEMPLATES[templateName]) {
    const Comp = AUTH_TEMPLATES[templateName]
    const props = {
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      recipient: recipientEmail,
      confirmationUrl: SITE_URL,
      token: '123456',
      email: recipientEmail,
      newEmail: recipientEmail,
      ...sampleData,
    }
    html = await renderAsync(React.createElement(Comp, props))
    plainText = await renderAsync(React.createElement(Comp, props), { plainText: true })
    subject = AUTH_DEFAULT_SUBJECTS[templateName] || 'Test email'
  } else {
    const tpl = TEMPLATES[templateName]
    if (!tpl) return new Response(JSON.stringify({ error: `Template '${templateName}' not found` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    html = await renderAsync(React.createElement(tpl.component, sampleData))
    plainText = await renderAsync(React.createElement(tpl.component, sampleData), { plainText: true })
    subject = typeof tpl.subject === 'function' ? tpl.subject(sampleData) : tpl.subject
  }

  // Always prefix [TEST]
  if (!subject.startsWith('[TEST]')) subject = `[TEST] ${subject}`

  // Generate fresh unsubscribe token (or reuse) so footer link works
  const normalizedEmail = recipientEmail.toLowerCase()
  let unsubscribeToken: string
  const { data: existingToken } = await admin.from('email_unsubscribe_tokens').select('token, used_at').eq('email', normalizedEmail).maybeSingle()
  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token
  } else {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    unsubscribeToken = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
    if (!existingToken) {
      await admin.from('email_unsubscribe_tokens').upsert({ token: unsubscribeToken, email: normalizedEmail }, { onConflict: 'email', ignoreDuplicates: true })
      const { data: re } = await admin.from('email_unsubscribe_tokens').select('token').eq('email', normalizedEmail).maybeSingle()
      if (re) unsubscribeToken = re.token
    } else {
      // token used — overwrite
      await admin.from('email_unsubscribe_tokens').update({ token: unsubscribeToken, used_at: null }).eq('email', normalizedEmail)
    }
  }

  const messageId = crypto.randomUUID()
  const idempotencyKey = `test-${Date.now()}-${user.id}-${templateName}`

  await admin.from('email_send_log').insert({
    message_id: messageId,
    template_name: `test:${templateName}`,
    recipient_email: recipientEmail,
    status: 'pending',
  })

  const { error: enqueueError } = await admin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: recipientEmail,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: `test-${templateName}`,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    await admin.from('email_send_log').insert({ message_id: messageId, template_name: `test:${templateName}`, recipient_email: recipientEmail, status: 'failed', error_message: enqueueError.message })
    return new Response(JSON.stringify({ error: 'Failed to enqueue', details: enqueueError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ success: true, queued: true, used_override: !!override }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
