# 1枚会社紹介メーカー 運用ドキュメント

## Stripe Webhook

### 送信先 URL
```
https://www.1mai.jp/api/stripe/webhook
```

> ⚠️ `https://1mai.jp/` (apex) ではなく `https://www.1mai.jp/` (www) を使うこと。
> Vercel は apex → www へ 307 リダイレクトするため、Stripe は Webhook を失敗扱いにする。

### Webhook Secret の設定箇所
Vercel ダッシュボード → Project Settings → Environment Variables

| 変数名 | 説明 |
|--------|------|
| `STRIPE_WEBHOOK_SECRET` | Stripe ダッシュボード → Webhooks → エンドポイント → 署名シークレット |
| `STRIPE_SECRET_KEY` | Stripe API キー (sk_live_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー (pk_live_...) |

### 対象イベント
- `checkout.session.completed` のみ購読

---

## Supabase

### 接続情報の設定箇所
Vercel ダッシュボード → Environment Variables

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` (origin のみ、パスなし) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role キー（サーバーサイドのみ）|

### Free プラン停止時の復旧手順

Supabase Free は **7 日間 API アクセスがないとプロジェクトを停止** する。

停止サイン:
- Vercel ログに `SUPABASE UNREACHABLE` が出る
- `TypeError: fetch failed` が webhook エラーに含まれる

復旧手順:
1. [Supabase ダッシュボード](https://supabase.com/dashboard/projects) にログイン
2. 停止中プロジェクトの「Restore」ボタンをクリック（数分で復旧）
3. 復旧後、Stripe ダッシュボードで失敗した Webhook イベントを再送

> 停止を防ぐには Supabase Pro プランへアップグレード推奨。

### 失敗決済の手動復旧
Stripe Webhook が失敗した決済を手動で処理する管理者 API:

```bash
curl -X POST https://www.1mai.jp/api/admin/recover-session \
  -H "x-admin-secret: <ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "cs_live_xxxxx"}'
```

`ADMIN_SECRET` は Vercel 環境変数 `ADMIN_SECRET` を参照。

---

## メール送信（Resend）

### 設定
| 変数名 | 説明 |
|--------|------|
| `RESEND_API_KEY` | [Resend ダッシュボード](https://resend.com/api-keys) で発行 |
| `MAIL_FROM` | 送信元アドレス（例: `1枚会社紹介メーカー <no-reply@1mai.jp>`）|

### メールが届かない場合の対応フロー

1. Vercel ログで `[webhook] start mail sent to` を確認
   - あれば Resend 側で届いているか確認
   - なければ `[webhook] start mail failed:` のエラー内容を確認
2. Resend ダッシュボード → Logs で送信状況を確認
3. ユーザーが決済完了ページから再送できる
   - `https://www.1mai.jp/checkout/success?session_id=cs_live_xxx` にアクセス
   - 「メールが届かない場合」リンクから再送フォームを使用

---

## 本番テスト手順

### 1. Stripe Webhook 疎通確認
```bash
# Webhook URL が www.1mai.jp になっているか確認
# Stripe ダッシュボード → Webhooks → エンドポイント詳細
```

### 2. エンドツーエンド決済テスト
1. `https://www.1mai.jp/` でサービスを開く
2. Stripe テストモード（または本番カード）で決済
3. `https://www.1mai.jp/checkout/success?session_id=cs_live_xxx` を確認
4. メールが届くことを確認
5. メールのリンクから作成フローを開始できることを確認

### 3. Webhook 冪等性テスト
1. Stripe ダッシュボードで同じイベントを複数回再送
2. Vercel ログで `order already exists, reusing:` が出ることを確認
3. DB に重複レコードがないことを確認

### 4. ローカル開発での Webhook テスト
```bash
# Stripe CLI でローカル転送
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 主要 API エンドポイント

| エンドポイント | 用途 |
|----------------|------|
| `POST /api/stripe/webhook` | Stripe Webhook 受信（署名検証付き）|
| `GET /api/checkout/session-link` | session_id からトークン取得 |
| `POST /api/checkout/resend-link` | 作成リンクメール再送 |
| `POST /api/admin/recover-session` | 失敗決済の手動復旧（要 x-admin-secret）|

---

## Vercel ログの見方

| ログメッセージ | 意味 |
|----------------|------|
| `[webhook] checkout.session.completed` | Webhook 受信・処理開始 |
| `[webhook] order created: <uuid>` | 正常: orders レコード作成済み |
| `[webhook] order already exists, reusing:` | 冪等: 重複処理をスキップ |
| `[webhook] processing complete { ..., resumeUrl }` | 全レコード作成完了、resumeUrl 確認可能 |
| `[webhook] start mail sent to <email>` | メール送信成功 |
| `[webhook] start mail failed:` | メール送信失敗（Webhook は成功扱い）|
| `[webhook] SUPABASE UNREACHABLE` | Supabase 接続不可 → ダッシュボードで確認 |
| `[webhook] orders insert error: { code: "23505" }` | UNIQUE 制約違反（通常は冪等処理で防止）|
