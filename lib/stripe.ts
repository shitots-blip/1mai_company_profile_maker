import Stripe from 'stripe'

/** Stripeインスタンスを遅延生成（ビルド時にAPIキー不要） */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('[stripe] STRIPE_SECRET_KEY is not set')
  return new Stripe(key, { apiVersion: '2026-05-27.dahlia' })
}
