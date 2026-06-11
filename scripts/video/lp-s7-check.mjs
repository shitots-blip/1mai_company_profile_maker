import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' })
const el = page.locator('img[alt="スマホ入力画面"]')
await el.scrollIntoViewIfNeeded()
await page.waitForTimeout(2000)
const info = await el.evaluate(img => ({
  complete: img.complete, nw: img.naturalWidth, nh: img.naturalHeight,
  src: img.currentSrc?.slice(0, 80), display: getComputedStyle(img).display,
  w: img.clientWidth, h: img.clientHeight,
}))
console.log(JSON.stringify(info, null, 2))
await page.screenshot({ path: '/tmp/lp-s7-viewport.png' })
await browser.close()
