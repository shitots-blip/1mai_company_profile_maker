'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

// ── 作成開始ボタン ─────────────────────────────────────────────
function StartButton({ sessionId }: { sessionId: string | null }) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) { setLoading(false); return }
    fetch(`/api/checkout/session-link?session_id=${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.token) setToken(data.token) })
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return (
    <div className="w-full py-4 bg-gray-100 rounded-xl text-gray-400 text-sm font-bold flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      作成リンクを確認しています...
    </div>
  )

  if (!token) return (
    <p className="text-red-500 text-sm leading-relaxed">
      作成リンクを取得できませんでした。<br />
      お送りしたメールのリンクから作成を始めてください。
    </p>
  )

  return (
    <button
      onClick={() => router.push(`/create/${token}/start`)}
      className="w-full py-4 bg-[#1e3a5f] text-white font-bold rounded-xl hover:bg-[#2d5080] transition shadow cursor-pointer"
    >
      会社紹介の入力を始める
    </button>
  )
}

// ── メール再送フォーム ─────────────────────────────────────────
function ResendForm({ sessionId }: { sessionId: string | null }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function handleResend() {
    if (!email.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/checkout/resend-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), sessionId }),
      })
      setStatus(res.ok ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600 transition"
      >
        メールが届かない場合
      </button>

      {open && (
        <div className="mt-4">
          {status === 'ok' ? (
            <p className="text-green-600 text-sm font-medium">
              作成リンクを再送しました。メールをご確認ください。
            </p>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="購入時のメールアドレス"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-3 outline-none focus:border-[#1e3a5f] transition"
              />
              <button
                onClick={handleResend}
                disabled={status === 'sending' || !email.trim()}
                className="w-full py-3 bg-gray-800 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer"
              >
                {status === 'sending' ? '送信中...' : '作成リンクを再送する'}
              </button>
              {status === 'error' && (
                <p className="text-red-500 text-xs mt-2">
                  作成リンクを確認できませんでした。時間をおいて再度お試しください。
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── メインコンテンツ ───────────────────────────────────────────
function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }
    const timer = setTimeout(() => setStatus('ok'), 2000)
    return () => clearTimeout(timer)
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-500">決済を確認しています...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-700 mb-2">URLが正しくありません</h1>
        <p className="text-gray-500 text-sm">決済画面からアクセスしてください。</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">✓</span>
      </div>
      <h1 className="text-2xl font-bold text-[#1e3a5f] mb-4">お支払いが完了しました</h1>
      <p className="text-gray-600 mb-2 leading-relaxed">
        会社紹介の作成リンクをメールでお送りしました。<br />
        この画面からも、すぐに作成を始められます。
      </p>
      <p className="text-gray-400 text-xs mb-8">
        途中で画面を閉じても、メールのリンクから再開できます。
      </p>

      <StartButton sessionId={sessionId} />

      <p className="text-gray-400 text-xs mt-4">
        メールが届かない場合は、迷惑メールフォルダをご確認ください。
      </p>

      <ResendForm sessionId={sessionId} />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm max-w-md w-full p-10">
        <Suspense fallback={<div className="text-center text-gray-400">読み込み中...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
