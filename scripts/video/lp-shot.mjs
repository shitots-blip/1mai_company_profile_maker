import { chromium } from 'playwright'
const browser = await chromium.launch()
// Desktop
const dp = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await dp.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
await dp.waitForTimeout(1500)
await dp.screenshot({ path: '/tmp/lp-desktop-full.png', fullPage: true })
// Mobile
const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 })
await mp.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
await mp.waitForTimeout(1500)
await mp.screenshot({ path: '/tmp/lp-mobile-full.png', fullPage: true })
await browser.close()
console.log('done')
