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

// ── 共通CSS（フォント・リセットのみ。各レイアウトで上書き） ──────────────
const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm;
    height: 297mm;
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
    background: #ffffff;
    color: #222;
    overflow: hidden;
  }
`

// ════════════════════════════════════════════════════════════════════
// 写真ありレイアウト（千葉中央設備デザイン準拠）
// ════════════════════════════════════════════════════════════════════
function buildPhotoLayout(opts: {
  profile: CompanyProfile & Partial<AIGeneratedContent>
  ai: AIGeneratedContent
  fileUrls: Record<string, string>
  qrDataUrl: string
  logoHtml: string
}): string {
  const { profile, ai, fileUrls, qrDataUrl } = opts

  // ── ヒーロー写真（作業写真 > 代表写真 の優先順）
  const heroSrc = fileUrls.work_photo || fileUrls.representative_photo || ''
  // 代表写真は作業写真と両方あるときのみ挨拶欄に表示
  const greetingPhotoSrc = (fileUrls.work_photo && fileUrls.representative_photo)
    ? fileUrls.representative_photo
    : ''

  // ── ヘッダー左（ロゴ + 会社名）
  const headerLeft = fileUrls.logo
    ? `<div class="hd-left">
         <img src="${fileUrls.logo}" class="hd-logo" alt="ロゴ">
         <div class="hd-coname">${profile.company_name ?? ''}</div>
       </div>`
    : `<div class="hd-left">
         <div class="hd-coname hd-coname-only">${profile.company_name ?? ''}</div>
       </div>`

  // ── ヘッダー右（サービス 上2行 × 最大3件）
  const svcs = profile.service_categories ?? []
  const hdLine1 = svcs.slice(0, 2).join('・')
  const hdLine2 = svcs.slice(2, 4).join('・')
  const headerRight = [hdLine1, hdLine2].filter(Boolean).join('<br>')

  // ── 強みカード（01/02/03 + タイトル + 本文）
  const strengthCards = (ai.strengths ?? []).slice(0, 3).map((s, i) => {
    const num = String(i + 1).padStart(2, '0')
    const titleMatch = s.match(/^(.{4,18}?)[。、\s　]/)
    const title = titleMatch ? titleMatch[1] : s
    const body  = titleMatch ? s.slice(titleMatch[0].length) : ''
    return `
    <div class="sc-card">
      <div class="sc-num">${num}</div>
      <div class="sc-title">${title}</div>
      ${body ? `<div class="sc-body">${body}</div>` : ''}
    </div>`
  }).join('')

  // ── 対応サービス chips
  const serviceChips = (profile.service_categories ?? []).slice(0, 8)
    .map(s => `<span class="chip">${s}</span>`).join('')

  // ── 主な対応先リスト
  const targetItems = (profile.target_customers ?? []).slice(0, 5)
    .map(t => `<div class="tgt-item">▸ ${t}</div>`).join('')

  // ── 会社概要テーブル行
  const ovRows: string[] = []
  if (profile.company_name)
    ovRows.push(`<tr><td class="ov-k">社　名</td><td>${profile.company_name}</td></tr>`)
  if (profile.postal_code || profile.address)
    ovRows.push(`<tr><td class="ov-k">所在地</td><td>${profile.postal_code ? `〒${profile.postal_code} ` : ''}${profile.address ?? ''}</td></tr>`)
  if (profile.established_year)
    ovRows.push(`<tr><td class="ov-k">創　業</td><td>${profile.established_year}</td></tr>`)
  if (profile.representative_title || profile.representative_name)
    ovRows.push(`<tr><td class="ov-k">代　表</td><td>${profile.representative_title ?? ''}　${profile.representative_name ?? ''}</td></tr>`)

  const footerSvcs = (profile.service_categories ?? []).slice(0, 4).join('・')

  const css = `
    ${BASE_CSS}

    .page {
      width: 210mm; height: 297mm;
      display: flex; flex-direction: column;
      overflow: hidden; background: #fff;
    }

    /* ── ヘッダー 13mm ─────────────────────────── */
    .pg-header {
      height: 13mm; flex-shrink: 0;
      background: #fff; border-bottom: 2px solid #1e3a5f;
      display: flex; align-items: center;
      justify-content: space-between; padding: 0 6mm;
    }
    .hd-left { display: flex; align-items: center; gap: 2.5mm; }
    .hd-logo { height: 8.5mm; object-fit: contain; }
    .hd-coname { font-size: 18px; font-weight: 700; color: #1e3a5f; line-height: 1.15; }
    .hd-coname-only { font-size: 20px; }
    .hd-right { text-align: right; font-size: 8.5px; color: #555; line-height: 1.9; }

    /* ── ヒーロー写真 56mm ─────────────────────── */
    .hero { height: 56mm; overflow: hidden; flex-shrink: 0; }
    .hero-img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }

    /* ── キャッチコピー＋紹介文 31mm ────────────── */
    .catch-sect {
      height: 31mm; flex-shrink: 0; overflow: hidden;
      padding: 4mm 6mm 3mm;
      display: flex; flex-direction: column; justify-content: center;
    }
    .catchcopy {
      font-size: 17px; font-weight: 700; color: #1e3a5f; line-height: 1.45;
      border-left: 3.5px solid #1e3a5f; padding-left: 3.5mm;
      margin-bottom: 2.5mm;
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .intro-text {
      font-size: 9px; color: #333; line-height: 1.7; padding-left: 0.5mm;
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3;
      overflow: hidden;
    }

    /* ── 強み3点 44mm ───────────────────────────── */
    .str-sect {
      height: 44mm; flex-shrink: 0;
      background: #f3f5f8; padding: 4mm 5.5mm;
    }
    .sc-cards { display: flex; gap: 3mm; height: 100%; }
    .sc-card {
      flex: 1; background: #fff; border-radius: 1.5mm;
      border-top: 2.5px solid #1e3a5f;
      padding: 3mm 3mm; overflow: hidden;
    }
    .sc-num {
      font-size: 20px; font-weight: 700; color: #1e3a5f; opacity: 0.25;
      line-height: 1; margin-bottom: 1.5mm;
    }
    .sc-title { font-size: 9px; font-weight: 700; color: #1e3a5f; line-height: 1.4; margin-bottom: 1.5mm; }
    .sc-body  { font-size: 8px; color: #555; line-height: 1.5; }

    /* ── 代表ごあいさつ 33mm ────────────────────── */
    .greet-sect {
      height: 33mm; flex-shrink: 0; overflow: hidden;
      border-top: 1px solid #e4e8ef;
      padding: 3mm 6mm;
      display: flex; align-items: flex-start; gap: 4mm;
    }
    .rep-photo {
      width: 21mm; height: 21mm; flex-shrink: 0;
      border-radius: 1.5mm; object-fit: cover; object-position: top;
    }
    .greet-body { flex: 1; overflow: hidden; }
    .greet-label {
      font-size: 8px; font-weight: 700; color: #1e3a5f;
      border-left: 2px solid #1e3a5f; padding-left: 2mm;
      margin-bottom: 1.5mm;
    }
    .greet-text {
      font-size: 8px; color: #444; line-height: 1.65; margin-bottom: 2mm;
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4;
      overflow: hidden;
    }
    .rep-name-row { text-align: right; }
    .rep-ttl  { font-size: 7.5px; color: #888; margin-right: 1.5mm; }
    .rep-name { font-size: 12px; font-weight: 700; color: #1e3a5f; }

    /* ── 下部情報 flex:1 ────────────────────────── */
    .info-sect {
      flex: 1; display: flex;
      border-top: 1px solid #e4e8ef;
      min-height: 0; overflow: hidden;
    }
    .ic { padding: 3mm 4mm; overflow: hidden; }
    .ic-left   { width: 36%; border-right: 1px solid #e4e8ef; }
    .ic-center { width: 36%; border-right: 1px solid #e4e8ef; }
    .ic-right  { flex: 1; display: flex; flex-direction: column; }

    .ih {
      font-size: 7px; font-weight: 700; color: #1e3a5f;
      border-left: 2px solid #1e3a5f; padding-left: 2mm;
      margin-bottom: 2mm;
    }
    .i-sub { margin-top: 3mm; }

    /* チップ */
    .chip-grp { display: flex; flex-wrap: wrap; gap: 1.5mm; }
    .chip { background: #e8edf5; color: #1e3a5f; font-size: 7px; padding: 1mm 2mm; border-radius: 1mm; }

    /* 対応先リスト */
    .tgt-item { font-size: 7.5px; color: #444; padding: 0.7mm 0; line-height: 1.3; }

    /* 会社概要 */
    .ov-table { width: 100%; border-collapse: collapse; }
    .ov-table td { font-size: 7.5px; color: #333; padding: 0.8mm 0; vertical-align: top; line-height: 1.4; }
    .ov-k { color: #888; font-size: 7px; width: 13mm; white-space: nowrap; }

    /* エリアテキスト */
    .area-text { font-size: 8px; color: #333; line-height: 1.6; }

    /* 右カラム: QR + 連絡先 */
    .qr-blk { text-align: center; margin-bottom: 2.5mm; }
    .qr-img { width: 18mm; height: 18mm; }
    .qr-cap { font-size: 6px; color: #999; margin-top: 1mm; }
    .ct-line { font-size: 7.5px; color: #333; margin-bottom: 2mm; line-height: 1.3; }
    .ct-key  { font-size: 6.5px; font-weight: 700; color: #1e3a5f; margin-right: 1.5mm; }
    .tel-big { font-size: 13px; font-weight: 700; color: #1e3a5f; display: block; }

    /* ── フッター 7mm ───────────────────────────── */
    .pg-footer {
      height: 7mm; flex-shrink: 0; background: #1e3a5f;
      display: flex; align-items: center;
      justify-content: space-between; padding: 0 6mm;
    }
    .ft-name  { font-size: 8.5px; color: #fff; font-weight: 700; }
    .ft-right { font-size: 7px; color: rgba(255,255,255,0.75); }
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

  <!-- ヘッダー -->
  <header class="pg-header">
    ${headerLeft}
    <div class="hd-right">${headerRight}</div>
  </header>

  <!-- ヒーロー写真 -->
  <div class="hero">
    <img src="${heroSrc}" class="hero-img" alt="作業風景">
  </div>

  <!-- キャッチコピー + 紹介文 -->
  <section class="catch-sect">
    <h2 class="catchcopy">${ai.catchcopy ?? ''}</h2>
    <p class="intro-text">${ai.intro ?? ''}</p>
  </section>

  <!-- 強み3点 -->
  <section class="str-sect">
    <div class="sc-cards">${strengthCards}</div>
  </section>

  <!-- 代表ごあいさつ -->
  <section class="greet-sect">
    ${greetingPhotoSrc ? `<img src="${greetingPhotoSrc}" class="rep-photo" alt="代表者">` : ''}
    <div class="greet-body">
      <div class="greet-label">代表ごあいさつ</div>
      <p class="greet-text">${ai.greeting ?? ''}</p>
      <div class="rep-name-row">
        ${profile.representative_title ? `<span class="rep-ttl">${profile.representative_title}</span>` : ''}
        ${profile.representative_name  ? `<span class="rep-name">${profile.representative_name}</span>`  : ''}
      </div>
    </div>
  </section>

  <!-- 下部情報（3カラム） -->
  <section class="info-sect">

    <!-- 左: サービス + 対応先 -->
    <div class="ic ic-left">
      <div class="ih">対応サービス</div>
      <div class="chip-grp">${serviceChips}</div>
      ${targetItems ? `<div class="i-sub"><div class="ih">主な対応先</div>${targetItems}</div>` : ''}
    </div>

    <!-- 中: エリア + 会社概要 -->
    <div class="ic ic-center">
      <div class="ih">対応エリア</div>
      <p class="area-text">${ai.areaText ?? ''}</p>
      <div class="i-sub">
        <div class="ih">会社概要</div>
        <table class="ov-table"><tbody>${ovRows.join('')}</tbody></table>
      </div>
    </div>

    <!-- 右: QR + 連絡先 -->
    <div class="ic ic-right">
      ${qrDataUrl ? `<div class="qr-blk">
        <img src="${qrDataUrl}" class="qr-img" alt="QR">
        <div class="qr-cap">詳しい対応内容・施工事例はこちら</div>
      </div>` : ''}
      ${profile.phone ? `<div class="ct-line"><span class="ct-key">TEL</span><span class="tel-big">${profile.phone}</span></div>` : ''}
      ${profile.email ? `<div class="ct-line"><span class="ct-key">MAIL</span>${profile.email}</div>` : ''}
      ${profile.company_homepage_address ? `<div class="ct-line"><span class="ct-key">WEB</span>${profile.company_homepage_address.replace(/^https?:\/\//, '')}</div>` : ''}
    </div>

  </section>

  <!-- フッター -->
  <footer class="pg-footer">
    <div class="ft-name">${profile.company_name ?? ''}</div>
    <div class="ft-right">${footerSvcs}</div>
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
// 写真なし専用レイアウト（旧版・参照用・未使用）
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
    .page {
      width: 210mm; height: 297mm;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .header {
      background: #1e3a5f; height: 64px; flex-shrink: 0;
      display: flex; flex-direction: column;
      align-items: flex-start; justify-content: center;
      gap: 4px; padding: 0 24px;
    }
    .logo-img  { height: 36px; object-fit: contain; }
    .logo-text { color: #fff; font-size: 24px; font-weight: 700; }
    .header-catchcopy { font-size: 10px; color: rgba(255,255,255,0.80); }
    .footer {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 24px; background: #1e3a5f;
      display: flex; align-items: center; justify-content: center; gap: 28px;
    }
    .footer-text { font-size: 8px; color: rgba(255,255,255,0.82); }
    .section-title {
      font-size: 8.5px; font-weight: 700; color: #1e3a5f;
      letter-spacing: 0.12em; text-transform: uppercase;
      border-left: 3px solid #1e3a5f; padding-left: 6px; margin-bottom: 7px;
    }
    .np-content { flex: 1; display: flex; flex-direction: column; padding: 16px 24px 28px; gap: 13px; min-height: 0; }
    .np-intro { background: #f8fafc; border-left: 4px solid #1e3a5f; border-radius: 0 5px 5px 0; padding: 14px 18px; flex-shrink: 0; }
    .np-intro-label { font-size: 7.5px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.13em; text-transform: uppercase; margin-bottom: 7px; }
    .np-intro-text { font-size: 13px; line-height: 2.0; color: #2d3748; }
    .np-cards-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; flex-shrink: 0; }
    .np-card { background: #f5f7fa; border-radius: 5px; padding: 12px 13px; border-top: 3px solid #1e3a5f; }
    .np-card-building { border-top-color: #4a7fb5; }
    .np-card-area     { border-top-color: #276749; }
    .np-card-title { font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #1e3a5f; margin-bottom: 8px; }
    .np-card-building .np-card-title { color: #4a7fb5; }
    .np-card-area     .np-card-title { color: #276749; }
    .np-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
    .np-list-item { font-size: 11px; color: #333; line-height: 1.6; padding-left: 12px; position: relative; }
    .np-list-item::before { content: ''; position: absolute; left: 0; top: 7px; width: 4px; height: 4px; border-radius: 50%; background: #1e3a5f; opacity: 0.5; }
    .np-card-area .np-area-text { font-size: 11px; line-height: 1.85; color: #333; }
    .np-strengths-box { background: #f5f7fa; border-radius: 5px; padding: 13px 18px 14px; flex-shrink: 0; }
    .np-strengths-label { font-size: 8px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.12em; text-transform: uppercase; border-left: 3px solid #1e3a5f; padding-left: 6px; margin-bottom: 10px; }
    .np-strength-list { display: flex; flex-direction: column; gap: 8px; }
    .np-strength-row { display: flex; gap: 12px; align-items: flex-start; padding: 6px 0; border-bottom: 1px solid #e0e6ef; }
    .np-strength-row:last-child { border-bottom: none; padding-bottom: 0; }
    .np-strength-num { width: 24px; height: 24px; flex-shrink: 0; background: #1e3a5f; color: #fff; border-radius: 50%; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .np-strength-text { font-size: 12px; line-height: 1.8; color: #2d3748; }
    .np-bottom { display: grid; grid-template-columns: 1fr 185px; gap: 12px; flex: 1; min-height: 0; }
    .np-left { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
    .np-greeting-section { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .np-greeting { flex: 1; border: 1px solid #d8e2f0; border-radius: 5px; padding: 16px 20px; min-height: 90px; background: #f9fbfd; }
    .np-greeting-name { font-size: 11px; color: #333; margin-bottom: 10px; font-weight: 700; }
    .np-greeting-text { font-size: 11px; line-height: 2.1; color: #333; }
    .np-consult { flex-shrink: 0; }
    .np-consult-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
    .np-consult-item { font-size: 11px; color: #333; line-height: 1.6; padding-left: 14px; position: relative; }
    .np-consult-item::before { content: '・'; position: absolute; left: 0; color: #4a7fb5; font-size: 12px; top: -1px; }
    .np-trouble { flex-shrink: 0; border: 1px solid #c4d4e8; border-radius: 5px; background: #eef3f9; padding: 12px 16px 12px; }
    .np-trouble-title { font-size: 11px; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; line-height: 1.4; }
    .np-trouble-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .np-trouble-item { font-size: 11px; color: #2d3748; line-height: 1.6; padding-left: 14px; position: relative; }
    .np-trouble-item::before { content: '・'; position: absolute; left: 0; color: #4a7fb5; font-size: 12px; top: -1px; }
    .np-trouble-footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #b8ccdf; }
    .np-trouble-footer-lead { font-size: 9px; color: #5a7090; margin-bottom: 4px; }
    .np-trouble-phone { font-size: 12px; font-weight: 700; color: #1e3a5f; }
    .np-trouble-email { font-size: 10px; color: #4a6080; margin-top: 2px; }
    .np-right { display: flex; flex-direction: column; gap: 10px; justify-content: space-between; }
    .np-company-box { background: #f5f7fa; border-radius: 5px; padding: 12px 13px; }
    .np-contact-row { display: flex; flex-direction: column; padding: 6px 0; border-bottom: 1px solid #e8ecf0; }
    .np-contact-row:last-child { border-bottom: none; }
    .np-contact-label { font-size: 7.5px; color: #aaa; margin-bottom: 2px; }
    .np-contact-value { font-size: 11px; font-weight: 600; color: #1e3a5f; }
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
  <header class="header">
    ${logoHtmlFinal}
    <div class="header-catchcopy">${ai.catchcopy}</div>
  </header>
  <div class="np-content">
    <div class="np-intro">
      <div class="np-intro-label">会社紹介</div>
      <p class="np-intro-text">${ai.intro}</p>
    </div>
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
        : `<div class="np-card">
             <div class="np-card-title">主な営業先</div>
             <ul class="np-list">${targetItems || '<li class="np-list-item">—</li>'}</ul>
           </div>`}
      <div class="np-card np-card-area">
        <div class="np-card-title">対応エリア</div>
        <p class="np-area-text">${ai.areaText}</p>
      </div>
    </div>
    <div class="np-strengths-box">
      <div class="np-strengths-label">私たちの強み</div>
      <div class="np-strength-list">${strengthRows}</div>
    </div>
    <div class="np-bottom">
      <div class="np-left">
        <div class="np-greeting-section">
          <div class="section-title">ごあいさつ</div>
          <div class="np-greeting">
            ${profile.representative_name
              ? `<div class="np-greeting-name">${profile.representative_title ?? ''} ${profile.representative_name}</div>`
              : ''}
            <p class="np-greeting-text">${ai.greeting}</p>
          </div>
        </div>
        ${consultItems ? `
        <div class="np-consult">
          <div class="section-title">よくあるご相談</div>
          <ul class="np-consult-list">${consultItems}</ul>
        </div>` : ''}
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
            <div class="np-qr-img-wrap"><img src="${qrDataUrl}" alt="QRコード" /></div>
            <div class="np-qr-action">会社ホームページを見る</div>
            <div class="np-qr-url">${profile.company_homepage_address}</div>
          </div>
        </div>` : ''}
      </div>
    </div>
  </div>
  <footer class="footer">
    ${profile.phone      ? `<span class="footer-text">📞 ${profile.phone}</span>`           : ''}
    ${profile.email      ? `<span class="footer-text">✉ ${profile.email}</span>`            : ''}
    ${profile.service_area ? `<span class="footer-text">📍 ${profile.service_area}</span>` : ''}
  </footer>
</div>
</body>
</html>`
}

// ════════════════════════════════════════════════════════════════════
// 写真なし専用レイアウト V2（千葉中央設備スタイル・写真なし対応版）
// ════════════════════════════════════════════════════════════════════
function buildNoPhotoLayoutV2(opts: {
  profile: CompanyProfile & Partial<AIGeneratedContent>
  ai: AIGeneratedContent
  fileUrls: Record<string, string>
  qrDataUrl: string
  logoHtml: string
}): string {
  const { profile, ai, fileUrls, qrDataUrl } = opts

  // ── ヘッダー左
  const headerLeft = fileUrls.logo
    ? `<div class="hd-left">
         <img src="${fileUrls.logo}" class="hd-logo" alt="ロゴ">
         <div class="hd-coname">${profile.company_name ?? ''}</div>
       </div>`
    : `<div class="hd-left">
         <div class="hd-coname hd-coname-only">${profile.company_name ?? ''}</div>
       </div>`

  const svcs = profile.service_categories ?? []
  const hdLine1 = svcs.slice(0, 2).join('・')
  const hdLine2 = svcs.slice(2, 4).join('・')
  const headerRight = [hdLine1, hdLine2].filter(Boolean).join('<br>')

  // ── 強みカード
  const strengthCards = (ai.strengths ?? []).slice(0, 3).map((s, i) => {
    const num = String(i + 1).padStart(2, '0')
    const titleMatch = s.match(/^(.{4,18}?)[。、\s　]/)
    const title = titleMatch ? titleMatch[1] : s
    const body  = titleMatch ? s.slice(titleMatch[0].length) : ''
    return `
    <div class="sc-card">
      <div class="sc-num">${num}</div>
      <div class="sc-title">${title}</div>
      ${body ? `<div class="sc-body">${body}</div>` : ''}
    </div>`
  }).join('')

  // ── 対応サービス chips
  const serviceChips = (profile.service_categories ?? []).slice(0, 8)
    .map(s => `<span class="chip">${s}</span>`).join('')

  // ── 対応先リスト
  const targetItems = (profile.target_customers ?? []).slice(0, 5)
    .map(t => `<div class="tgt-item">▸ ${t}</div>`).join('')

  // ── 会社概要
  const ovRows: string[] = []
  if (profile.company_name)
    ovRows.push(`<tr><td class="ov-k">社　名</td><td>${profile.company_name}</td></tr>`)
  if (profile.postal_code || profile.address)
    ovRows.push(`<tr><td class="ov-k">所在地</td><td>${profile.postal_code ? `〒${profile.postal_code} ` : ''}${profile.address ?? ''}</td></tr>`)
  if (profile.established_year)
    ovRows.push(`<tr><td class="ov-k">創　業</td><td>${profile.established_year}</td></tr>`)
  if (profile.representative_title || profile.representative_name)
    ovRows.push(`<tr><td class="ov-k">代　表</td><td>${profile.representative_title ?? ''}　${profile.representative_name ?? ''}</td></tr>`)

  const footerSvcs = (profile.service_categories ?? []).slice(0, 4).join('・')

  const css = `
    ${BASE_CSS}

    .page {
      width: 210mm; height: 297mm;
      display: flex; flex-direction: column;
      overflow: hidden; background: #fff;
    }

    /* ── ヘッダー 13mm ─────────────────────────── */
    .pg-header {
      height: 13mm; flex-shrink: 0;
      background: #fff; border-bottom: 2px solid #1e3a5f;
      display: flex; align-items: center;
      justify-content: space-between; padding: 0 6mm;
    }
    .hd-left { display: flex; align-items: center; gap: 2.5mm; }
    .hd-logo { height: 8.5mm; object-fit: contain; }
    .hd-coname { font-size: 18px; font-weight: 700; color: #1e3a5f; line-height: 1.15; }
    .hd-coname-only { font-size: 20px; }
    .hd-right { text-align: right; font-size: 8.5px; color: #555; line-height: 1.9; }

    /* ── キャッチコピーバナー（写真なしなので大きめ） 50mm ── */
    .catch-banner {
      height: 50mm; flex-shrink: 0; overflow: hidden;
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5080 100%);
      display: flex; flex-direction: column;
      justify-content: center; padding: 6mm 8mm;
    }
    .catchcopy-wh {
      font-size: 20px; font-weight: 700; color: #fff; line-height: 1.45;
      border-left: 4px solid rgba(255,255,255,0.7); padding-left: 4mm;
      margin-bottom: 3mm;
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .intro-wh {
      font-size: 9.5px; color: rgba(255,255,255,0.85); line-height: 1.7;
      padding-left: 0.5mm;
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3;
      overflow: hidden;
    }

    /* ── 強み3点 44mm ───────────────────────────── */
    .str-sect {
      height: 44mm; flex-shrink: 0;
      background: #f3f5f8; padding: 4mm 5.5mm;
    }
    .sc-cards { display: flex; gap: 3mm; height: 100%; }
    .sc-card {
      flex: 1; background: #fff; border-radius: 1.5mm;
      border-top: 2.5px solid #1e3a5f;
      padding: 3mm 3mm; overflow: hidden;
    }
    .sc-num { font-size: 20px; font-weight: 700; color: #1e3a5f; opacity: 0.25; line-height: 1; margin-bottom: 1.5mm; }
    .sc-title { font-size: 9px; font-weight: 700; color: #1e3a5f; line-height: 1.4; margin-bottom: 1.5mm; }
    .sc-body  { font-size: 8px; color: #555; line-height: 1.5; }

    /* ── 代表ごあいさつ 33mm ────────────────────── */
    .greet-sect {
      height: 33mm; flex-shrink: 0; overflow: hidden;
      border-top: 1px solid #e4e8ef;
      padding: 3mm 6mm;
      display: flex; align-items: flex-start; gap: 4mm;
    }
    .greet-body { flex: 1; overflow: hidden; }
    .greet-label { font-size: 8px; font-weight: 700; color: #1e3a5f; border-left: 2px solid #1e3a5f; padding-left: 2mm; margin-bottom: 1.5mm; }
    .greet-text { font-size: 8px; color: #444; line-height: 1.65; margin-bottom: 2mm; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; }
    .rep-name-row { text-align: right; }
    .rep-ttl  { font-size: 7.5px; color: #888; margin-right: 1.5mm; }
    .rep-name { font-size: 12px; font-weight: 700; color: #1e3a5f; }

    /* ── 下部情報 flex:1 ────────────────────────── */
    .info-sect { flex: 1; display: flex; border-top: 1px solid #e4e8ef; min-height: 0; overflow: hidden; }
    .ic { padding: 3mm 4mm; overflow: hidden; }
    .ic-left   { width: 36%; border-right: 1px solid #e4e8ef; }
    .ic-center { width: 36%; border-right: 1px solid #e4e8ef; }
    .ic-right  { flex: 1; display: flex; flex-direction: column; }
    .ih { font-size: 7px; font-weight: 700; color: #1e3a5f; border-left: 2px solid #1e3a5f; padding-left: 2mm; margin-bottom: 2mm; }
    .i-sub { margin-top: 3mm; }
    .chip-grp { display: flex; flex-wrap: wrap; gap: 1.5mm; }
    .chip { background: #e8edf5; color: #1e3a5f; font-size: 7px; padding: 1mm 2mm; border-radius: 1mm; }
    .tgt-item { font-size: 7.5px; color: #444; padding: 0.7mm 0; line-height: 1.3; }
    .ov-table { width: 100%; border-collapse: collapse; }
    .ov-table td { font-size: 7.5px; color: #333; padding: 0.8mm 0; vertical-align: top; line-height: 1.4; }
    .ov-k { color: #888; font-size: 7px; width: 13mm; white-space: nowrap; }
    .area-text { font-size: 8px; color: #333; line-height: 1.6; }
    .qr-blk { text-align: center; margin-bottom: 2.5mm; }
    .qr-img { width: 18mm; height: 18mm; }
    .qr-cap { font-size: 6px; color: #999; margin-top: 1mm; }
    .ct-line { font-size: 7.5px; color: #333; margin-bottom: 2mm; line-height: 1.3; }
    .ct-key  { font-size: 6.5px; font-weight: 700; color: #1e3a5f; margin-right: 1.5mm; }
    .tel-big { font-size: 13px; font-weight: 700; color: #1e3a5f; display: block; }

    /* ── フッター 7mm ───────────────────────────── */
    .pg-footer {
      height: 7mm; flex-shrink: 0; background: #1e3a5f;
      display: flex; align-items: center;
      justify-content: space-between; padding: 0 6mm;
    }
    .ft-name  { font-size: 8.5px; color: #fff; font-weight: 700; }
    .ft-right { font-size: 7px; color: rgba(255,255,255,0.75); }
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

  <!-- ヘッダー -->
  <header class="pg-header">
    ${headerLeft}
    <div class="hd-right">${headerRight}</div>
  </header>

  <!-- キャッチコピーバナー（写真なし） -->
  <section class="catch-banner">
    <h2 class="catchcopy-wh">${ai.catchcopy ?? ''}</h2>
    <p class="intro-wh">${ai.intro ?? ''}</p>
  </section>

  <!-- 強み3点 -->
  <section class="str-sect">
    <div class="sc-cards">${strengthCards}</div>
  </section>

  <!-- 代表ごあいさつ -->
  <section class="greet-sect">
    <div class="greet-body">
      <div class="greet-label">代表ごあいさつ</div>
      <p class="greet-text">${ai.greeting ?? ''}</p>
      <div class="rep-name-row">
        ${profile.representative_title ? `<span class="rep-ttl">${profile.representative_title}</span>` : ''}
        ${profile.representative_name  ? `<span class="rep-name">${profile.representative_name}</span>`  : ''}
      </div>
    </div>
  </section>

  <!-- 下部情報（3カラム） -->
  <section class="info-sect">
    <div class="ic ic-left">
      <div class="ih">対応サービス</div>
      <div class="chip-grp">${serviceChips}</div>
      ${targetItems ? `<div class="i-sub"><div class="ih">主な対応先</div>${targetItems}</div>` : ''}
    </div>
    <div class="ic ic-center">
      <div class="ih">対応エリア</div>
      <p class="area-text">${ai.areaText ?? ''}</p>
      <div class="i-sub">
        <div class="ih">会社概要</div>
        <table class="ov-table"><tbody>${ovRows.join('')}</tbody></table>
      </div>
    </div>
    <div class="ic ic-right">
      ${qrDataUrl ? `<div class="qr-blk">
        <img src="${qrDataUrl}" class="qr-img" alt="QR">
        <div class="qr-cap">詳しい対応内容・施工事例はこちら</div>
      </div>` : ''}
      ${profile.phone ? `<div class="ct-line"><span class="ct-key">TEL</span><span class="tel-big">${profile.phone}</span></div>` : ''}
      ${profile.email ? `<div class="ct-line"><span class="ct-key">MAIL</span>${profile.email}</div>` : ''}
      ${profile.company_homepage_address ? `<div class="ct-line"><span class="ct-key">WEB</span>${profile.company_homepage_address.replace(/^https?:\/\//, '')}</div>` : ''}
    </div>
  </section>

  <!-- フッター -->
  <footer class="pg-footer">
    <div class="ft-name">${profile.company_name ?? ''}</div>
    <div class="ft-right">${footerSvcs}</div>
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
