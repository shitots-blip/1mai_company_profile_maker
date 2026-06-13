import QRCode from 'qrcode'
import { CompanyProfile, AIGeneratedContent } from '@/lib/types'

interface TemplateOptions {
  profile: CompanyProfile & Partial<AIGeneratedContent>
  fileUrls: Record<string, string>
  ai: AIGeneratedContent
}

// ── QRコード生成 ─────────────────────────────────────────────────────────
async function buildQrDataUrl(url: string | null | undefined): Promise<string> {
  if (!url) return ''
  try {
    return await QRCode.toDataURL(url, {
      width: 80,
      margin: 1,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    })
  } catch {
    return ''
  }
}

// ── 共通CSS ──────────────────────────────────────────────────────────────
const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm;
    height: 297mm;
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
    background: #ffffff;
    color: #222222;
    overflow: hidden;
  }
  .page {
    width: 210mm;
    height: 297mm;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* ── ヘッダー（共通） ── */
  .header {
    background: #1e3a5f;
    height: 52px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 22px;
  }
  .logo-img  { height: 36px; object-fit: contain; }
  .logo-text { color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 0.04em; }
  .header-catchcopy {
    color: rgba(255,255,255,0.90);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-align: right;
    max-width: 260px;
    line-height: 1.5;
  }

  /* ── フッター（共通・absolute） ── */
  .footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 24px;
    background: #1e3a5f;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
  }
  .footer-text { font-size: 8px; color: rgba(255,255,255,0.82); }

  /* ── 共通セクションタイトル ── */
  .section-title {
    font-size: 8.5px;
    font-weight: 700;
    color: #1e3a5f;
    letter-spacing: 0.12em;
    border-left: 3px solid #1e3a5f;
    padding-left: 6px;
    margin-bottom: 7px;
    text-transform: uppercase;
  }
`

// ════════════════════════════════════════════════════════════════════
// 写真ありレイアウト（既存ベース）
// ════════════════════════════════════════════════════════════════════
function buildPhotoLayout(opts: {
  profile: CompanyProfile & Partial<AIGeneratedContent>
  ai: AIGeneratedContent
  fileUrls: Record<string, string>
  qrDataUrl: string
  logoHtml: string
}): string {
  const { profile, ai, fileUrls, qrDataUrl, logoHtml } = opts

  const workPhotoHtml = fileUrls.work_photo
    ? `<img src="${fileUrls.work_photo}" alt="作業風景" class="photo-work" />`
    : ''
  const repPhotoHtml = fileUrls.representative_photo
    ? `<img src="${fileUrls.representative_photo}" alt="代表者写真" class="photo-rep" />`
    : ''

  const strengthsHtml = (ai.strengths ?? [])
    .map((s, i) => `
      <div class="strength-item">
        <div class="strength-num">${i + 1}</div>
        <p class="strength-text">${s}</p>
      </div>`)
    .join('')

  const css = `
    ${BASE_CSS}
    .content {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 168px;
      padding: 15px 20px 30px;
      gap: 0;
      min-height: 0;
    }
    .left  { display: flex; flex-direction: column; gap: 11px; padding-right: 15px; }
    .right { display: flex; flex-direction: column; gap: 11px; }
    .intro-text { font-size: 10.5px; line-height: 1.85; color: #333; }
    .photo-work { width: 100%; height: 110px; object-fit: cover; border-radius: 4px; }
    .strengths  { display: flex; flex-direction: column; gap: 5px; }
    .strength-item {
      display: flex; align-items: flex-start; gap: 8px;
      background: #f5f7fa; border-radius: 4px; padding: 6px 10px;
    }
    .strength-num {
      width: 20px; height: 20px; background: #1e3a5f; color: #fff;
      border-radius: 50%; font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .strength-text { font-size: 10px; line-height: 1.6; color: #333; }
    .area-text     { font-size: 10px; line-height: 1.7; color: #444; }
    .contact-box {
      background: #f5f7fa; border-radius: 4px; padding: 9px 10px;
      display: flex; flex-direction: column; gap: 5px;
    }
    .contact-label { font-size: 7.5px; color: #999; display: block; }
    .contact-value { font-size: 9.5px; font-weight: 600; color: #1e3a5f; line-height: 1.4; }
    .service-tags  { display: flex; flex-wrap: wrap; gap: 4px; }
    .service-tag   {
      background: #1e3a5f; color: #fff; font-size: 8px;
      padding: 2px 6px; border-radius: 3px; line-height: 1.5;
    }
    .building-tag  { background: #4a7fb5; }
    .greeting-box  {
      border: 1px solid #dde3ec; border-radius: 4px; padding: 9px;
      display: flex; gap: 8px; align-items: flex-start;
    }
    .photo-rep  { width: 44px; height: 52px; object-fit: cover; border-radius: 3px; flex-shrink: 0; }
    .greeting-name { font-size: 8.5px; color: #666; margin-bottom: 3px; }
    .greeting-text { font-size: 9.5px; line-height: 1.7; color: #333; }
    .qr-wrap       { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .qr-wrap img   { width: 64px; height: 64px; }
    .qr-label      { font-size: 7.5px; color: #888; text-align: center; }
    .qr-url        { font-size: 7px; color: #1e3a5f; word-break: break-all; text-align: center; }
  `

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${profile.company_name ?? '会社紹介'}</title>
<style>${css}</style>
</head>
<body>
<div class="page">
  <header class="header">
    ${logoHtml}
    <div class="header-catchcopy">${ai.catchcopy}</div>
  </header>

  <div class="content">
    <div class="left">
      <div>
        <div class="section-title">会社紹介</div>
        <p class="intro-text">${ai.intro}</p>
      </div>
      ${workPhotoHtml ? `<div>${workPhotoHtml}</div>` : ''}
      <div>
        <div class="section-title">私たちの強み</div>
        <div class="strengths">${strengthsHtml}</div>
      </div>
      <div>
        <div class="section-title">対応エリア</div>
        <p class="area-text">${ai.areaText}</p>
      </div>
      <div>
        <div class="section-title">ごあいさつ</div>
        <div class="greeting-box">
          ${repPhotoHtml}
          <div style="flex:1">
            ${profile.representative_name ? `<div class="greeting-name">${profile.representative_title ?? ''} ${profile.representative_name}</div>` : ''}
            <p class="greeting-text">${ai.greeting}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="right">
      <div>
        <div class="section-title">会社情報</div>
        <div class="contact-box">
          <div><span class="contact-label">会社名</span><span class="contact-value">${profile.company_name ?? ''}</span></div>
          ${profile.address ? `<div><span class="contact-label">所在地</span><span class="contact-value" style="font-size:8.5px">${profile.postal_code ? `〒${profile.postal_code} ` : ''}${profile.address}</span></div>` : ''}
          ${profile.phone ? `<div><span class="contact-label">電話番号</span><span class="contact-value">${profile.phone}</span></div>` : ''}
          ${profile.email ? `<div><span class="contact-label">メール</span><span class="contact-value" style="font-size:8px">${profile.email}</span></div>` : ''}
          ${profile.established_year ? `<div><span class="contact-label">創業</span><span class="contact-value">${profile.established_year}年</span></div>` : ''}
        </div>
      </div>
      ${(profile.service_categories ?? []).length > 0 ? `
      <div>
        <div class="section-title">対応サービス</div>
        <div class="service-tags">${(profile.service_categories ?? []).map((s: string) => `<span class="service-tag">${s}</span>`).join('')}</div>
      </div>` : ''}
      ${(profile.building_types ?? []).length > 0 ? `
      <div>
        <div class="section-title">対応現場</div>
        <div class="service-tags">${(profile.building_types ?? []).map((b: string) => `<span class="service-tag building-tag">${b}</span>`).join('')}</div>
      </div>` : ''}
      ${qrDataUrl ? `
      <div>
        <div class="section-title">ホームページ</div>
        <div class="qr-wrap">
          <img src="${qrDataUrl}" alt="QRコード" />
          <div class="qr-label">QRコードを読み取る</div>
          <div class="qr-url">${profile.company_homepage_address}</div>
        </div>
      </div>` : ''}
    </div>
  </div>

  <footer class="footer">
    ${profile.phone ? `<span class="footer-text">📞 ${profile.phone}</span>` : ''}
    ${profile.email ? `<span class="footer-text">✉ ${profile.email}</span>` : ''}
    ${profile.service_area ? `<span class="footer-text">📍 ${profile.service_area}</span>` : ''}
  </footer>
</div>
</body>
</html>`
}

// ════════════════════════════════════════════════════════════════════
// 写真なし専用レイアウト — ヘルパー
// ════════════════════════════════════════════════════════════════════

/** 「よくあるご相談」リスト：service_categories から短い相談例を生成 */
function buildConsultItems(profile: CompanyProfile & Partial<AIGeneratedContent>): string[] {
  const cats = profile.service_categories ?? []
  if (cats.length > 0) return cats.slice(0, 4).map((s) => `${s}のご相談`)
  // フォールバック: values（大切にしていること）
  return (profile.values ?? []).slice(0, 4)
}

/** 「こんなお困りごとはありませんか？」リスト：業種に応じて自然文で生成 */
const SERVICE_TROUBLE_MAP: Record<string, string> = {
  '電気工事':   '電気配線・ブレーカーのトラブル',
  'LED照明':    '照明をLEDに切り替えたい',
  '防犯カメラ': '防犯カメラを設置・増設したい',
  '空調設備':   '空調・換気設備を修繕・交換したい',
  '給排水':     '給排水設備のトラブルを解消したい',
  '消防設備':   '消防設備の点検・工事を依頼したい',
  '通信工事':   '通信・インターネット設備を整備したい',
  '内装工事':   '内装・クロスの修繕・リフォーム',
  '外壁工事':   '外壁の補修・塗装を検討している',
  '設備工事':   '各種設備工事を一括で依頼したい',
  '管工事':     '配管の修繕・更新を相談したい',
  '塗装工事':   '建物の塗装・防水を相談したい',
}

function buildTroubleItems(profile: CompanyProfile & Partial<AIGeneratedContent>): string[] {
  const items: string[] = []
  for (const s of (profile.service_categories ?? []).slice(0, 3)) {
    items.push(SERVICE_TROUBLE_MAP[s] ?? `${s}のご依頼・ご相談`)
  }
  const buildings = profile.building_types ?? []
  const targets   = profile.target_customers ?? []
  if (buildings.length > 0) {
    items.push(`${buildings[0]}の設備管理・修繕を相談したい`)
  } else if (targets.length > 0) {
    items.push(`${targets[0]}向けの工事先をお探しの場合`)
  }
  if (items.length < 5) items.push('小規模な工事や修繕を気軽に相談したい')
  return items.slice(0, 5)
}

// ════════════════════════════════════════════════════════════════════
// 写真なし専用レイアウト
// ════════════════════════════════════════════════════════════════════
function buildNoPhotoLayout(opts: {
  profile: CompanyProfile & Partial<AIGeneratedContent>
  ai: AIGeneratedContent
  fileUrls: Record<string, string>
  qrDataUrl: string
  logoHtml: string
}): string {
  const { profile, ai, fileUrls, qrDataUrl, logoHtml } = opts

  // ── 各リスト項目 HTML ───────────────────────────────────────────
  const serviceItems = (profile.service_categories ?? [])
    .map((s: string) => `<li class="np-list-item">${s}</li>`).join('')

  const buildingItems = (profile.building_types ?? [])
    .map((b: string) => `<li class="np-list-item">${b}</li>`).join('')

  const targetItems = (profile.target_customers ?? [])
    .map((t: string) => `<li class="np-list-item">${t}</li>`).join('')

  // ── 「よくあるご相談」リスト HTML（max 4件、箇条書き） ───────────
  const consultItems = buildConsultItems(profile)
    .slice(0, 4)
    .map((c) => `<li class="np-consult-item">${c}</li>`).join('')

  // ── 「こんなお困りごと」リスト HTML（max 4件、箇条書き） ──────────
  const troubleItems = buildTroubleItems(profile)
    .slice(0, 4)
    .map((t) => `<li class="np-trouble-item">${t}</li>`).join('')

  // ── 強み：全幅リスト形式（3カードグリッドをやめる） ─────────────
  const strengthRows = (ai.strengths ?? [])
    .map((s, i) => `
      <div class="np-strength-row">
        <div class="np-strength-num">${i + 1}</div>
        <p class="np-strength-text">${s}</p>
      </div>`).join('')

  // ── 会社情報アイテム（フォントサイズを読みやすく） ───────────────
  const contactItems = [
    { label: '会社名',   value: profile.company_name,   big: true },
    (profile.postal_code || profile.address)
      ? { label: '所在地', value: `${profile.postal_code ? `〒${profile.postal_code} ` : ''}${profile.address ?? ''}`, small: true }
      : null,
    profile.phone            ? { label: '電話番号', value: profile.phone }                   : null,
    profile.email            ? { label: 'メール',   value: profile.email,   small: true }    : null,
    profile.established_year ? { label: '創業',     value: `${profile.established_year}年` } : null,
  ]
    .filter(Boolean)
    .map((item) => {
      const v = item!
      const valStyle = v.big   ? 'font-size:12px;font-weight:700;line-height:1.3;color:#1e3a5f'
                     : v.small ? 'font-size:9.5px;line-height:1.5'
                     : 'font-size:11px'
      return `
        <div class="np-contact-row">
          <span class="np-contact-label">${v.label}</span>
          <span class="np-contact-value" style="${valStyle}">${v.value}</span>
        </div>`
    })
    .join('')

  const css = `
    ${BASE_CSS}

    /* ════ 写真なし専用レイアウト — 読みやすさ優先版 ════ */

    /* ── ヘッダー上書き：社名を大きく ── */
    .header {
      height: 64px;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 4px;
      padding: 0 24px;
    }
    .logo-text {
      font-size: 24px;
      letter-spacing: 0.01em;
    }
    .header-catchcopy {
      font-size: 10px;
      opacity: 0.80;
      text-align: left;
      max-width: 100%;
      letter-spacing: 0.05em;
    }

    /* ── メインコンテンツ ── */
    .np-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 16px 24px 28px;
      gap: 13px;
      min-height: 0;
    }

    /* ① 会社紹介イントロ帯 */
    .np-intro {
      background: #f8fafc;
      border-left: 4px solid #1e3a5f;
      border-radius: 0 5px 5px 0;
      padding: 14px 18px;
      flex-shrink: 0;
    }
    .np-intro-label {
      font-size: 7.5px; font-weight: 700; color: #1e3a5f;
      letter-spacing: 0.13em; text-transform: uppercase; margin-bottom: 7px;
    }
    .np-intro-text { font-size: 13px; line-height: 2.0; color: #2d3748; }

    /* ② 3カラム情報カード（高さ抑えめ・文字読みやすく） */
    .np-cards-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 9px;
      flex-shrink: 0;
    }
    .np-card {
      background: #f5f7fa; border-radius: 5px;
      padding: 12px 13px; border-top: 3px solid #1e3a5f;
    }
    .np-card-building { border-top-color: #4a7fb5; }
    .np-card-area     { border-top-color: #276749; }
    .np-card-target   { border-top-color: #744210; }
    .np-card-title {
      font-size: 8px; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: #1e3a5f; margin-bottom: 8px;
    }
    .np-card-building .np-card-title { color: #4a7fb5; }
    .np-card-area     .np-card-title { color: #276749; }
    .np-card-target   .np-card-title { color: #744210; }
    .np-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
    .np-list-item {
      font-size: 11px; color: #333; line-height: 1.6;
      padding-left: 12px; position: relative;
    }
    .np-list-item::before {
      content: ''; position: absolute; left: 0; top: 7px;
      width: 4px; height: 4px; border-radius: 50%;
      background: #1e3a5f; opacity: 0.5;
    }
    .np-card-building .np-list-item::before { background: #4a7fb5; }
    .np-card-area .np-area-text { font-size: 11px; line-height: 1.85; color: #333; }

    /* ③ 強み：全幅ボックス（3カードグリッドをやめて縦リスト化） */
    .np-strengths-box {
      background: #f5f7fa;
      border-radius: 5px;
      padding: 13px 18px 14px;
      flex-shrink: 0;
    }
    .np-strengths-label {
      font-size: 8px; font-weight: 700; color: #1e3a5f;
      letter-spacing: 0.12em; text-transform: uppercase;
      border-left: 3px solid #1e3a5f; padding-left: 6px; margin-bottom: 10px;
    }
    .np-strength-list { display: flex; flex-direction: column; gap: 8px; }
    .np-strength-row {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 6px 0;
      border-bottom: 1px solid #e0e6ef;
    }
    .np-strength-row:last-child { border-bottom: none; padding-bottom: 0; }
    .np-strength-num {
      width: 24px; height: 24px; flex-shrink: 0;
      background: #1e3a5f; color: #fff; border-radius: 50%;
      font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      margin-top: 1px;
    }
    .np-strength-text { font-size: 12px; line-height: 1.8; color: #2d3748; }

    /* ④ 下部2カラム（flex:1） */
    .np-bottom {
      display: grid;
      grid-template-columns: 1fr 185px;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }

    /* ── 左カラム ── */
    .np-left { display: flex; flex-direction: column; gap: 12px; min-height: 0; }

    /* ごあいさつ（flex:1 で残り高さを吸収） */
    .np-greeting-section {
      flex: 1; display: flex; flex-direction: column; min-height: 0;
    }
    .np-greeting {
      flex: 1;
      border: 1px solid #d8e2f0; border-radius: 5px;
      padding: 16px 20px; min-height: 90px; background: #f9fbfd;
    }
    .np-greeting-name {
      font-size: 11px; color: #333; margin-bottom: 10px;
      font-weight: 700;
    }
    .np-greeting-text { font-size: 11px; line-height: 2.1; color: #333; }

    /* よくあるご相談（自然な高さ・max 4件） */
    .np-consult { flex-shrink: 0; }
    .np-consult-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
    .np-consult-item {
      font-size: 11px; color: #333; line-height: 1.6;
      padding-left: 14px; position: relative;
    }
    .np-consult-item::before {
      content: '・'; position: absolute; left: 0;
      color: #4a7fb5; font-size: 12px; top: -1px;
    }

    /* こんなお困りごとはありませんか？（自然な高さ・max 4件・チェックなし） */
    .np-trouble {
      flex-shrink: 0;
      border: 1px solid #c4d4e8; border-radius: 5px;
      background: #eef3f9;
      padding: 12px 16px 12px;
    }
    .np-trouble-title {
      font-size: 11px; font-weight: 700; color: #1e3a5f;
      margin-bottom: 8px; line-height: 1.4;
    }
    .np-trouble-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .np-trouble-item {
      font-size: 11px; color: #2d3748; line-height: 1.6;
      padding-left: 14px; position: relative;
    }
    .np-trouble-item::before {
      content: '・'; position: absolute; left: 0;
      color: #4a7fb5; font-size: 12px; top: -1px;
    }
    .np-trouble-footer {
      margin-top: 10px; padding-top: 8px;
      border-top: 1px solid #b8ccdf;
    }
    .np-trouble-footer-lead { font-size: 9px; color: #5a7090; margin-bottom: 4px; }
    .np-trouble-phone { font-size: 12px; font-weight: 700; color: #1e3a5f; }
    .np-trouble-email { font-size: 10px; color: #4a6080; margin-top: 2px; }

    /* ── 右カラム（会社情報＋QR）── */
    .np-right { display: flex; flex-direction: column; gap: 10px; justify-content: space-between; }
    .np-company-box { background: #f5f7fa; border-radius: 5px; padding: 12px 13px; }
    .np-contact-row {
      display: flex; flex-direction: column;
      padding: 6px 0; border-bottom: 1px solid #e8ecf0;
    }
    .np-contact-row:last-child { border-bottom: none; }
    .np-contact-label { font-size: 7.5px; color: #aaa; margin-bottom: 2px; }
    .np-contact-value { font-size: 11px; font-weight: 600; color: #1e3a5f; }

    /* QR（行動導線・ホームページなし時は非表示） */
    .np-qr-box { border: 1px solid #dde3ec; border-radius: 5px; padding: 11px 10px 9px; }
    .np-qr-subtitle { font-size: 8.5px; color: #666; line-height: 1.5; margin-bottom: 6px; text-align: center; }
    .np-qr-img-wrap { display: flex; justify-content: center; margin-bottom: 5px; }
    .np-qr-img-wrap img { width: 66px; height: 66px; }
    .np-qr-action { font-size: 9px; font-weight: 700; color: #1e3a5f; text-align: center; }
    .np-qr-url { font-size: 7.5px; color: #888; text-align: center; word-break: break-all; margin-top: 3px; }
  `

  const logoHtmlFinal = fileUrls.logo
    ? `<img src="${fileUrls.logo}" alt="ロゴ" class="logo-img" />`
    : logoHtml

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${profile.company_name ?? '会社紹介'}</title>
<style>${css}</style>
</head>
<body>
<div class="page">

  <!-- ヘッダー -->
  <header class="header">
    ${logoHtmlFinal}
    <div class="header-catchcopy">${ai.catchcopy}</div>
  </header>

  <!-- メインコンテンツ（写真なし専用） -->
  <div class="np-content">

    <!-- ① 会社紹介（イントロ帯） -->
    <div class="np-intro">
      <div class="np-intro-label">会社紹介</div>
      <p class="np-intro-text">${ai.intro}</p>
    </div>

    <!-- ② 3カラム情報カード -->
    <div class="np-cards-row">

      <div class="np-card">
        <div class="np-card-title">対応サービス</div>
        <ul class="np-list">${serviceItems || '<li class="np-list-item">—</li>'}</ul>
      </div>

      ${buildingItems
        ? `<div class="np-card np-card-building">
             <div class="np-card-title">対応現場</div>
             <ul class="np-list">${buildingItems}</ul>
           </div>`
        : `<div class="np-card np-card-target">
             <div class="np-card-title">主な営業先</div>
             <ul class="np-list">${targetItems || '<li class="np-list-item">—</li>'}</ul>
           </div>`}

      <div class="np-card np-card-area">
        <div class="np-card-title">対応エリア</div>
        <p class="np-area-text">${ai.areaText}</p>
      </div>

    </div>

    <!-- ③ 強み：全幅ボックス・縦リスト（3カードグリッドから変更） -->
    <div class="np-strengths-box">
      <div class="np-strengths-label">私たちの強み</div>
      <div class="np-strength-list">${strengthRows}</div>
    </div>

    <!-- ④ 下部（ごあいさつ・よくあるご相談・お困りごと ＋ 会社情報） -->
    <div class="np-bottom">

      <div class="np-left">

        <!-- ごあいさつ（flex:1 で残り高さを吸収） -->
        <div class="np-greeting-section">
          <div class="section-title">ごあいさつ</div>
          <div class="np-greeting">
            ${profile.representative_name
              ? `<div class="np-greeting-name">${profile.representative_title ?? ''} ${profile.representative_name}</div>`
              : ''}
            <p class="np-greeting-text">${ai.greeting}</p>
          </div>
        </div>

        <!-- よくあるご相談（service_categoriesベース、max 4件） -->
        ${consultItems ? `
        <div class="np-consult">
          <div class="section-title">よくあるご相談</div>
          <ul class="np-consult-list">${consultItems}</ul>
        </div>` : ''}

        <!-- こんなお困りごとはありませんか？（自然な高さ・max 4件） -->
        <div class="np-trouble">
          <div class="np-trouble-title">こんなお困りごとはありませんか？</div>
          <ul class="np-trouble-list">${troubleItems}</ul>
          <div class="np-trouble-footer">
            <div class="np-trouble-footer-lead">まずはお気軽にご相談ください</div>
            ${profile.phone ? `<div class="np-trouble-phone">📞 ${profile.phone}</div>` : ''}
            ${profile.email ? `<div class="np-trouble-email">✉ ${profile.email}</div>` : ''}
          </div>
        </div>

      </div>

      <div class="np-right">
        <div>
          <div class="section-title">会社情報</div>
          <div class="np-company-box">${contactItems}</div>
        </div>

        ${qrDataUrl ? `
        <div>
          <div class="section-title">ホームページ</div>
          <div class="np-qr-box">
            <div class="np-qr-subtitle">施工事例・詳しい対応内容はこちら</div>
            <div class="np-qr-img-wrap">
              <img src="${qrDataUrl}" alt="QRコード" />
            </div>
            <div class="np-qr-action">会社ホームページを見る</div>
            <div class="np-qr-url">${profile.company_homepage_address}</div>
          </div>
        </div>` : ''}
      </div>

    </div>
  </div>

  <!-- フッター -->
  <footer class="footer">
    ${profile.phone      ? `<span class="footer-text">📞 ${profile.phone}</span>`      : ''}
    ${profile.email      ? `<span class="footer-text">✉ ${profile.email}</span>`       : ''}
    ${profile.service_area ? `<span class="footer-text">📍 ${profile.service_area}</span>` : ''}
  </footer>

</div>
</body>
</html>`
}

// ════════════════════════════════════════════════════════════════════
// 写真なし専用レイアウト V2 — ChibaChuoスタイル（写真なし対応版）
// ヘッダー（白） / 大キャッチコピー / 強み3列 / 代表あいさつ / 情報エリア3列 / フッター
// ════════════════════════════════════════════════════════════════════
function buildNoPhotoLayoutV2(opts: {
  profile: CompanyProfile & Partial<AIGeneratedContent>
  ai: AIGeneratedContent
  fileUrls: Record<string, string>
  qrDataUrl: string
  logoHtml: string
}): string {
  const { profile, ai, fileUrls, qrDataUrl } = opts

  // ── ヘッダー左側（ロゴ or 社名） ─────────────────────────────────
  const headerLeft = fileUrls.logo
    ? `<div class="np-header-left">
         <img src="${fileUrls.logo}" alt="ロゴ" class="np-logo-img" />
         <div class="np-coname">${profile.company_name ?? ''}</div>
       </div>`
    : `<div class="np-coname">${profile.company_name ?? ''}</div>`

  // ── ヘッダー右（業種・サービス概要） ─────────────────────────────
  const headerRight = (profile.service_categories ?? []).slice(0, 3).join('・')

  // ── 強み 3列カード ────────────────────────────────────────────────
  const strengthCards = (ai.strengths ?? [])
    .slice(0, 3)
    .map((s, i) => {
      const num = String(i + 1).padStart(2, '0')
      // タイトル（最初の句点/読点/スペースまでを強みタイトルとする、なければ全体）
      const titleMatch = s.match(/^(.{4,18}?)[。、\s　]/)
      const title = titleMatch ? titleMatch[1] : s.slice(0, 15)
      const body  = titleMatch ? s.slice(titleMatch[0].length) : ''
      return `
      <div class="np-strength-card">
        <div class="np-strength-num">${num}</div>
        <div class="np-strength-title">${title}</div>
        ${body ? `<div class="np-strength-body">${body}</div>` : ''}
      </div>`
    })
    .join('')

  // ── 代表あいさつ ──────────────────────────────────────────────────
  const greetingHtml = `
    <div class="np-greeting-label-row">
      <div class="np-greeting-bar"></div>
      <div class="np-greeting-label">代表ごあいさつ</div>
    </div>
    <div class="np-greeting-text">${ai.greeting}</div>
    ${profile.representative_name ? `
    <div class="np-greeting-name">
      <span class="np-greeting-role">${profile.representative_title ?? ''}</span>
      <span class="np-greeting-person">${profile.representative_name}</span>
    </div>` : ''}`

  // ── 対応サービス タグ ─────────────────────────────────────────────
  const serviceTags = (profile.service_categories ?? [])
    .map((s: string) => `<div class="np-tag">${s}</div>`)
    .join('')

  // ── 主な対応先 リスト ─────────────────────────────────────────────
  const targets = (profile.building_types ?? []).length > 0
    ? profile.building_types!
    : (profile.target_customers ?? [])
  const targetItems = targets
    .map((t: string) => `<div class="np-target-item"><span class="np-arrow">▸</span>${t}</div>`)
    .join('')

  // ── 会社概要 テーブル ─────────────────────────────────────────────
  const overviewRows = [
    { l: '社　名', v: profile.company_name ?? '' },
    (profile.postal_code || profile.address)
      ? { l: '所在地', v: `${profile.postal_code ? `〒${profile.postal_code} ` : ''}${profile.address ?? ''}` }
      : null,
    profile.established_year ? { l: '創　業', v: `${profile.established_year}年` } : null,
    profile.representative_name
      ? { l: '代　表', v: `${profile.representative_title ?? ''}　${profile.representative_name}` }
      : null,
  ]
    .filter(Boolean)
    .map(
      (row, i, arr) => `
      <div class="np-overview-row${i < arr.length - 1 ? '' : ' np-overview-last'}">
        <span class="np-overview-label">${row!.l}</span>
        <span class="np-overview-value">${row!.v}</span>
      </div>`
    )
    .join('')

  // ── QR ───────────────────────────────────────────────────────────
  const qrHtml = qrDataUrl
    ? `<div class="np-qr-wrap">
         <img src="${qrDataUrl}" alt="QRコード" class="np-qr-img" />
         <div class="np-qr-caption">詳しい対応内容はこちら</div>
       </div>`
    : ''

  // ── 連絡先 ────────────────────────────────────────────────────────
  const contactHtml = [
    profile.phone ? `<div class="np-contact-row"><span class="np-contact-label">TEL</span><span class="np-contact-tel">${profile.phone}</span></div>` : '',
    profile.email ? `<div class="np-contact-row"><span class="np-contact-label">MAIL</span><span class="np-contact-sub">${profile.email}</span></div>` : '',
    profile.company_homepage_address ? `<div class="np-contact-row"><span class="np-contact-label">WEB</span><span class="np-contact-sub">${profile.company_homepage_address}</span></div>` : '',
  ].join('')

  const css = `
    ${BASE_CSS}

    /* ════ 写真なし V2: ChibaChuoスタイル ════ */

    /* ── フッターをフロー内に（absolute 解除） ── */
    .footer {
      position: static;
      flex-shrink: 0;
    }

    /* ── ヘッダー：白背景・左社名・右業種（ゆったり ~24mm） ── */
    .header {
      background: #ffffff;
      height: auto;
      padding: 7mm 8mm;
      border-bottom: 2px solid #1e3a5f;
      align-items: center;
    }
    .np-header-left {
      display: flex;
      align-items: center;
      gap: 3.5mm;
    }
    .np-logo-img {
      height: 34px;
      object-fit: contain;
    }
    .np-coname {
      font-size: 7.5mm;
      font-weight: 700;
      color: #1e3a5f;
      letter-spacing: 0.04em;
      line-height: 1.2;
    }
    .header-catchcopy {
      color: #555555;
      font-size: 2.6mm;
      font-weight: 400;
      text-align: right;
      line-height: 2.0;
      letter-spacing: 0.04em;
    }

    /* ── ヒーロー：大キャッチコピー帯（~72mm） ── */
    .np-hero {
      flex-shrink: 0;
      padding: 10mm 8mm 9mm;
      background: #f7f9fb;
      border-bottom: 1px solid #e0e4e8;
    }
    .np-catchcopy-wrap {
      border-left: 4px solid #2468a8;
      padding-left: 5.5mm;
      margin-bottom: 5.5mm;
    }
    .np-catchcopy {
      font-size: 9mm;
      font-weight: 700;
      color: #1e3a5f;
      letter-spacing: 0.02em;
      line-height: 1.55;
    }
    .np-catchcopy-sub {
      font-size: 3.2mm;
      color: #2468a8;
      font-weight: 600;
      letter-spacing: 0.08em;
      margin-top: 3mm;
    }
    .np-intro {
      font-size: 3.1mm;
      line-height: 2.05;
      color: #222222;
    }

    /* ── 強み 3列（紙面の主役・~54mm） ── */
    .np-strengths {
      flex-shrink: 0;
      padding: 6mm 8mm;
      display: flex;
      gap: 3mm;
      border-bottom: 1px solid #e0e4e8;
    }
    .np-strength-card {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e0e6ed;
      border-top: 3px solid #1e3a5f;
      border-radius: 1.5mm;
      padding: 6.5mm 5mm 5.5mm;
    }
    .np-strength-num {
      font-size: 4mm;
      font-weight: 700;
      color: #b0c4d8;
      margin-bottom: 2.5mm;
      letter-spacing: 0.05em;
    }
    .np-strength-title {
      font-size: 3.6mm;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 2.5mm;
      line-height: 1.4;
    }
    .np-strength-body {
      font-size: 2.9mm;
      line-height: 1.85;
      color: #555555;
    }

    /* ── 代表あいさつ（薄背景＋左罫・~50mm） ── */
    .np-greeting {
      flex-shrink: 0;
      padding: 5.5mm 8mm;
      background: #eef3f8;
      border-bottom: 1px solid #e0e4e8;
      display: flex;
      flex-direction: column;
    }
    .np-greeting-label-row {
      display: flex;
      align-items: center;
      gap: 2.5mm;
      margin-bottom: 3.5mm;
      padding-bottom: 2.5mm;
      border-bottom: 1px solid #c8d8e8;
    }
    .np-greeting-bar {
      width: 3px;
      height: 5mm;
      background: #2468a8;
      border-radius: 1px;
      flex-shrink: 0;
    }
    .np-greeting-label {
      font-size: 2.8mm;
      font-weight: 700;
      color: #1e3a5f;
      letter-spacing: 0.12em;
    }
    .np-greeting-text {
      font-size: 3mm;
      line-height: 2.05;
      color: #222222;
    }
    .np-greeting-name {
      text-align: right;
      margin-top: 3.5mm;
    }
    .np-greeting-role {
      font-size: 2.7mm;
      color: #555555;
      margin-right: 1mm;
    }
    .np-greeting-person {
      font-size: 4mm;
      font-weight: 700;
      color: #1e3a5f;
    }

    /* ── 情報エリア（3列・上詰め・flex: 1） ── */
    .np-info {
      flex: 1;
      padding: 3mm 8mm;
      display: flex;
      gap: 4mm;
      align-items: flex-start;
      min-height: 0;
    }
    .np-col { flex: 1; display: flex; flex-direction: column; }
    .np-col-right { width: 38mm; flex-shrink: 0; display: flex; flex-direction: column; gap: 3mm; }
    .np-divider { width: 1px; background: #e0e4e8; flex-shrink: 0; align-self: stretch; }

    /* 列内セクションタイトル */
    .np-col-title {
      font-size: 2.8mm;
      font-weight: 700;
      color: #1e3a5f;
      padding-bottom: 1.5mm;
      border-bottom: 1.5px solid #1e3a5f;
      margin-bottom: 2.5mm;
    }

    /* サービスタグ */
    .np-tags { display: flex; flex-wrap: wrap; gap: 1mm; }
    .np-tag {
      font-size: 2.6mm;
      padding: 1mm 2.5mm;
      border: 1px solid #dde3e9;
      border-radius: 1mm;
      color: #222222;
      background: #fff;
    }

    /* 主な対応先 */
    .np-targets { margin-top: 3mm; }
    .np-target-item {
      font-size: 2.7mm;
      padding: 0.9mm 0;
      color: #222222;
      display: flex;
      align-items: center;
      gap: 1.5mm;
      border-bottom: 1px solid #f2f2f2;
    }
    .np-arrow { color: #2468a8; font-size: 2.2mm; }

    /* 対応エリア */
    .np-area-text { font-size: 2.8mm; line-height: 1.85; color: #222222; }

    /* 会社概要 */
    .np-overview-row {
      display: flex;
      gap: 2mm;
      font-size: 2.6mm;
      padding: 1.2mm 0;
      border-bottom: 1px solid #f2f2f2;
      color: #222222;
    }
    .np-overview-last { border-bottom: none; }
    .np-overview-label { color: #555555; flex-shrink: 0; width: 10mm; }
    .np-overview-value {}

    /* QR */
    .np-qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2mm;
    }
    .np-qr-img { width: 60px; height: 60px; }
    .np-qr-caption {
      font-size: 2.2mm;
      color: #555555;
      text-align: center;
      line-height: 1.6;
    }

    /* 連絡先 */
    .np-contact-row { margin-bottom: 2mm; }
    .np-contact-label {
      font-size: 2mm;
      font-weight: 700;
      color: #2468a8;
      letter-spacing: 0.1em;
      margin-right: 1.5mm;
    }
    .np-contact-tel {
      font-size: 3.2mm;
      color: #222222;
      font-weight: 700;
    }
    .np-contact-sub {
      font-size: 2.3mm;
      color: #222222;
    }
  `

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${profile.company_name ?? '会社紹介'}</title>
<style>${css}</style>
</head>
<body>
<div class="page">

  <!-- ヘッダー（白背景） -->
  <header class="header">
    ${headerLeft}
    <div class="header-catchcopy">${headerRight}</div>
  </header>

  <!-- ヒーロー：大キャッチコピー -->
  <div class="np-hero">
    <div class="np-catchcopy-wrap">
      <div class="np-catchcopy">${ai.catchcopy.replace(/[。、]/g, '$&<br>')}</div>
      ${headerRight ? `<div class="np-catchcopy-sub">${headerRight}</div>` : ''}
    </div>
    <p class="np-intro">${ai.intro}</p>
  </div>

  <!-- 強み 3列 -->
  <div class="np-strengths">
    ${strengthCards}
  </div>

  <!-- 代表あいさつ（テキストのみ・写真なし） -->
  <div class="np-greeting">
    ${greetingHtml}
  </div>

  <!-- 情報エリア（3列） -->
  <div class="np-info">

    <!-- 左：対応サービス + 主な対応先 -->
    <div class="np-col">
      ${serviceTags ? `
      <div class="np-col-title">対応サービス</div>
      <div class="np-tags">${serviceTags}</div>` : ''}
      ${targetItems ? `
      <div class="np-targets">
        <div class="np-col-title" style="margin-top:3mm">主な対応先</div>
        ${targetItems}
      </div>` : ''}
    </div>

    <div class="np-divider"></div>

    <!-- 中央：エリア + 会社概要 -->
    <div class="np-col">
      <div class="np-col-title">対応エリア</div>
      <p class="np-area-text">${ai.areaText}</p>
      ${overviewRows ? `
      <div class="np-col-title" style="margin-top:3mm">会社概要</div>
      ${overviewRows}` : ''}
    </div>

    <div class="np-divider"></div>

    <!-- 右：QR + 連絡先（上詰め） -->
    <div class="np-col-right">
      ${qrHtml}
      <div>
        ${contactHtml}
      </div>
    </div>

  </div>

  <!-- フッター -->
  <footer class="footer">
    ${profile.phone       ? `<span class="footer-text">📞 ${profile.phone}</span>`         : ''}
    ${profile.email       ? `<span class="footer-text">✉ ${profile.email}</span>`          : ''}
    ${profile.service_area ? `<span class="footer-text">📍 ${profile.service_area}</span>` : ''}
  </footer>

</div>
</body>
</html>`
}

// ════════════════════════════════════════════════════════════════════
// エントリーポイント — 写真の有無でレイアウトを切り替え
// ════════════════════════════════════════════════════════════════════
export async function buildCompanyHtml(opts: TemplateOptions): Promise<string> {
  const { profile, fileUrls, ai } = opts

  const qrDataUrl = await buildQrDataUrl(profile.company_homepage_address)

  const logoHtml = fileUrls.logo
    ? `<img src="${fileUrls.logo}" alt="ロゴ" class="logo-img" />`
    : `<div class="logo-text">${profile.company_name ?? ''}</div>`

  // 写真（作業写真 or 代表者写真）が 1枚でもあれば「写真ありレイアウト」
  const hasPhoto = !!(fileUrls.work_photo || fileUrls.representative_photo)

  const sharedOpts = { profile, ai, fileUrls, qrDataUrl, logoHtml }

  const html = hasPhoto
    ? buildPhotoLayout(sharedOpts)
    : buildNoPhotoLayoutV2(sharedOpts)

  // <base href> により /fonts/* が https://www.1mai.jp/fonts/* に解決される。
  // CSS @import ではなく <link> を使うことで Puppeteer が確実にフォントを読み込む。
  const fontHead = [
    '<base href="https://www.1mai.jp/">',
    '<link rel="stylesheet" href="/fonts/noto-sans-jp.css">',
  ].join('\n')
  return html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n${fontHead}`)
}
