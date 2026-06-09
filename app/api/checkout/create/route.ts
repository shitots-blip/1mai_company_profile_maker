import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_COMPANY_PROFILE!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=1`,
      allow_promotion_codes: true,
      locale: 'ja',
      custom_text: {
        submit: {
          message: '決済完了後、会社紹介の作成ページへご案内します。',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const e = err as Error & { type?: string; code?: string }
    console.error('[checkout] Stripe error:', e.type, e.code, e.message)
    return NextResponse.json({ error: 'Checkout session creation failed' }, { status: 500 })
  }
}
