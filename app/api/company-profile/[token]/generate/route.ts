import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'
import { CompanyProfile, AIGeneratedContent } from '@/lib/types'
import { buildCompanyHtml } from '@/lib/template'
import { generatePdfAndPng } from '@/lib/pdf'

// Vercel Pro で最大 60 秒まで許可
export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const FORBIDDEN_WORDS = ['業界No.1', '最高品質', '必ず', '絶対', '何でも対応', '圧倒的', '革新的', '最先端']

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

async function generateWithOpenAI(profile: CompanyProfile): Promise<AIGeneratedContent> {
  const prompt = `あなたは中小企業の営業資料を作るコピーライターです。
以下の会社情報をもとに、会社紹介PDFに掲載するテキストをJSONで生成してください。

【会社情報】
会社名: ${profile.company_name ?? '未入力'}
主な営業先: ${(profile.target_customers ?? []).join('、')}
対応工事・サービス: ${(profile.service_categories ?? []).join('、')}
対応する建物・現場: ${(profile.building_types ?? []).join('、')}
お客様からよく言われること: ${(profile.praised_points ?? []).join('、')}
仕事で大切にしていること: ${(profile.values ?? []).join('、')}
対応エリア: ${profile.service_area ?? '未入力'}
代表者名: ${profile.representative_name ?? ''}
代表者の肩書き・立場: ${profile.representative_title ?? ''}

【文体の方針】
- 誠実でわかりやすい言葉を使う
- 中小企業らしい親しみやすさを出す
- 過剰な表現・盛り過ぎは避ける
- 入力されていない実績・資格・受賞歴・施工件数・許認可・保証内容は書かない

【禁止語】業界No.1 / 最高品質 / 必ず / 絶対 / 何でも対応 / 圧倒的 / 革新的 / 最先端

以下のJSONスキーマで返してください（コードブロック不要、JSONのみ）:
{
  "catchcopy": "キャッチコピー（20〜30文字）",
  "intro": "会社紹介文（100〜150文字、句点で2文に分けること）",
  "strengths": [
    "見出し（10〜16文字、体言止め可）\n説明文（45〜70文字、具体的に。句点で2〜3文）",
    "見出し（10〜16文字、体言止め可）\n説明文（45〜70文字、具体的に。句点で2〜3文）",
    "見出し（10〜16文字、体言止め可）\n説明文（45〜70文字、具体的に。句点で2〜3文）"
  ],
  "areaText": "対応エリアの説明（40〜80文字。1文目は全体方針、2文目は具体的な市区町村名を含める）",
  "greeting": "ごあいさつ文（100〜140文字、句点で2〜3文に分けること）"
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
  })

  const raw = response.choices[0].message.content ?? '{}'
  let parsed: AIGeneratedContent
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('OpenAI returned invalid JSON')
  }

  const json = JSON.stringify(parsed)
  for (const word of FORBIDDEN_WORDS) {
    if (json.includes(word)) {
      throw new Error(`Generated content contains forbidden word: ${word}`)
    }
  }

  return parsed
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  console.log('[generate] start', { token: token.slice(0, 8) + '...' })

  const profileId = await resolveProfile(token)
  if (!profileId) {
    console.error('[generate] invalid or expired token')
    return NextResponse.json({ error: 'Invalid token', errorCode: 'INVALID_TOKEN' }, { status: 404 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('company_profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    console.error('[generate] profile not found:', profileError?.message)
    return NextResponse.json(
      { error: '入力内容を確認できませんでした。画面を再読み込みしてお試しください。', errorCode: 'PROFILE_NOT_FOUND' },
      { status: 404 }
    )
  }

  console.log('[generate] profile loaded', {
    profileId,
    company_name: profile.company_name,
    service_area: profile.service_area,
    service_categories: profile.service_categories,
  })

  // 必須項目チェック
  if (!profile.company_name) {
    return NextResponse.json({ error: '会社名が入力されていません', errorCode: 'MISSING_REQUIRED' }, { status: 400 })
  }
  if (!profile.service_area) {
    return NextResponse.json({ error: '対応エリアが入力されていません', errorCode: 'MISSING_REQUIRED' }, { status: 400 })
  }
  if (!profile.phone && !profile.email) {
    return NextResponse.json({ error: '電話番号またはメールアドレスを入力してください', errorCode: 'MISSING_REQUIRED' }, { status: 400 })
  }

  await supabaseAdmin
    .from('company_profiles')
    .update({ status: 'generating' })
    .eq('id', profileId)

  // ── 冪等処理: 既存 output レコードを再利用 ─────────────────────
  const { data: existingOutput } = await supabaseAdmin
    .from('generated_outputs')
    .select('id')
    .eq('company_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let outputId: string

  if (existingOutput) {
    await supabaseAdmin
      .from('generated_outputs')
      .update({ generation_status: 'generating', error_message: null })
      .eq('id', existingOutput.id)
    outputId = existingOutput.id
    console.log('[generate] reusing existing output record:', outputId)
  } else {
    const { data: newOutput, error: insertError } = await supabaseAdmin
      .from('generated_outputs')
      .insert({ company_profile_id: profileId, generation_status: 'generating' })
      .select()
      .single()

    if (insertError || !newOutput) {
      console.error('[generate] output insert failed:', insertError?.message)
      return NextResponse.json({ error: '生成の準備に失敗しました', errorCode: 'OUTPUT_INSERT_FAILED' }, { status: 500 })
    }
    outputId = newOutput.id
    console.log('[generate] new output record created:', outputId)
  }

  // ── uploaded_files 確認 ──────────────────────────────────────
  const { data: files, error: filesError } = await supabaseAdmin
    .from('uploaded_files')
    .select('*')
    .eq('company_profile_id', profileId)

  if (filesError) {
    console.error('[generate] uploaded_files fetch error:', filesError.message)
  } else {
    console.log('[generate] uploaded_files:', files?.map(f => ({
      file_type: f.file_type,
      storage_path: f.storage_path,
      mime_type: f.mime_type,
    })))
  }

  try {
    // ── OpenAI 生成 ──────────────────────────────────────────────
    console.log('[generate] calling OpenAI...')
    let ai: AIGeneratedContent
    try {
      ai = await generateWithOpenAI(profile as CompanyProfile)
      console.log('[generate] OpenAI success', { catchcopy: ai.catchcopy?.slice(0, 20) })
    } catch (aiErr) {
      console.error('[generate] OpenAI failed:', aiErr instanceof Error ? aiErr.message : aiErr)
      // フォールバック: AI失敗時でもPDFを生成できる最低限の内容
      const services = (profile.service_categories ?? []).join('・') || 'サービス'
      const area = profile.service_area ?? '各地域'
      ai = {
        catchcopy: `${profile.company_name ?? ''}の確かな技術`,
        intro: `${profile.company_name ?? ''}は、${area}で${services}に対応しています。丁寧な対応とわかりやすい説明を心がけ、お客様の課題解決に取り組んでいます。`,
        strengths: ['丁寧な対応', 'わかりやすい説明', '安心して相談できる体制'],
        areaText: `${area}を中心に対応しています。まずはお気軽にご相談ください。`,
        greeting: `${profile.company_name ?? ''}をご利用いただきありがとうございます。お客様のご要望に誠実にお応えし、安心してご依頼いただける体制を整えています。`,
      }
      console.log('[generate] using fallback AI content')
    }

    await supabaseAdmin
      .from('company_profiles')
      .update({
        generated_catchcopy: ai.catchcopy,
        generated_intro: ai.intro,
        generated_strengths: ai.strengths,
        generated_area_text: ai.areaText,
        generated_message: ai.greeting,
      })
      .eq('id', profileId)

    // ── 署名付き URL 取得 ────────────────────────────────────────
    console.log('[generate] fetching signed URLs for', files?.length ?? 0, 'files')
    const fileUrls: Record<string, string> = {}
    for (const f of files ?? []) {
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from('company-files')
        .createSignedUrl(f.storage_path, 3600)
      if (signErr || !signed?.signedUrl) {
        console.error('[generate] signed URL failed:', { file_type: f.file_type, storage_path: f.storage_path, error: signErr?.message })
        throw Object.assign(new Error(`Signed URL failed for ${f.file_type}: ${signErr?.message}`), { errorCode: 'IMAGE_LOAD_FAILED' })
      }
      fileUrls[f.file_type] = signed.signedUrl
      console.log('[generate] signed URL ok:', f.file_type)
    }

    // ── HTML 生成 ────────────────────────────────────────────────
    console.log('[generate] building HTML...')
    const html = await buildCompanyHtml({ profile: { ...profile, ...ai }, fileUrls, ai })
    console.log('[generate] HTML built, length:', html.length)

    // ── PDF前バリデーション（要件7） ─────────────────────────────
    const validationErrors: string[] = []
    if (!profile.company_name) validationErrors.push('会社名なし')
    if ((ai.intro ?? '').length < 20) validationErrors.push(`会社紹介文が短すぎる(${ai.intro?.length ?? 0}文字)`)
    if ((ai.strengths ?? []).length < 3) validationErrors.push(`強みが${ai.strengths?.length ?? 0}件`)
    if (!ai.greeting) validationErrors.push('ごあいさつなし')
    if (!profile.phone && !profile.email) validationErrors.push('連絡先なし')
    if (validationErrors.length > 0) {
      console.warn('[generate] validation warnings:', validationErrors)
    }
    console.log('[generate] content validation:', validationErrors.length === 0 ? 'ok' : validationErrors.join(', '))

    // ── PDF/PNG 生成 ─────────────────────────────────────────────
    console.log('[generate] generating PDF/PNG...')
    let pdfBuffer: Buffer
    let pngBuffer: Buffer
    try {
      ;({ pdfBuffer, pngBuffer } = await generatePdfAndPng(html))
      console.log('[generate] PDF/PNG generated, pdf:', pdfBuffer.length, 'png:', pngBuffer.length)
    } catch (pdfErr) {
      console.error('[generate] PDF generation failed:', pdfErr instanceof Error ? pdfErr.message : pdfErr)
      throw Object.assign(pdfErr as Error, { errorCode: 'PDF_GENERATION_FAILED' })
    }

    // ── Storage 保存 ─────────────────────────────────────────────
    const pdfPath = `${profileId}/company-profile.pdf`
    const pngPath = `${profileId}/company-profile.png`

    const { error: pdfUploadErr } = await supabaseAdmin.storage
      .from('company-files')
      .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (pdfUploadErr) {
      console.error('[generate] PDF storage upload failed:', pdfUploadErr.message)
      throw Object.assign(new Error(pdfUploadErr.message), { errorCode: 'STORAGE_SAVE_FAILED' })
    }

    const { error: pngUploadErr } = await supabaseAdmin.storage
      .from('company-files')
      .upload(pngPath, pngBuffer, { contentType: 'image/png', upsert: true })

    if (pngUploadErr) {
      console.error('[generate] PNG storage upload failed:', pngUploadErr.message)
      throw Object.assign(new Error(pngUploadErr.message), { errorCode: 'STORAGE_SAVE_FAILED' })
    }

    console.log('[generate] storage upload complete')

    // ── DB 更新 ──────────────────────────────────────────────────
    const { error: outputUpdateErr } = await supabaseAdmin
      .from('generated_outputs')
      .update({
        pdf_path: pdfPath,
        png_path: pngPath,
        html_snapshot: html,
        generation_status: 'completed',
        generated_at: new Date().toISOString(),
      })
      .eq('id', outputId)

    if (outputUpdateErr) {
      console.error('[generate] output update failed:', outputUpdateErr.message)
    }

    await supabaseAdmin
      .from('company_profiles')
      .update({ status: 'completed' })
      .eq('id', profileId)

    console.log('[generate] completed successfully', { outputId })
    return NextResponse.json({ success: true, outputId })
  } catch (err) {
    const errorCode = (err as { errorCode?: string }).errorCode ?? 'UNKNOWN'
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[generate] failed:', { errorCode, message, stack: err instanceof Error ? err.stack?.slice(0, 500) : '' })

    await supabaseAdmin
      .from('generated_outputs')
      .update({ generation_status: 'failed', error_message: `[${errorCode}] ${message}` })
      .eq('id', outputId)

    await supabaseAdmin
      .from('company_profiles')
      .update({ status: 'failed' })
      .eq('id', profileId)

    const userMessages: Record<string, string> = {
      AI_GENERATION_FAILED: '文章の作成に失敗しました。もう一度お試しください。',
      IMAGE_LOAD_FAILED: '写真の読み込みに失敗しました。写真を削除するか、JPEG形式で再度お試しください。',
      PDF_GENERATION_FAILED: '印刷用データの作成に失敗しました。もう一度お試しください。',
      STORAGE_SAVE_FAILED: '作成したデータの保存に失敗しました。時間をおいて再度お試しください。',
    }

    return NextResponse.json(
      { error: userMessages[errorCode] ?? '生成に失敗しました。しばらく待ってから再度お試しください。', errorCode },
      { status: 500 }
    )
  }
}
