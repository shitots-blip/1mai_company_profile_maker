'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SiteFooter } from '@/app/_components/SiteFooter'
import { trackBeginCheckout, trackCtaClick } from '@/lib/gtag'
import {
  ClipboardList, Globe, FolderClock, RefreshCw, Monitor, UserCheck,
  Handshake, BarChart3, Building2, Send, Mail, MessageCircle,
  Zap, Wrench, Droplets, Paintbrush, Hammer, ShowerHead, Sparkles, Home,
} from 'lucide-react'

// ─── 共通パーツ ────────────────────────────────────────────────

function PaymentBadges({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
      {['Apple Pay', 'Google Pay', 'クレジットカード'].map((label) => (
        <span
          key={label}
          className={`inline-block border text-xs px-3 py-1 rounded-full ${
            light ? 'border-white/25 bg-white/10 text-white/80' : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

function SecurityNote({ light = false }: { light?: boolean }) {
  return (
    <p className={`text-xs text-center mt-2 ${light ? 'text-white/60' : 'text-gray-400'}`}>
      決済はStripeの安全な決済画面で行われます。カード番号は当サービスでは保存しません。
    </p>
  )
}

function TrustBadges({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-x-5 gap-y-1.5 text-sm ${light ? 'text-white/85' : 'text-gray-500'}`}>
      {['会員登録不要', '写真なしでも作成できます', '完成後にデータをダウンロード'].map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className={`font-bold ${light ? 'text-[#5ddb96]' : 'text-green-500'}`}>✓</span>{t}
        </span>
      ))}
    </div>
  )
}

// ─── スマホ入力モック（Hero用） ──────────────────────────────

function HeroPhoneMockup() {
  const [selectedItems, setSelectedItems] = useState(['マンション・アパート', '店舗・商業施設', '工場・倉庫'])

  const toggle = (item: string) => {
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const options = [
    '一戸建て・住宅', 'マンション・アパート',
    '店舗・商業施設', '工場・倉庫',
    '病院・福祉施設', '学校・公共施設',
    '新築物件', '古い建物',
  ]

  return (
    <div style={{
      width: 170,
      background: '#1c1c1e',
      borderRadius: 36,
      boxShadow: '0 0 0 1px #3a3a3c, 0 10px 30px rgba(0,0,0,0.20)',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      aspectRatio: '375 / 812',
      fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif",
    }}>
      {/* サイドボタン */}
      <div style={{ position: 'absolute', left: -2, top: '17%', width: 2, height: '4%', background: '#3a3a3c', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: -2, top: '23%', width: 2, height: '8%', background: '#3a3a3c', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', left: -2, top: '33%', width: 2, height: '8%', background: '#3a3a3c', borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', right: -2, top: '25%', width: 2, height: '11%', background: '#3a3a3c', borderRadius: '0 2px 2px 0' }} />

      {/* スクリーン */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 36, overflow: 'hidden', background: '#f2f2f7' }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: '1.5%', left: '50%', transform: 'translateX(-50%)',
          width: '32%', height: '4%', background: '#1c1c1e', borderRadius: 20, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10%',
        }}>
          <span style={{ color: 'white', fontSize: 8, fontWeight: 600 }}>7:52</span>
          <div style={{ width: 6, height: 6, background: '#1c1c1e', borderRadius: '50%', border: '1px solid #2c2c2e' }} />
        </div>

        {/* アプリ画面 */}
        <div style={{ marginTop: '14%', height: '86%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '4% 6% 0' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#1e3a5f', marginBottom: '3%' }}>1枚会社紹介メーカー</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5%' }}>
              <span style={{ fontSize: 7, color: '#8e8e93' }}>STEP 3 / 9</span>
            </div>
            <div style={{ height: 2, background: '#e5e5ea', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ width: '33%', height: '100%', background: '#1e3a5f', borderRadius: 1 }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'hidden', padding: '4% 6% 0' }}>
            <h2 style={{ fontSize: 10, fontWeight: 800, color: '#1c1c1e', lineHeight: 1.4, marginBottom: '2%' }}>
              対応する建物を<br />教えてください
            </h2>
            <p style={{ fontSize: 7, color: '#8e8e93', marginBottom: '5%' }}>あてはまるものをすべて選んでください。</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {options.map(item => {
                const selected = selectedItems.includes(item)
                return (
                  <button key={item} onClick={() => toggle(item)} style={{
                    padding: '3px 7px', borderRadius: 50,
                    border: selected ? 'none' : '1px solid #d1d1d6',
                    background: selected ? '#1e3a5f' : 'white',
                    color: selected ? 'white' : '#1c1c1e',
                    fontSize: 7, fontWeight: selected ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '3% 6% 6%', background: 'white', borderTop: '1px solid #f2f2f7', display: 'flex', gap: 5 }}>
            <button style={{ flex: '0 0 30%', padding: '5% 0', borderRadius: 8, border: '1px solid #e5e5ea', background: 'white', color: '#3c3c43', fontSize: 8, cursor: 'pointer' }}>← 戻る</button>
            <button style={{ flex: 1, padding: '5% 0', borderRadius: 8, border: 'none', background: '#1e3a5f', color: 'white', fontSize: 8, fontWeight: 700, cursor: 'pointer' }}>次へ</button>
          </div>
        </div>
      </div>
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
      className={`bg-[#1a9e55] text-white font-bold rounded-xl hover:bg-[#168a4a] shadow-md shadow-[#1a9e55]/30 transition disabled:opacity-50 cursor-pointer ${className}`}
    >
      {loading ? '準備中...' : label}
    </button>
  )
}

// ─── FAQ ───────────────────────────────────────────────────────

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
    a: 'ダウンロードした印刷用データを使って、コンビニ印刷（セブン・ファミマなど）やネット印刷サービスをご利用いただけます。コンビニ印刷サポートオプション（+500円）もご用意しています。',
  },
  {
    q: '会員登録は必要ですか？',
    a: '不要です。決済完了後、入力用リンクをメールでお届けします。アカウント作成なしでご利用いただけます。',
  },
  {
    q: '印刷された紙が届くサービスですか？',
    a: 'いいえ。本サービスは会社紹介データを作成するサービスです。完成後に、印刷用データと画像データをダウンロードできます。印刷はご自身のプリンター、コンビニ印刷、ネット印刷サービスなどをご利用ください。',
  },
]

// ─── 会社紹介サンプル（4枚）─────────────────────────────────

const PROFILE_SAMPLES = [
  { label: 'サンプルA', category: '設備工事', img: '/lp-sample-chiba.png', imgH: 1273 },
  { label: 'サンプルB', category: '防水工事', img: '/lp-sample-toyo.png', imgH: 1273 },
  { label: 'サンプルC', category: 'リフォーム', img: '/lp-sample-yachimata.png', imgH: 1273 },
  { label: 'サンプルD', category: '写真なし', img: '/lp-sample-nophoto.png', imgH: 1273 },
]

// ─── メイン ────────────────────────────────────────────────────

function LandingContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const canceled = searchParams.get('canceled')

  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<{ img: string; label: string; category: string } | null>(null)
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
    <main className="min-h-screen bg-white pb-[72px] md:pb-0">

      {/* ── ナビ ─────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#1e3a5f] text-white flex flex-col items-center justify-center leading-none flex-shrink-0">
              <span className="text-[13px] font-extrabold leading-none">1</span>
              <span className="text-[7px] font-bold leading-none mt-px">枚</span>
            </span>
            <span className="text-[#1e3a5f] font-bold text-base tracking-tight">1枚会社紹介メーカー</span>
          </span>
          <PrimaryButton onClick={() => handleStart('nav')} loading={loading} label="会社紹介を作成する" className="hidden sm:block text-sm px-5 py-2" />
        </div>
      </nav>

      {/* ──────────────────────────────────────────────
          S1. ファーストビュー
          左：コピー＋CTA　右：完成物写真＋スマホ入力画面
      ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#f6f9fc] via-white to-[#e9f0f7]">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20">
          <div className="grid md:grid-cols-5 gap-10 items-center">

            {/* テキスト（2/5） */}
            <div className="md:col-span-2">
              <p className="text-[#2468a8] text-sm font-bold tracking-wide mb-4">
                工事会社・設備会社・地域密着企業向け
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] leading-[1.3] mb-5">
                A4一枚で、<br />
                信頼が伝わる<br />
                会社紹介をつくる
              </h1>
              <p className="text-gray-600 text-base leading-relaxed mb-2">
                営業先・管理会社・お客様に渡せる<br />
                会社紹介データをかんたん作成。
              </p>
              <p className="text-gray-400 text-sm leading-relaxed md:mb-8">
                完成後は印刷用データと画像データをダウンロードできます。
              </p>

              {/* CTA（デスクトップのみここに表示。モバイルはサンプル画像の下） */}
              <div className="hidden md:block">
                {checkoutError && (
                  <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-5 py-3">
                    {checkoutError}
                  </div>
                )}
                <PrimaryButton onClick={() => handleStart('hero')} loading={loading} className="w-full sm:w-auto text-base px-8 py-4 mb-5" />
                <TrustBadges />
              </div>
            </div>

            {/* 右：会社紹介サンプル（メイン）＋スマホ入力モック（右）（3/5） */}
            <div className="md:col-span-3 flex items-start gap-3">
              {/* 会社紹介サンプル */}
              <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-xl shadow-[#1e3a5f]/10">
                <Image
                  src="/lp-sample-chiba.png"
                  alt="千葉中央設備株式会社の会社紹介サンプル"
                  width={900}
                  height={1273}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* スマホ入力モック（右）*/}
              <div className="hidden md:flex items-center pt-8">
                <HeroPhoneMockup />
              </div>
            </div>

            {/* CTA（モバイル：サンプル画像の下） */}
            <div className="md:hidden">
              {checkoutError && (
                <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-5 py-3">
                  {checkoutError}
                </div>
              )}
              <PrimaryButton onClick={() => handleStart('hero')} loading={loading} className="w-full text-base px-8 py-4 mb-5" />
              <TrustBadges />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S2. よくある悩み
      ─────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-3">
            会社紹介が整っていないと、<br />
            営業のチャンスを逃してしまいます
          </h2>
          <p className="text-gray-400 text-sm text-center mb-12">
            多くの中小企業・工事会社で、こんなお悩みがよくあります
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { Icon: ClipboardList, title: '営業先に渡せる資料がない', desc: '口頭説明や名刺だけでは、信頼感を十分に伝えられません。' },
              { Icon: Globe, title: 'ホームページが長くて伝わらない', desc: '必要な情報がまとまっていないため、見てもらえないことがあります。' },
              { Icon: FolderClock, title: '昔の資料のまま更新できていない', desc: '情報が古いまま、かえって不安感を与えてしまいます。' },
              { Icon: RefreshCw, title: '毎回同じ説明をしている', desc: '営業のたびに口頭で会社説明をする手間が続いています。' },
              { Icon: Monitor, title: 'デザインやPDF編集が分からない', desc: '作り方が分からず、資料作成が後回しになっています。' },
              { Icon: UserCheck, title: '紹介されたとき、渡すものがない', desc: 'せっかくの紹介機会が、口頭だけで終わってしまいます。' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-10 h-10 rounded-lg bg-[#e8f0f8] text-[#2468a8] flex items-center justify-center mb-3">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <p className="font-bold text-[#1e3a5f] text-sm mb-1.5">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S3. 解決
      ─────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-3">
            その悩み、<br className="sm:hidden" />A4一枚の会社紹介で解決できます
          </h2>
          <p className="text-gray-400 text-sm text-center mb-12">
            1枚に情報を整えることで、信頼感が伝わり、営業や提案がスムーズになります。
          </p>

          <div className="bg-[#f5f7fa] rounded-2xl p-8 md:p-10">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-8">A4一枚で整えると</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { point: '必要な情報が一目で伝わる', sub: '会社概要・対応工事・強み・連絡先をひとつにまとめます' },
                { point: '営業先にそのまま渡せる', sub: '印刷してそのまま手渡しできる形式で作成します' },
                { point: 'メールやLINEでも送れる', sub: '画像データとして添付・共有できます' },
                { point: '管理会社への提出にも使える', sub: '信頼感のある資料として活用できます' },
              ].map(({ point, sub }) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-lg flex-shrink-0 mt-0.5">✓</span>
                  <div>
                    <p className="text-base font-bold text-[#1e3a5f]">{point}</p>
                    <p className="text-sm text-gray-500 mt-1">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S4. 完成サンプル（4枚サムネイル）
      ─────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-3">こんな会社紹介が作れます</h2>
          <p className="text-gray-400 text-sm text-center mb-10">
            ダウンロードしたデータを印刷すると、このように営業資料として活用できます。
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROFILE_SAMPLES.map(({ label, category, img, imgH }) => (
              <button
                key={label}
                onClick={() => setLightbox({ img, label, category })}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#1e3a5f] hover:shadow-md transition text-left group"
              >
                <div className="overflow-hidden relative">
                  <Image
                    src={img}
                    alt={`${label} ${category}の会社紹介サンプル`}
                    width={900}
                    height={imgH}
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-[#1e3a5f]/0 group-hover:bg-[#1e3a5f]/10 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-[#1e3a5f] text-xs font-bold px-3 py-1.5 rounded-full shadow">
                      拡大して見る
                    </span>
                  </div>
                </div>
                <div className="px-3 py-3">
                  <span className="inline-block text-xs font-bold text-[#2468a8] bg-[#e8f0f8] px-2 py-0.5 rounded mb-1">{category}</span>
                  <p className="text-xs font-bold text-[#1e3a5f]">{label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ライトボックス */}
          {lightbox && (
            <div
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={() => setLightbox(null)}
            >
              <div
                className="relative bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                  <div>
                    <span className="text-xs font-bold text-[#2468a8] bg-[#e8f0f8] px-2 py-0.5 rounded mr-2">{lightbox.category}</span>
                    <span className="text-sm font-bold text-[#1e3a5f]">{lightbox.label}</span>
                  </div>
                  <button
                    onClick={() => setLightbox(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2 py-1 rounded hover:bg-gray-100 transition"
                    aria-label="閉じる"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto">
                  <Image
                    src={lightbox.img}
                    alt={`${lightbox.label} ${lightbox.category}の会社紹介サンプル`}
                    width={900}
                    height={1273}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S5. 活用シーン
      ─────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-3">さまざまな場面で活躍します</h2>
          <p className="text-gray-400 text-sm text-center mb-12">
            一度作れば、繰り返し使える営業資料になります。
          </p>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-xl overflow-hidden">
              <Image
                src="/lp-handover.jpg"
                alt="印刷した会社紹介を営業先に渡しているシーン"
                width={800}
                height={1000}
                className="w-full h-auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { Icon: Handshake, scene: '営業訪問', desc: '初回訪問時にそのまま手渡し' },
                { Icon: BarChart3, scene: '提案・見積もり時', desc: '会社の信頼感を添えて提出' },
                { Icon: Building2, scene: '管理会社への提出', desc: '元請けへの説明資料として' },
                { Icon: Send, scene: '見積書に同封', desc: '会社案内を一緒に送付' },
                { Icon: Mail, scene: 'メール添付', desc: '画像データとして送れます' },
                { Icon: MessageCircle, scene: 'LINEで送付', desc: 'スマホですぐ共有できます' },
              ].map(({ Icon, scene, desc }) => (
                <div key={scene} className="bg-[#f5f7fa] rounded-xl p-4">
                  <div className="w-9 h-9 rounded-lg bg-white text-[#2468a8] flex items-center justify-center mb-2 border border-gray-100">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <p className="font-bold text-sm text-[#1e3a5f] mb-1">{scene}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S6. 作成の流れ
      ─────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-2">5分ほどの入力で完成します</h2>
          <p className="text-gray-400 text-sm text-center mb-10">
            質問に答えるだけで、印刷用データが完成します。写真がなくても作成できます。
          </p>

          {/* 実際の操作動画 */}
          <div className="flex justify-center mb-14">
            <div className="w-56 rounded-3xl overflow-hidden border-4 border-[#1e3a5f] shadow-lg shadow-[#1e3a5f]/15 bg-white">
              <video
                src="/lp-howto.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto block"
                aria-label="実際の入力からダウンロードまでの操作動画"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 'STEP 1',
                title: '質問に答える',
                desc: '業種・対応エリア・強みなど、画面の案内に沿って選択・入力します。難しい操作はありません。',
                img: '/lp-phone-step1.png',
                imgAlt: '入力フォームのスマホ画面',
                imgW: 600,
                imgH: 1300,
                narrow: true,
              },
              {
                step: 'STEP 2',
                title: '写真を追加する（任意）',
                desc: '作業写真・代表者写真・会社ロゴを追加できます。写真がなくても完成します。',
                img: '/lp-phone-step8.png',
                imgAlt: '写真追加のスマホ画面',
                imgW: 600,
                imgH: 1300,
                narrow: true,
              },
              {
                step: 'STEP 3',
                title: '会社紹介が完成',
                desc: 'A4サイズの印刷用データと画像データをダウンロードできます。',
                img: '/lp-sample-chiba.png',
                imgAlt: '完成した会社紹介サンプル',
                imgW: 900,
                imgH: 1273,
                narrow: false,
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 border border-gray-100 flex flex-col">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {item.step.replace('STEP ', '')}
                  </div>
                  <span className="text-xs font-bold text-[#2468a8] tracking-widest">{item.step}</span>
                </div>
                <h3 className="font-bold text-[#1e3a5f] text-base mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">{item.desc}</p>
                <div className={`rounded-xl overflow-hidden border border-gray-100 ${item.narrow ? 'max-w-[130px] mx-auto' : ''}`}>
                  <Image
                    src={item.img}
                    alt={item.imgAlt}
                    width={item.imgW}
                    height={item.imgH}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S7. 入力画面紹介
      ─────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-3">パソコンが苦手でも大丈夫です</h2>
          <p className="text-gray-400 text-sm text-center mb-12">
            選択式中心のシンプルな入力画面。スマホでサクサク進められます。
          </p>

          <div className="grid md:grid-cols-3 gap-8 items-center">

            {/* 左の特徴 */}
            <div className="space-y-6">
              {[
                { label: '選択式中心', desc: '難しい文章を書く必要はありません' },
                { label: '自動保存', desc: '入力中も常に自動で保存されます' },
                { label: '途中再開可能', desc: 'メールのリンクからいつでも再開できます' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-[#2468a8] font-bold text-base flex-shrink-0 mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-bold text-[#1e3a5f]">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 中央：スマホ画面 */}
            <div className="flex justify-center">
              <div className="w-52 rounded-3xl overflow-hidden border-4 border-[#1e3a5f] shadow-md">
                <Image
                  src="/lp-phone-s7.png"
                  alt="スマホ入力画面"
                  width={600}
                  height={1300}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* 右の特徴 */}
            <div className="space-y-6">
              {[
                { label: 'スマホ対応', desc: 'スマホからでも快適に入力できます' },
                { label: '写真あとから追加', desc: '写真は後から追加・変更できます' },
                { label: 'いつでも修正', desc: '完成後も30日以内なら修正できます' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-[#2468a8] font-bold text-base flex-shrink-0 mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-bold text-[#1e3a5f]">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 下部バッジ */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {['会員登録不要', '写真なしでもOK', '途中再開可能', 'スマホ対応', 'いつでも修正'].map((label) => (
              <span key={label} className="border border-gray-200 text-xs px-4 py-2 rounded-full text-gray-500 bg-[#f5f7fa]">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S8. 業種紹介
      ─────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-3">こんな業種におすすめです</h2>
          <p className="text-gray-400 text-sm text-center mb-12">
            工事会社・設備会社・地域サービス業に特化したテンプレートを用意しています。
          </p>

          <div className="mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-5">対応中</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { Icon: Zap, label: '電気工事' },
                { Icon: Wrench, label: '設備工事' },
                { Icon: Droplets, label: '防水工事' },
                { Icon: Paintbrush, label: '塗装工事' },
                { Icon: Hammer, label: 'リフォーム' },
                { Icon: ShowerHead, label: '水道・設備' },
                { Icon: Sparkles, label: '清掃業' },
                { Icon: Home, label: '地域サービス' },
              ].map(({ Icon, label }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-[#1e3a5f] flex items-center gap-2">
                  <Icon size={16} strokeWidth={2} className="text-[#2468a8]" />{label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-5">開発中</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['IT・Web', '広告代理店', '士業'].map((label) => (
                <div key={label} className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-5 py-3 text-sm text-gray-400 flex items-center gap-2">
                  {label}
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">開発中</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          S9. 料金
      ─────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] mb-10">料金</h2>

          <div className="bg-[#f5f7fa] border border-gray-200 rounded-2xl p-8 mb-5 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">1枚会社紹介作成</p>
            <p className="text-sm text-gray-400 text-center mb-2">
              制作会社に依頼すると <span className="line-through">一般に30,000円前後〜</span>
            </p>
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

      {/* ──────────────────────────────────────────────
          S10. FAQ
      ─────────────────────────────────────────────── */}
      <section className="bg-[#f5f7fa] border-t border-gray-100 py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] text-center mb-12">よくある質問</h2>
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

      {/* ──────────────────────────────────────────────
          S11. 最終CTA
      ─────────────────────────────────────────────── */}
      <section className="bg-[#1e3a5f] py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            まずは1枚、<br />会社紹介を整えてみませんか？
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            営業先に渡せる会社紹介データが、最短5分で作成できます。<br />
            写真なし・デザインの知識がなくても大丈夫です。
          </p>

          {checkoutError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-5 py-3">
              {checkoutError}
            </div>
          )}

          <PrimaryButton onClick={() => handleStart('bottom')} loading={loading} className="w-full text-base px-8 py-4 mb-5" />
          <div className="flex justify-center"><TrustBadges light /></div>
          <PaymentBadges light />
          <SecurityNote light />
        </div>
      </section>

      <SiteFooter />

      {/* モバイル追従CTAバー */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0 leading-tight">
          <p className="text-[10px] text-gray-400">買い切り・登録不要</p>
          <p className="text-base font-bold text-[#1e3a5f]">¥980<span className="text-[10px] font-normal text-gray-400">（税込）</span></p>
        </div>
        <PrimaryButton onClick={() => handleStart('sticky_mobile')} loading={loading} label="会社紹介を作成する" className="flex-1 text-sm py-3" />
      </div>
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
