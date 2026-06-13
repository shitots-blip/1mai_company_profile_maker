/**
 * POST /api/admin/recover-session
 * 307リダイレクト問題で未処理になった決済を手動復旧するAPI。
 *
 * 使い方：
 *   curl -X POST https://www.1mai.jp/api/admin/recover-session \
 *     -H "x-admin-secret: <ADMIN_SECRET>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"sessionId": "cs_live_xxxxx"}'
 */
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/token'
import { sendStartMail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  // 管理者認証
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { sessionId } = await req.json().catch(() => ({}))
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  console.log('[recover] starting recovery for session', sessionId)

  // Stripe から session 情報を取得
  let session
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error('[recover] stripe session fetch failed:', err)
    return NextResponse.json({ error: 'stripe session not found' }, { status: 404 })
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: `payment_status is ${session.payment_status}, not paid` }, { status: 400 })
  }

  const result: Record<string, unknown> = {
    sessionId,
    email: session.customer_details?.email,
    amount: session.amount_total,
  }

  // 既に orders に存在するか確認
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .single()

  if (existingOrder) {
    result.orderId = existingOrder.id
    result.orderStatus = 'already_exists'
    console.log('[recover] order already exists:', existingOrder.id)
  } else {
    // orders 作成
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        customer_email: session.customer_details?.email ?? '',
        amount: session.amount_total ?? 0,
        currency: session.currency ?? 'jpy',
        status: 'paid',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[recover] orders insert failed:', orderError)
      return NextResponse.json({ error: 'orders insert failed', detail: orderError }, { status: 500 })
    }

    result.orderId = order.id
    result.orderStatus = 'created'
    console.log('[recover] order created:', order.id)

    // company_profiles 作成
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('company_profiles')
      .insert({ order_id: order.id, current_step: 1, status: 'draft' })
      .select()
      .single()

    if (profileError || !profile) {
      console.error('[recover] company_profiles insert failed:', profileError)
      return NextResponse.json({ error: 'company_profiles insert failed', detail: profileError }, { status: 500 })
    }

    result.profileId = profile.id

    // resume_tokens 発行
    const token = generateToken()
    const { error: tokenError } = await supabaseAdmin.from('resume_tokens').insert({
      company_profile_id: profile.id,
      token,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (tokenError) {
      console.error('[recover] resume_tokens insert failed:', tokenError)
      return NextResponse.json({ error: 'resume_tokens insert failed', detail: tokenError }, { status: 500 })
    }

    result.token = token
    result.resumeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/create/${token}/start`
    console.log('[recover] token created:', token)
  }

  // 既存 order から token を取得してメール送信
  if (result.orderStatus === 'already_exists') {
    const { data: profile } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .eq('order_id', result.orderId as string)
      .single()

    if (profile) {
      const { data: resumeToken } = await supabaseAdmin
        .from('resume_tokens')
        .select('token')
        .eq('company_profile_id', profile.id)
        .single()

      if (resumeToken) {
        result.token = resumeToken.token
        result.resumeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/create/${resumeToken.token}/start`
      }
    }
  }

  // メール送信
  const customerEmail = session.customer_details?.email
  if (customerEmail && result.resumeUrl) {
    try {
      await sendStartMail({ to: customerEmail, resumeUrl: result.resumeUrl as string })
      result.mailStatus = 'sent'
      console.log('[recover] mail sent to', customerEmail)
    } catch (mailErr) {
      result.mailStatus = 'failed'
      result.mailError = String(mailErr)
      console.error('[recover] mail failed:', mailErr)
    }
  } else {
    result.mailStatus = 'skipped_no_email'
  }

  console.log('[recover] completed:', result)
  return NextResponse.json({ success: true, ...result })
}
