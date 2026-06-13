'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  companyProfileId: string
  companyName: string
  hasOutput: boolean
  htmlSnapshot: string | null
}

export default function CompleteClient({ token, companyProfileId, companyName, hasOutput, htmlSnapshot }: Props) {
  const router = useRouter()
  const [downloading, setDownloading] = useState<'pdf' | 'png' | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [printSupportLoading, setPrintSupportLoading] = useState(false)
  const [printSupportError, setPrintSupportError] = useState<string | null>(null)

  async function handlePrintSupportCheckout() {
    setPrintSupportLoading(true)
    setPrintSupportError(null)
    try {
      const res = await fetch('/api/checkout/print-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyProfileId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setPrintSupportError('コンビニ印刷サポートの決済を開始できませんでした。時間をおいて再度お試しください。')
        return
      }
      window.location.href = data.url
    } catch {
      setPrintSupportError('コンビニ印刷サポートの決済を開始できませんでした。時間をおいて再度お試しください。')
    } finally {
      setPrintSupportLoading(false)
    }
  }

  async function handleDownload(type: 'pdf' | 'png') {
    setDownloading(type)
    setDownloadError(null)
    try {
      const res = await fetch(`/api/company-profile/${token}/download?type=${type}`)
      if (!res.ok) {
        setDownloadError('ダウンロードに失敗しました。しばらく待ってからもう一度お試しください。')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'pdf'
        ? `${companyName || '会社紹介'}.pdf`
        : `${companyName || '会社紹介'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('通信エラーが発生しました。インターネット接続をご確認ください。')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[#1e3a5f] font-bold text-sm">1枚会社紹介メーカー</span>
          <button
            onClick={() => router.push(`/create/${token}/step/1`)}
            className="text-sm text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            内容を修正する
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* 完了メッセージ */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">会社紹介が完成しました</h1>
          <p className="text-gray-500 text-sm">
            営業先への印刷配布や、メール送付に利用できます。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* プレビュー */}
          <div>
            <h2 className="font-bold text-[#1e3a5f] mb-3 text-sm">プレビュー（A4縦）</h2>
            {htmlSnapshot ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <iframe
                  srcDoc={htmlSnapshot}
                  className="w-full"
                  style={{ height: '560px', border: 'none' }}
                  title="会社紹介プレビュー"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm h-80 flex items-center justify-center text-gray-300 text-sm">
                プレビューを表示できません
              </div>
            )}
          </div>

          {/* ダウンロード */}
          <div className="space-y-3">
            <h2 className="font-bold text-[#1e3a5f] mb-3 text-sm">データをダウンロード</h2>

            {downloadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {downloadError}
              </div>
            )}

            {/* 印刷用データ */}
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading !== null}
              className="w-full bg-[#1e3a5f] text-white rounded-xl p-5 text-left hover:bg-[#2d5080] transition disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="font-bold">印刷用データをダウンロード</p>
                  <p className="text-white/70 text-xs mt-0.5">A4サイズ・そのまま印刷できます</p>
                </div>
                {downloading === 'pdf' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <span className="text-white/50 text-xl flex-shrink-0">↓</span>
                )}
              </div>
            </button>

            {/* 画像データ */}
            <button
              onClick={() => handleDownload('png')}
              disabled={downloading !== null}
              className="w-full bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-[#1e3a5f] transition disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-700">画像データをダウンロード</p>
                  <p className="text-gray-400 text-xs mt-0.5">SNS投稿・メール添付などに</p>
                </div>
                {downloading === 'png' ? (
                  <div className="w-5 h-5 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <span className="text-gray-300 text-xl flex-shrink-0">↓</span>
                )}
              </div>
            </button>

            {/* メール受け取り（仮） */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 opacity-40">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✉️</span>
                <div>
                  <p className="font-bold text-gray-500">メールで受け取る</p>
                  <p className="text-gray-400 text-xs mt-0.5">近日対応予定</p>
                </div>
              </div>
            </div>

            {/* コンビニ印刷サポート — 準備中 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 opacity-50 pointer-events-none select-none">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏪</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-500 text-sm">コンビニ印刷サポート</p>
                  <p className="text-gray-400 text-xs mt-1">現在準備中です。しばらくお待ちください。</p>
                </div>
              </div>
            </div>

            {/* 修正の案内 */}
            <div className="bg-[#f5f7fa] rounded-xl p-4 text-sm text-gray-500">
              <p className="font-medium text-[#1e3a5f] mb-1">内容を修正したい場合</p>
              <p className="text-xs leading-relaxed">
                作成した会社紹介は、メールのリンクから再度開けます。30日以内なら何度でも修正・再ダウンロードできます。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
