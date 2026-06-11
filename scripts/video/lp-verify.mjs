import { chromium } from 'playwright'
const browser = await chromium.launch()
const dp = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await dp.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
await dp.waitForTimeout(1500)
await dp.screenshot({ path: '/tmp/new-hero.png' })
// S2 cards
await dp.locator('text=営業のチャンスを逃してしまいます').scrollIntoViewIfNeeded()
await dp.waitForTimeout(800)
await dp.screenshot({ path: '/tmp/new-s2.png' })
// video section
await dp.locator('text=5分ほどの入力で完成します').scrollIntoViewIfNeeded()
await dp.waitForTimeout(1500)
await dp.screenshot({ path: '/tmp/new-s6.png' })
// pricing
await dp.locator('h2:has-text("料金")').scrollIntoViewIfNeeded()
await dp.waitForTimeout(800)
await dp.screenshot({ path: '/tmp/new-price.png' })
// final CTA
await dp.locator('text=まずは1枚、').scrollIntoViewIfNeeded()
await dp.waitForTimeout(800)
await dp.screenshot({ path: '/tmp/new-cta.png' })
// mobile
const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 })
await mp.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
await mp.waitForTimeout(1500)
await mp.screenshot({ path: '/tmp/new-mobile-hero.png' })
await mp.evaluate(() => window.scrollBy(0, 900))
await mp.waitForTimeout(800)
await mp.screenshot({ path: '/tmp/new-mobile-2.png' })
await browser.close()
console.log('done')
