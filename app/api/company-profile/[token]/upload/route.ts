import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import convert from 'heic-convert'

const HEIC_MIMES = new Set(['image/heic', 'image/heif'])
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function fileExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isHeicFile(file: File): boolean {
  const ext = fileExt(file.name)
  return HEIC_MIMES.has(file.type.toLowerCase()) || ext === 'heic' || ext === 'heif'
}

async function resolveProfile(token: string) {
  const { data, error } = await supabaseAdmin
    .from('resume_tokens')
    .select('company_profile_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  if (error || !data) return null
  return data.company_profile_id as string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const profileId = await resolveProfile(token)
  if (!profileId) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const fileType = formData.get('file_type') as string

  if (!file || !fileType) {
    return NextResponse.json({ error: 'Missing file or file_type' }, { status: 400 })
  }

  const allowedTypes = ['work_photo', 'representative_photo', 'logo']
  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json({ error: 'Invalid file_type' }, { status: 400 })
  }

  const heic = isHeicFile(file)
  if (!heic && !ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  // ── HEIC → JPEG 変換 ──────────────────────────────────────────
  let uploadBuffer: Buffer
  let uploadMimeType: string
  let uploadExt: string

  if (heic) {
    try {
      const inputBuffer = Buffer.from(await file.arrayBuffer())
      const jpegBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.88 })
      uploadBuffer = Buffer.from(jpegBuffer)
      uploadMimeType = 'image/jpeg'
      uploadExt = 'jpg'
      console.log('[upload] HEIC converted to JPEG', { original: file.name, size: inputBuffer.length, converted: uploadBuffer.length })
    } catch (err) {
      console.error('[upload] HEIC conversion failed:', err)
      return NextResponse.json(
        { error: 'iPhone写真（HEIC）の変換に失敗しました。JPEG形式で再度お試しください。' },
        { status: 422 }
      )
    }
  } else {
    uploadBuffer = Buffer.from(await file.arrayBuffer())
    uploadMimeType = file.type
    uploadExt = fileExt(file.name) || 'jpg'
  }

  const storagePath = `${profileId}/${fileType}_${Date.now()}.${uploadExt}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('company-files')
    .upload(storagePath, uploadBuffer, {
      contentType: uploadMimeType,
      upsert: true,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // 同一 file_type の既存レコード（＋Storage上のファイル）を削除
  const { data: existing } = await supabaseAdmin
    .from('uploaded_files')
    .select('storage_path')
    .eq('company_profile_id', profileId)
    .eq('file_type', fileType)
    .single()

  if (existing) {
    await supabaseAdmin.storage.from('company-files').remove([existing.storage_path])
  }

  await supabaseAdmin
    .from('uploaded_files')
    .delete()
    .eq('company_profile_id', profileId)
    .eq('file_type', fileType)

  const { data: fileRecord, error: dbError } = await supabaseAdmin
    .from('uploaded_files')
    .insert({
      company_profile_id: profileId,
      file_type: fileType,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: uploadMimeType,
      file_size: uploadBuffer.length,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })

  return NextResponse.json({ file: fileRecord })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const profileId = await resolveProfile(token)
  if (!profileId) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const fileType = searchParams.get('file_type')
  if (!fileType) return NextResponse.json({ error: 'Missing file_type' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('uploaded_files')
    .select('storage_path')
    .eq('company_profile_id', profileId)
    .eq('file_type', fileType)
    .single()

  if (existing) {
    await supabaseAdmin.storage.from('company-files').remove([existing.storage_path])
    await supabaseAdmin
      .from('uploaded_files')
      .delete()
      .eq('company_profile_id', profileId)
      .eq('file_type', fileType)
  }

  return NextResponse.json({ success: true })
}
