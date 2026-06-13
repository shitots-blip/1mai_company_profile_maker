'use client'

import { useState, useRef } from 'react'
import StepLayout from '@/components/StepLayout'
import { CompanyProfile } from '@/lib/types'

interface UploadError {
  fileType: string
  message: string
}

interface PhotoUploadProps {
  label: string
  hint: string
  fileType: string
  token: string
  onUploaded: () => void
  onDeleted: () => void
  onError: (err: UploadError) => void
}

const HEIC_MIMES = new Set(['image/heic', 'image/heif'])

function isHeicFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return HEIC_MIMES.has(file.type.toLowerCase()) || ext === 'heic' || ext === 'heif'
}

function PhotoUpload({ label, hint, fileType, token, onUploaded, onDeleted, onError }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  // null=未アップロード / 'blob:...'=プレビューあり / '__uploaded__'=HEIC等プレビュー不可
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      onError({ fileType, message: '10MBを超える画像は追加できません' })
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_type', fileType)
    try {
      const res = await fetch(`/api/company-profile/${token}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        // HEIC はほとんどのブラウザでプレビュー不可のため専用表示
        setPreview(isHeicFile(file) ? '__uploaded__' : URL.createObjectURL(file))
        onUploaded()
      } else {
        const data = await res.json().catch(() => ({}))
        onError({ fileType, message: data.error ?? 'アップロードに失敗しました' })
      }
    } catch {
      onError({ fileType, message: '通信エラーが発生しました' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete() {
    try {
      await fetch(`/api/company-profile/${token}/upload?file_type=${fileType}`, { method: 'DELETE' })
    } finally {
      setPreview(null)
      onDeleted()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-sm text-gray-800">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        </div>
        {preview && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-600 cursor-pointer px-2 py-1"
          >
            削除
          </button>
        )}
      </div>

      {preview === '__uploaded__' ? (
        <div className="w-full h-32 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center justify-center text-green-600 mt-1">
          <span className="text-2xl mb-1">✓</span>
          <span className="text-xs font-medium">アップロード済み</span>
        </div>
      ) : preview ? (
        <img src={preview} alt={label} className="w-full h-32 object-cover rounded-lg mt-1" />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-xl mb-0.5">＋</span>
              <span className="text-xs">写真を選択</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.heic,.heif,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}

interface Props {
  token: string
  profile: CompanyProfile
  save: (patch: Partial<CompanyProfile>) => void
  saveImmediate: (patch: Partial<CompanyProfile>) => Promise<CompanyProfile>
  goNext: () => void
}

export default function Step8({ token, profile, save, saveImmediate, goNext }: Props) {
  const [uploadError, setUploadError] = useState<string | null>(null)

  function handleError(err: { fileType: string; message: string }) {
    setUploadError(err.message)
    setTimeout(() => setUploadError(null), 5000)
  }

  async function handleNext() {
    await saveImmediate({ current_step: Math.max(profile.current_step, 9) })
    goNext()
  }

  return (
    <StepLayout
      token={token}
      stepNumber={8}
      totalSteps={9}
      title="写真を追加してください"
      subtitle="写真があると、より安心感のある会社紹介になります。写真がなくても作成できます。"
      onNext={handleNext}
      nextLabel="写真なしで進む"
    >
      <div className="space-y-3">

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {uploadError}
          </div>
        )}

        <PhotoUpload
          label="作業風景の写真"
          hint="現場・完成した仕事の写真など"
          fileType="work_photo"
          token={token}
          onUploaded={() => setUploadError(null)}
          onDeleted={() => {}}
          onError={handleError}
        />
        <PhotoUpload
          label="代表者写真（任意）"
          hint="ごあいさつ欄に表示されます（任意）"
          fileType="representative_photo"
          token={token}
          onUploaded={() => setUploadError(null)}
          onDeleted={() => {}}
          onError={handleError}
        />
        <PhotoUpload
          label="会社ロゴ"
          hint="ヘッダーに表示されます（任意）"
          fileType="logo"
          token={token}
          onUploaded={() => setUploadError(null)}
          onDeleted={() => {}}
          onError={handleError}
        />

        <p className="text-xs text-gray-400 text-center pt-1">
          JPEG・PNG・WEBP・HEIC対応 / 各10MBまで
        </p>
        <p className="text-xs text-gray-400 text-center">
          写真はあとから追加・変更できます。
        </p>
        <button
          onClick={handleNext}
          className="w-full py-3 bg-[#e8a838] text-white text-sm font-bold rounded-xl hover:bg-[#c07820] transition cursor-pointer"
        >
          会社紹介を作成する
        </button>
      </div>
    </StepLayout>
  )
}
