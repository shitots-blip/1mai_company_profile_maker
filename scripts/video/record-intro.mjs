// intro.html（モーショングラフィックス）を32秒録画して webm を出力
import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'out')
const SIZE = { width: 1280, height: 720 }

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: OUT_DIR, size: SIZE },
})
const page = await context.newPage()

// サンプル画像を先に読み込ませてから本編を開く（録画中の画像ロード待ちを防ぐ）
await page.goto('http://localhost:3001/lp-sample-chiba.png')
await page.goto('file://' + path.join(__dirname, 'intro.html'))
await page.waitForLoadState('networkidle')
await page.waitForTimeout(33000)

const video = page.video()
await context.close()
await browser.close()

const tmpPath = await video.path()
const finalPath = path.join(OUT_DIR, 'intro.webm')
fs.renameSync(tmpPath, finalPath)
console.log('saved:', finalPath)
