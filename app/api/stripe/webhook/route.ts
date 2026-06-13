import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/token'
import { sendStartMail } from '@/lib/mail'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // customer_email: customer_details.email を優先
  const customerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    null

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null

  const insertPayload = {
    stripe_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    customer_email: customerEmail ?? '',
    amount: session.amount_total ?? 0,
    currency: session.currency ?? 'jpy',
    status: session.payment_status === 'paid' ? 'paid' : (session.payment_status ?? 'unknown'),
  }

  console.log('[webhook] checkout.session.completed', {
    sessionId: session.id,
    paymentIntentId,
    customerEmail,
    amount: session.amount_total,
    livemode: session.livemode,
    insertPayload,
  })

  if (!customerEmail) {
    console.error('[webhook] customer_email is null — cannot send mail, but continuing insert')
  }

  try {
    // ── 冪等処理: 既存 order チェック ─────────────────────────────
    const { data: existingOrder, error: selectError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single()

    // PGRST116 = "no rows returned" は正常。それ以外はログ出力
    if (selectError && selectError.code !== 'PGRST116') {
      const isUnreachable = selectError.message?.includes('fetch failed') || selectError.message?.includes('ENOTFOUND')
      if (isUnreachable) {
        console.error('[webhook] SUPABASE UNREACHABLE — check NEXT_PUBLIC_SUPABASE_URL and project status at https://supabase.com/dashboard', {
          message: selectError.message,
          code: selectError.code,
        })
      } else {
        console.error('[webhook] existing order select error:', { message: selectError.message, code: selectError.code })
      }
    }

    let orderId: string

    if (existingOrder) {
      console.log('[webhook] order already exists, reusing:', existingOrder.id)
      orderId = existingOrder.id
    } else {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert(insertPayload)
        .select()
        .single()

      if (orderError || !order) {
        const isUnreachable = orderError?.message?.includes('fetch failed') || orderError?.message?.includes('ENOTFOUND')
        if (isUnreachable) {
          console.error('[webhook] SUPABASE UNREACHABLE — check NEXT_PUBLIC_SUPABASE_URL and project status at https://supabase.com/dashboard', {
            message: orderError?.message,
          })
        } else {
          console.error('[webhook] orders insert error:', {
            message: orderError?.message,
            details: orderError?.details,
            hint: orderError?.hint,
            code: orderError?.code,
            insertPayload,
          })
        }
        return NextResponse.json({ error: 'orders insert failed', detail: orderError?.message }, { status: 500 })
      }

      orderId = order.id
      console.log('[webhook] order created:', orderId)
    }

    // ── 冪等処理: 既存 company_profile チェック ───────────────────
    const { data: existingProfile } = await supabaseAdmin
      .from('company_profiles')
      .select('id')
      .eq('order_id', orderId)
      .single()

    let profileId: string

    if (existingProfile) {
      console.log('[webhook] company_profile already exists, reusing:', existingProfile.id)
      profileId = existingProfile.id
    } else {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('company_profiles')
        .insert({ order_id: orderId, current_step: 1, status: 'draft' })
        .select()
        .single()

      if (profileError || !profile) {
        console.error('[webhook] company_profiles insert error:', {
          message: profileError?.message,
          details: profileError?.details,
          hint: profileError?.hint,
          code: profileError?.code,
        })
        return NextResponse.json({ error: 'company_profiles insert failed', detail: profileError?.message }, { status: 500 })
      }

      profileId = profile.id
      console.log('[webhook] company_profile created:', profileId)
    }

    // ── 冪等処理: 既存 resume_token チェック ──────────────────────
    const { data: existingToken } = await supabaseAdmin
      .from('resume_tokens')
      .select('token')
      .eq('company_profile_id', profileId)
      .single()

    let token: string

    if (existingToken) {
      console.log('[webhook] resume_token already exists, reusing:', existingToken.token)
      token = existingToken.token
    } else {
      token = generateToken()
      const { error: tokenError } = await supabaseAdmin.from('resume_tokens').insert({
        company_profile_id: profileId,
        token,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      if (tokenError) {
        console.error('[webhook] resume_tokens insert error:', {
          message: tokenError?.message,
          details: tokenError?.details,
          hint: tokenError?.hint,
          code: tokenError?.code,
        })
        return NextResponse.json({ error: 'resume_tokens insert failed', detail: tokenError?.message }, { status: 500 })
      }

      console.log('[webhook] resume_token created:', token)
    }

    const resumeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/create/${token}/start`
    console.log('[webhook] processing complete', { orderId, profileId, token, resumeUrl, customerEmail })

    // ── メール送信 ────────────────────────────────────────────────
    if (customerEmail) {
      try {
        await sendStartMail({ to: customerEmail, resumeUrl })
        console.log('[webhook] start mail sent to', customerEmail)
      } catch (mailErr) {
        console.error('[webhook] start mail failed:', mailErr)
      }
    } else {
      console.warn('[webhook] no customer email — skipping mail')
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook] unexpected error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
