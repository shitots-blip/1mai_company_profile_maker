'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import { CompanyProfile } from '@/lib/types'

const PROGRESS_STEPS = [
  '会社情報を整理しています',
  '紹介文を作成しています',
  '強みをまとめています',
  'A4レイアウトに整えています',
  '印刷用データを準備しています',
]

interface Props {
  token: string
  profile: CompanyProfile
  save: (patch: Partial<CompanyProfile>) => void
  saveImmediate: (patch: Partial<CompanyProfile>) => Promise<CompanyProfile>
  goNext: () => void
}

export default function Step9({ token, profile, save, saveImmediate, goNext }: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!generating) { setProgressStep(0); return }
    setProgressStep(0)
    const timings = [0, 6000, 13000, 20000, 27000]
    const timers = timings.map((delay, i) =>
      setTimeout(() => setProgressStep(i), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [generating])

  const hasRequired =
    !!profile.company_name &&
    !!profile.service_area &&
    (!!profile.phone || !!profile.email) &&
    (profile.service_categories ?? []).length > 0

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/company-profile/${token}/generate`, { method: 'POST' })
      let data: { error?: string; errorCode?: string } = {}
      try { data = await res.json() } catch { /* ignore JSON parse error */ }

      if (!res.ok) {
        const errorMessages: Record<string, string> = {
          PROFILE_NOT_FOUND: '入力内容を確認できませんでした。画面を再読み込みしてお試しください。',
          AI_GENERATION_FAILED: '文章の作成に失敗しました。もう一度お試しください。',
          IMAGE_LOAD_FAILED: '写真の読み込みに失敗しました。写真を削除するか、JPEG形式で再度お試しください。',
          PDF_GENERATION_FAILED: '印刷用データの作成に失敗しました。もう一度お試しください。',
          STORAGE_SAVE_FAILED: '作成したデータの保存に失敗しました。時間をおいて再度お試しください。',
        }
        const code = data.errorCode ?? ''
        setError(errorMessages[code] ?? data.error ?? '生成に失敗しました')
        console.error('[generate] error response', { status: res.status, errorCode: code, error: data.error })
        return
      }
      router.push(`/create/${token}/complete`)
    } catch (e) {
      console.error('[generate] fetch error', e)
      setError('通信エラーが発生しました。もう一度お試しください。')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <StepLayout
      token={token}
      stepNumber={9}
      totalSteps={9}
      title="入力内容を確認してください"
      subtitle="この内容をもとに、会社紹介を作成します。あとから修正することもできます。"
      onNext={generating ? undefined : handleGenerate}
      nextLabel={generating ? '作成中...' : '会社紹介を作成する'}
      nextDisabled={!hasRequired || generating}
    >
      <div className="space-y-4">
        {/* 確認サマリー */}
        <ConfirmRow label="会社名" value={profile.company_name} required />
        <ConfirmRow label="対応エリア" value={profile.service_area} required />
        <ConfirmRow
          label="連絡先"
          value={[profile.phone, profile.email].filter(Boolean).join(' / ')}
          required
        />
        <ConfirmRow
          label="対応サービス"
          value={(profile.service_categories ?? []).join('、')}
          required
        />
        <ConfirmRow label="主な営業先" value={(profile.target_customers ?? []).join('、')} />
        <ConfirmRow label="対応する建物" value={(profile.building_types ?? []).join('、')} />
        <ConfirmRow label="代表者名" value={profile.representative_name} />
        <ConfirmRow
          label="会社ホームページアドレス"
          value={profile.company_homepage_address}
        />

        {!hasRequired && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500">
            <p className="font-medium mb-1">必須項目が未入力です</p>
            <ul className="space-y-0.5 text-xs">
              {!profile.company_name && <li>• 会社名（STEP 6）</li>}
              {!profile.service_area && <li>• 対応エリア（STEP 6）</li>}
              {!profile.phone && !profile.email && <li>• 電話番号またはメール（STEP 6）</li>}
              {(profile.service_categories ?? []).length === 0 && <li>• 対応サービス（STEP 2）</li>}
            </ul>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {generating && (
          <div className="bg-[#f5f7fa] rounded-xl p-6">
            <p className="text-sm font-bold text-[#1e3a5f] mb-1 text-center">会社紹介を作成しています</p>
            <p className="text-xs text-gray-400 mb-4 text-center">あと30秒ほどで完成します。</p>
            <div className="space-y-2">
              {PROGRESS_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i < progressStep ? (
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                  ) : i === progressStep ? (
                    <div className="w-5 h-5 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${i <= progressStep ? 'text-gray-700' : 'text-gray-300'}`}>{step}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">画面を閉じても、メールのリンクから再開できます。</p>
          </div>
        )}
      </div>
    </StepLayout>
  )
}

function ConfirmRow({ label, value, required }: { label: string; value?: string | null; required?: boolean }) {
  const isEmpty = !value
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100">
      <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <span className={`text-sm flex-1 ${isEmpty ? 'text-gray-300 italic' : 'text-gray-700'}`}>
        {isEmpty ? '未入力' : value}
      </span>
    </div>
  )
}
