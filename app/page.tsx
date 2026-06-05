'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SiteFooter } from '@/app/_components/SiteFooter'
import { trackBeginCheckout, trackCtaClick } from '@/lib/gtag'

// ─── 共通パーツ ────────────────────────────────────────────────

function PaymentBadges() {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
      {['Apple Pay', 'Google Pay', 'クレジットカード'].map((label) => (
        <span key={label} className="inline-block border border-gray-200 text-xs px-3 py-1 rounded-full bg-gray-50 text-gray-500">
          {label}
        </span>
      ))}
    </div>
  )
}

function SecurityNote() {
  return (
    <p className="text-xs text-gray-400 text-center mt-2">
      決済はStripeの安全な決済画面で行われます。カード番号は当サービスでは保存しません。
    </p>
  )
}

function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
      {['会員登録不要', '写真なしでも作成できます', '印刷用データで受け取れます'].map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className="text-green-500 font-bold">✓</span>{t}
        </span>
      ))}
    </div>
  )
}

function PrimaryButton({
  onClick, loading, label = '980円で会社紹介を作成する', className = '',
}: {
  onClick: () => void; loading: boolean; label?: string; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`bg-[#1e3a5f] text-white font-bold rounded-xl hover:bg-[#2d5080] transition disabled:opacity-50 cursor-pointer ${className}`}
    >
      {loading ? '準備中...' : label}
    </button>
  )
}

// ─── FAQ データ（5問に絞る） ───────────────────────────────────

const FAQ_ITEMS = [
  {
    q: '写真がなくても作れますか？',
    a: 'はい。写真なしでも完成するデザインになっています。後から追加・変更することも可能です。',
  },
  {
    q: 'どんな形式で受け取れますか？',
    a: '印刷用データ（A4・そのまま印刷できる形式）と画像データの2種類をダウンロードできます。',
  },
  {
    q: 'あとから修正できますか？',
    a: 'はい。お届けしたリンクから30日以内であれば、内容の変更と再ダウンロードが何度でも可能です。',
  },
  {
    q: 'プリンターがない場合はどうすればいいですか？',
    a: 'コンビニ（セブン・ファミマなど）でそのまま印刷できます。コンビニ印刷サポートオプション（+500円）もご用意しています。',
  },
  {
    q: '会員登録は必要ですか？',
    a: '不要です。決済完了後、入力用リンクをメールでお届けします。アカウント作成なしでご利用いただけます。',
  },
]

// ─── 3社サンプルカード ─────────────────────────────────────────

const SAMPLES = [
  {
    href: '/samples/chiba-chuo',
    name: '千葉中央設備株式会社',
    category: '設備工事',
    target: 'マンション・ビル管理会社向け',
    img: '/samples/chiba-chuo-work1.png',
  },
  {
    href: '/samples/toyo-bousui',
    name: '東葉防水工業',
    category: '防水工事',
    target: '工務店・不動産会社向け',
    img: '/samples/toyo-bousui-work1.png',
  },
  {
    href: '/samples/yachimata-reform',
    name: '八街リフォームサービス',
    category: '水回りリフォーム',
    target: '個人のお客様向け',
    img: '/samples/yachimata-reform-work1.png',
  },
]

// ─── メイン ────────────────────────────────────────────────────

function LandingContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const canceled = searchParams.get('canceled')

  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(
    error === 'link' ? '作成リンクを確認できませんでした。メールに記載されたリンクをご確認ください。' :
    canceled ? '決済がキャンセルされました。' : null
  )

  async function handleStart(ctaLocation = 'unknown') {
    trackCtaClick('start_checkout', ctaLocation)
    trackBeginCheckout(980)
    setLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout/create', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setCheckoutError('決済画面への移動に失敗しました。しばらく待ってからお試しください。')
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setCheckoutError('通信エラーが発生しました。インターネット接続を確認してお試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">

      {/* ── ナビ ─────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[#1e3a5f] font-bold text-base tracking-tight">1枚会社紹介メーカー</span>
          <PrimaryButton onClick={() => handleStart('nav')} loading={loading} label="会社紹介を作成する" className="text-sm px-5 py-2" />
        </div>
      </nav>

      {/* ─────────────────────────────────────────────
          S1. ファーストビュー
          右：3社の完成物写真（何が作れるか一目瞭然）
      ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20">
        <div className="grid md:grid-cols-5 gap-10 items-center">

          {/* テキスト（2/5） */}
          <div className="md:col-span-2">
            <p className="text-[#2468a8] text-sm font-bold tracking-wide mb-5">
              工事会社・設備会社・地域密着企業向け
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] leading-[1.3] mb-6">
              名刺だけでは<br />伝わらない。<br />
              営業先に渡せる<br />会社紹介を<br />作りませんか。
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              質問に答えるだけで、営業先にそのまま渡せる会社紹介を作成できます。印刷して、すぐ使えます。
            </p>

            {checkoutError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-5 py-3">
                {checkoutError}
              </div>
            )}

            <PrimaryButton onClick={() => handleStart('hero')} loading={loading} className="w-full sm:w-auto text-base px-8 py-4 mb-5" />
            <TrustBadges />
          </div>

          {/* 完成物写真（3社並び・3/5） */}
          <div className="md:col-span-3">
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <Image
                src="/lp-3samples.jpg"
                alt="千葉中央設備・東葉防水工業・八街リフォームサービスの会社紹介3枚並び"
                width={1400}
                height={900}
                className="w-full h-auto"
                priority
              />
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">実際に印刷した会社紹介（3社）</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S2. こんな会社紹介が作れます
          実物写真を大きく、下に3社カード
      ──────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-3">こんな会社紹介が作れます</h2>
          <p className="text-gray-400 text-sm text-center mb-10">
            実際に印刷した会社紹介です。そのまま営業先にお持ちください。
          </p>

          {/* 3社並び大版 */}
          <div className="rounded-xl overflow-hidden mb-10">
            <Image
              src="/lp-3samples.jpg"
              alt="3社の会社紹介が机の上に並んでいる実物写真"
              width={1400}
              height={900}
              className="w-full h-auto"
            />
          </div>

          {/* 3社カード */}
          <div className="grid sm:grid-cols-3 gap-5">
            {SAMPLES.map(({ href, name, category, target, img }) => (
              <Link
                key={href}
                href={href}
                target="_blank"
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#1e3a5f] transition block"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#f0f4f8]">
                  <Image
                    src={img}
                    alt={name}
                    width={600}
                    height={450}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="px-4 py-4">
                  <span className="inline-block text-xs font-bold text-[#2468a8] bg-[#e8f0f8] px-2 py-0.5 rounded mb-2">{category}</span>
                  <p className="font-bold text-sm text-[#1e3a5f] group-hover:underline leading-tight mb-1">{name}</p>
                  <p className="text-xs text-gray-400">{target}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-center text-sm text-[#2468a8] mt-6">
            ↑ クリックすると実際のサンプルを確認できます
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S3. 営業先にそのまま渡せます
          手渡し写真で利用シーンを伝える
      ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div className="rounded-xl overflow-hidden">
              <Image
                src="/lp-handover.jpg"
                alt="営業先に会社紹介を手渡しているシーン"
                width={800}
                height={1000}
                className="w-full h-auto"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-5">営業先に<br />そのまま渡せます</h2>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                完成した会社紹介は、訪問営業、商談、紹介先への説明などにそのまま使えます。会社の概要、対応サービス、強み、連絡先をA4一枚に整理できます。
              </p>
              <ul className="space-y-3">
                {[
                  '管理会社・元請けへの初回営業',
                  '名刺と一緒に渡す会社案内として',
                  '工事後のフォロー訪問時に',
                  '紹介先への説明資料として',
                ].map((text) => (
                  <li key={text} className="flex items-center gap-3 text-gray-700 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2468a8] flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S4. 印刷して、すぐ営業で使える
          机の上の印刷物写真で実用感を伝える
      ──────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-5">印刷して、<br />すぐ営業で使える</h2>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                完成データは印刷用としてダウンロードできます。自宅のプリンターやコンビニ印刷で出力し、そのまま営業先へ持参できます。
              </p>
              <ul className="space-y-3">
                {[
                  'A4サイズ・そのまま印刷できる形式',
                  'セブン・ファミマなどコンビニでも印刷可',
                  '画像データ（SNS・メール添付用）もダウンロード可',
                  'コンビニ印刷サポートオプションもあります（+500円）',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3 text-gray-700 text-sm">
                    <span className="text-[#2468a8] font-bold flex-shrink-0 mt-0.5">✓</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 rounded-xl overflow-hidden">
              <Image
                src="/lp-desk.jpg"
                alt="机の上に置かれた印刷済みの会社紹介"
                width={800}
                height={960}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S5. どんな場面で使えますか
          近接写真＋用途一覧
      ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div className="rounded-xl overflow-hidden">
              <Image
                src="/lp-closeup.jpg"
                alt="会社紹介の詳細部分の近接写真"
                width={800}
                height={960}
                className="w-full h-auto"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-8">こんな場面で<br />使われています</h2>
              <div className="space-y-4">
                {[
                  { scene: '管理会社・元請けへの営業', desc: '初回訪問時にそのまま渡せます' },
                  { scene: '商談・見積もり提出時', desc: '会社の信頼感を伝えられます' },
                  { scene: '紹介時の説明資料', desc: '口頭説明に加えて手元に残せます' },
                  { scene: 'ホームページ誘導', desc: 'QRコードを掲載してWeb誘導も可能' },
                  { scene: '採用時の会社紹介', desc: '求職者に会社の雰囲気を伝えられます' },
                ].map(({ scene, desc }) => (
                  <div key={scene} className="flex items-start gap-3">
                    <span className="text-[#2468a8] font-bold flex-shrink-0 mt-0.5">✓</span>
                    <div>
                      <p className="text-sm font-bold text-[#1e3a5f]">{scene}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S6. 3ステップで完成
      ──────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-2">3ステップで完成</h2>
          <p className="text-gray-400 text-sm text-center mb-14">入力時間の目安：約5分</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '質問に答える', desc: '業種・対応エリア・強みなど、画面の案内に沿って入力します。難しい操作はありません。' },
              { step: '02', title: '写真を選ぶ', desc: '作業写真・代表者写真・会社ロゴを追加できます。写真がなくても完成します。' },
              { step: '03', title: '印刷用データを受け取る', desc: 'A4サイズのまま印刷できる形式でダウンロードできます。画像データも同時に取得できます。' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-7 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-[#1e3a5f] text-base mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S7. 料金（白背景）
      ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-10">料金</h2>

          <div className="bg-[#f5f7fa] border border-gray-200 rounded-2xl p-8 mb-5 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">1枚会社紹介作成</p>
            <div className="flex items-baseline justify-center gap-2 mb-7">
              <span className="text-5xl font-bold text-[#1e3a5f]">¥980</span>
              <span className="text-lg text-gray-500">（税込）</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                '印刷用データのダウンロード（A4・そのまま印刷できます）',
                '画像データのダウンロード（SNS・メール添付用）',
                '30日間の編集・再ダウンロード',
                '商用利用可',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#2468a8] flex-shrink-0 mt-0.5 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#f5f7fa] border border-gray-200 rounded-xl px-6 py-4 mb-8 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">追加オプション</p>
            <p className="text-gray-700 text-sm font-medium">コンビニ印刷サポート：500円（税込）</p>
            <p className="text-gray-400 text-xs mt-1">コンビニで印刷できる状態に整えます。※店頭での印刷料金は別途必要です。</p>
          </div>

          {checkoutError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-5 py-3">
              {checkoutError}
            </div>
          )}

          <PrimaryButton onClick={() => handleStart('pricing')} loading={loading} className="w-full text-base px-8 py-4 mb-5" />
          <TrustBadges />
          <PaymentBadges />
          <SecurityNote />
          <p className="text-gray-400 text-xs mt-3">
            ※ 決済完了後、作成ページへのリンクをメールでお届けします
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S8. FAQ
      ──────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-12">よくある質問</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-gray-100 px-6 py-5">
                <p className="font-bold text-[#1e3a5f] mb-2 text-sm">Q. {item.q}</p>
                <p className="text-gray-600 text-sm leading-relaxed">A. {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          S9. 最終CTA
      ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-3">まずは1枚、<br className="sm:hidden" />作ってみませんか？</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            営業先に渡せる会社紹介が、最短5分で作成できます。<br />
            写真なし・デザインの知識がなくても大丈夫です。
          </p>

          {checkoutError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-5 py-3">
              {checkoutError}
            </div>
          )}

          <PrimaryButton onClick={() => handleStart('bottom')} loading={loading} className="w-full text-base px-8 py-4 mb-5" />
          <TrustBadges />
          <PaymentBadges />
          <SecurityNote />
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LandingContent />
    </Suspense>
  )
}
