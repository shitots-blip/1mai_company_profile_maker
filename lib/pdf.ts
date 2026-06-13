export async function generatePdfAndPng(html: string): Promise<{
  pdfBuffer: Buffer
  pngBuffer: Buffer
}> {
  const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any

  if (isServerless) {
    const [{ chromium: playwrightCore }, chromiumMod] = await Promise.all([
      import('playwright-core'),
      import('@sparticuz/chromium'),
    ])
    const chromium = chromiumMod.default
    const executablePath = await chromium.executablePath()
    console.log('[pdf] serverless mode, chromium at:', executablePath)
    browser = await playwrightCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    })
  } else {
    const { chromium: local } = await import('playwright')
    console.log('[pdf] local mode, using bundled playwright chromium')
    browser = await local.launch({ headless: true })
  }

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.emulateMedia({ media: 'print' })

    const pdfBuffer = Buffer.from(
      await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      })
    )

    await page.emulateMedia({ media: 'screen' })
    await page.setViewportSize({ width: 794, height: 1123 })

    const pngBuffer = Buffer.from(
      await page.screenshot({
        fullPage: false,
        type: 'png',
        clip: { x: 0, y: 0, width: 794, height: 1123 },
      })
    )

    return { pdfBuffer, pngBuffer }
  } finally {
    await browser.close()
  }
}
