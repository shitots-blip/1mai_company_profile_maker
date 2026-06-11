import { chromium } from 'playwright'
const browser = await chromium.launch()
const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 })
await mp.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
await mp.waitForTimeout(1200)
await mp.screenshot({ path: '/tmp/final-mobile.png' })
await browser.close()
console.log('ok')
