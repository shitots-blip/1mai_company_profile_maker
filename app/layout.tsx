import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { GoogleAnalytics } from './_components/GoogleAnalytics'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://1mai.jp'
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

const SITE_NAME = '1枚会社紹介メーカー'
const SITE_TITLE = '1枚会社紹介メーカー | 営業先に渡せる会社紹介を簡単作成'
const SITE_DESCRIPTION =
  '質問に答えるだけで、営業先にそのまま渡せるA4一枚の会社紹介を作成できます。工事会社・設備会社・地域密着企業向け。'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | 1枚会社紹介メーカー',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  // Search Console の所有権確認は DNS TXT で行うため、meta verification は設定しない
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'ja_JP',
    images: [
      {
        url: '/og-image.png',
        width: 1536,
        height: 1024,
        alt: '1枚会社紹介メーカー — A4一枚の会社紹介を簡単作成',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  // 既定はインデックス可。非公開エリアは各サブlayoutで上書きする。
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        {children}
        {/* GA4 (gtag.js) — 測定IDが設定されているときだけ挿入される */}
        <GoogleAnalytics measurementId={GA_ID} />
        {/* Microsoft Clarity */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "x4bwkzp64d");`,
          }}
        />
      </body>
    </html>
  )
}
