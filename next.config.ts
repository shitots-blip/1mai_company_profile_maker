import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core', 'playwright'],
  async headers() {
    return [
      {
        // /api/* は HTML ではないが、念のため X-Robots-Tag でも noindex を伝える。
        // robots.txt の Disallow と二重で防ぐ。
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}

export default nextConfig
