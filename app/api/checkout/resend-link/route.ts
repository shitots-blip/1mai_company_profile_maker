import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/token'
import { sendStartMail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, sessionId } = body as { email?: string; sessionId?: string }

  if (!email && !sessionId) {
    return NextResponse.json({ error: 'email or sessionId required' }, { status: 400 })
  }

  // orders を検索
  let order: { id: string; customer_email: string } | null = null

  if (sessionId) {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id, customer_email')
      .eq('stripe_session_id', sessionId)
      .single()
    order = data
  }

  if (!order && email) {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('id, customer_email')
      .eq('customer_email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    order = data
  }

  if (!order) {
    console.warn('[resend-link] order not found for', { email, sessionId })
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // company_profile 取得
  const { data: profile } = await supabaseAdmin
    .from('company_profiles')
    .select('id')
    .eq('order_id', order.id)
    .single()

  if (!profile) {
    console.error('[resend-link] company_profile not found for order', order.id)
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // resume_token を取得または再発行
  const { data: existing } = await supabaseAdmin
    .from('resume_tokens')
    .select('token, expires_at')
    .eq('company_profile_id', profile.id)
    .single()

  let token: string
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  if (existing && new Date(existing.expires_at) > new Date()) {
    token = existing.token
  } else if (existing) {
    token = generateToken()
    await supabaseAdmin
      .from('resume_tokens')
      .update({ token, expires_at: expiresAt })
      .eq('company_profile_id', profile.id)
  } else {
    token = generateToken()
    await supabaseAdmin
      .from('resume_tokens')
      .insert({ company_profile_id: profile.id, token, expires_at: expiresAt })
  }

  const resumeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/create/${token}/start`
  const to = email ?? order.customer_email

  console.log('[resend-link]', { orderId: order.id, to, token, resumeUrl })

  try {
    await sendStartMail({ to, resumeUrl })
    console.log('[resend-link] mail sent OK to', to)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[resend-link] mail failed:', err)
    return NextResponse.json({ error: 'mail send failed' }, { status: 500 })
  }
}
