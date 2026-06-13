import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('s')
  if (secret !== (process.env.ADMIN_SECRET ?? '').trim()) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const result: Record<string, unknown> = {
    env: {
      VERCEL: process.env.VERCEL,
      NODE_VERSION: process.version,
    },
  }

  try {
    const chromiumMod = await import('@sparticuz/chromium')
    const chromium = chromiumMod.default
    result.chromiumImport = 'ok'

    try {
      const executablePath = await chromium.executablePath()
      result.executablePath = executablePath
      result.fileExists = existsSync(executablePath)
    } catch (e) {
      result.executablePathError = String(e)
      return NextResponse.json(result, { status: 500 })
    }

    try {
      const puppeteer = await import('puppeteer-core')
      result.puppeteerImport = 'ok'

      const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: result.executablePath as string,
        headless: true,
      })
      await browser.close()
      result.browserLaunch = 'ok'
    } catch (e) {
      result.browserLaunchError = String(e)
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (e) {
    result.chromiumImportError = String(e)
    return NextResponse.json(result, { status: 500 })
  }
}
