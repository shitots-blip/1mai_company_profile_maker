// 使い方デモ動画：/dev/screens の画面遷移をスマホ縦サイズで録画
// 流れ：開始 → STEP入力（タップ演出）→ 確認 → 生成中 → 完成 → ダウンロード → 修正
import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')
const BASE = 'http://localhost:3001'
const SIZE = { width: 390, height: 800 }

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: OUT_DIR, size: SIZE },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()

// ---- 演出ヘルパー ----

// 画面下部のキャプションバーを表示（赤字）
// ページ遷移するとDOMごと消えるため、遷移後に自動で再注入する
let lastCaption = null

async function applyCaption(text) {
  await page.evaluate((t) => {
    let bar = document.getElementById('__cap')
    if (!bar) {
      bar = document.createElement('div')
      bar.id = '__cap'
      Object.assign(bar.style, {
        position: 'fixed', left: '12px', right: '12px', top: '54px',
        pointerEvents: 'none',
        background: 'rgba(255,255,255,0.96)', color: '#d92b2b',
        border: '2px solid #d92b2b',
        padding: '10px 16px', borderRadius: '12px',
        fontSize: '15px', fontWeight: '800', textAlign: 'center',
        zIndex: 99999, fontFamily: "'Hiragino Sans', sans-serif",
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        transition: 'opacity 0.3s', opacity: '0',
      })
      document.body.appendChild(bar)
    }
    bar.textContent = t
    requestAnimationFrame(() => { bar.style.opacity = '1' })
  }, text)
}

async function caption(text) {
  lastCaption = text
  await applyCaption(text)
}

// ナビゲーション後にキャプションを復元
page.on('framenavigated', async (frame) => {
  if (frame !== page.mainFrame() || !lastCaption) return
  try {
    await page.waitForLoadState('domcontentloaded')
    await applyCaption(lastCaption)
  } catch { /* クローズ時は無視 */ }
})

// 冒頭タイトルカード（赤字）
async function titleCard(mainText, subText, holdMs) {
  await page.evaluate(([main, sub]) => {
    const card = document.createElement('div')
    card.id = '__title'
    Object.assign(card.style, {
      position: 'fixed', inset: '0',
      background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 999999, fontFamily: "'Hiragino Sans', sans-serif",
      textAlign: 'center', padding: '0 24px',
      transition: 'opacity 0.5s',
    })
    card.innerHTML = `
      <div style="color:#d92b2b;font-size:30px;font-weight:800;line-height:1.5;margin-bottom:14px;">${main}</div>
      <div style="color:#1e3a5f;font-size:15px;font-weight:600;">${sub}</div>
    `
    document.body.appendChild(card)
  }, [mainText, subText])
  await page.waitForTimeout(holdMs)
  await page.evaluate(() => {
    const card = document.getElementById('__title')
    if (card) {
      card.style.opacity = '0'
      setTimeout(() => card.remove(), 550)
    }
  })
  await page.waitForTimeout(600)
}

// 指タップ風の円マークを出してからクリック
async function tap(locator) {
  const box = await locator.boundingBox()
  if (box) {
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.evaluate(([px, py]) => {
      const dot = document.createElement('div')
      Object.assign(dot.style, {
        position: 'fixed', left: px - 22 + 'px', top: py - 22 + 'px',
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'rgba(232,168,56,0.55)', border: '2px solid #e8a838',
        zIndex: 99998, pointerEvents: 'none',
        transition: 'transform 0.35s, opacity 0.35s',
      })
      document.body.appendChild(dot)
      requestAnimationFrame(() => {
        dot.style.transform = 'scale(1.6)'
        dot.style.opacity = '0'
      })
      setTimeout(() => dot.remove(), 450)
    }, [x, y])
    await page.waitForTimeout(420)
  }
  await locator.click()
}

// 未選択チップを1つ「タップして選択」したように見せる
async function fakeSelectChip(text) {
  const chip = page.locator(`div.rounded-full:has-text("${text}")`).first()
  const box = await chip.boundingBox()
  if (!box) return
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.evaluate(([px, py]) => {
    const dot = document.createElement('div')
    Object.assign(dot.style, {
      position: 'fixed', left: px - 22 + 'px', top: py - 22 + 'px',
      width: '44px', height: '44px', borderRadius: '50%',
      background: 'rgba(232,168,56,0.55)', border: '2px solid #e8a838',
      zIndex: 99998, pointerEvents: 'none',
      transition: 'transform 0.35s, opacity 0.35s',
    })
    document.body.appendChild(dot)
    requestAnimationFrame(() => {
      dot.style.transform = 'scale(1.6)'
      dot.style.opacity = '0'
    })
    setTimeout(() => dot.remove(), 450)
  }, [x, y])
  await page.waitForTimeout(380)
  await chip.evaluate((el) => {
    el.className = el.className
      .replace('bg-white', 'bg-[#1e3a5f]')
      .replace('text-gray-600', 'text-white')
      .replace('border-gray-200', 'border-[#1e3a5f]')
  })
}

async function next(label = '次へ') {
  await page.waitForTimeout(700)
  await tap(page.locator(`a:has-text("${label}")`).last())
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
}

// ---- 録画本編 ----

// 0. 冒頭タイトルカード
await page.goto(`${BASE}/dev/screens/start`)
await page.waitForLoadState('networkidle')
await titleCard('使い方を動画で説明', '入力からダウンロード・修正まで、実際の画面でご覧いただけます', 2800)

// 1. 開始画面
await caption('① 作成をはじめる')
await page.waitForTimeout(2400)
await tap(page.locator('a:has-text("作成をはじめる")'))
await page.waitForLoadState('networkidle')

// 2. STEP1 主な営業先
await caption('② 質問にタップで答えるだけ')
await page.waitForTimeout(1200)
await fakeSelectChip('個人住宅オーナー')
await page.waitForTimeout(800)
await next()

// 3. STEP2〜7 をテンポよく
const stepCaptions = [
  '対応サービスを選択', '対応する建物を選択', 'お客様の声を選択',
  '大切にしていることを選択', '会社の基本情報を入力', '代表者情報を入力',
]
for (const cap of stepCaptions) {
  await caption(`② ${cap}`)
  await page.waitForTimeout(1500)
  await next()
}

// 4. 写真追加 → 確認
await caption('③ 写真はあとからでもOK')
await page.waitForTimeout(1800)
await next('写真なしで進む')

await caption('④ 内容を確認して作成')
await page.waitForTimeout(1500)
await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }))
await page.waitForTimeout(1200)
await page.evaluate(() => window.scrollBy({ top: 99999, behavior: 'smooth' }))
await page.waitForTimeout(1000)
const createBtn = page.locator('a[href="/dev/screens/generating"]')
await tap(createBtn)

// 5. 生成中（自動で完成画面へ遷移する）
await caption('⑤ 自動で文章を整えています…')
await page.waitForURL('**/complete', { timeout: 30000 })

// 6. 完成画面
await caption('⑥ 完成！そのままダウンロード')
await page.waitForTimeout(1800)
await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }))
await page.waitForTimeout(1200)
const pdfBtn = page.locator('button:has-text("印刷用データ"), a:has-text("印刷用データ")').first()
if (await pdfBtn.count()) {
  await tap(pdfBtn)
  await page.waitForTimeout(1500)
}

// 7. 修正フロー
await caption('⑦ 30日以内なら何度でも修正できます')
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
await page.waitForTimeout(1200)
const editLink = page.locator('a:has-text("内容を修正"), button:has-text("内容を修正")').first()
await tap(editLink)
await page.waitForLoadState('networkidle')
await caption('⑦ 選び直して、もう一度ダウンロード')
await page.waitForTimeout(1000)
await fakeSelectChip('病院・介護施設')
await page.waitForTimeout(2200)

const video = page.video()
await context.close()
await browser.close()

const tmpPath = await video.path()
const finalPath = path.join(OUT_DIR, 'howto.webm')
fs.renameSync(tmpPath, finalPath)
console.log('saved:', finalPath)
