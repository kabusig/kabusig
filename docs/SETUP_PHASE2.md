# フェーズ2 公開セットアップ手順

コードは実装済み。以下の外部サービス設定を上から順に行うと公開できる。
**各サービスのキーを `.env`(ローカル)/ Vercel / GitHub Secrets に設定するだけで、
コードの変更は不要。**

> Supabase 未設定のままなら、アプリは従来どおり「開発モード」
> (ログイン不要・全機能閲覧・SQLite)で動く。

---

## 1. Supabase(DB + 認証)

1. https://supabase.com でプロジェクト作成(リージョン: Tokyo)
2. SQL Editor で以下を順に実行:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_views_auth.sql`
3. Authentication → Providers → Email を有効化(Magic Link)
4. Authentication → URL Configuration:
   - Site URL: `https://<あなたのドメイン>`
   - Redirect URLs: `https://<ドメイン>/auth/callback`(ローカル検証するなら `http://localhost:3000/auth/callback` も)
5. Settings → API から取得:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`(**秘密。サーバー専用**)

### 初回データ投入(ローカルから)

```powershell
# .env に上記3つを設定してから
cd batch
..\.venv\Scripts\python push_supabase.py --full   # 全量同期(初回のみ、数分)
```

## 2. Stripe(決済)

1. https://stripe.com でアカウント作成(まずテストモードでOK)
2. 商品カタログ → 商品を追加: 「株式指標ウォッチ プレミアム」月額 980円(税込) → 価格IDをコピー → `STRIPE_PRICE_ID_MONTHLY`
3. 開発者 → APIキー → `STRIPE_SECRET_KEY`
4. 開発者 → Webhook → エンドポイント追加:
   - URL: `https://<ドメイン>/api/stripe-webhook`
   - イベント: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - 署名シークレット → `STRIPE_WEBHOOK_SECRET`
5. 設定 → Billing → カスタマーポータル を有効化(解約導線)

## 3. LINE(通知 + 連携ログイン)

LINE Developers(https://developers.line.biz)で **2つのチャネル** を作る:

1. **Messaging API チャネル**(通知送信用 = LINE公式アカウント)
   - チャネルアクセストークン(長期)→ `LINE_CHANNEL_ACCESS_TOKEN`
2. **LINEログイン チャネル**(会員とLINE IDの紐付け用)
   - チャネルID → `LINE_LOGIN_CHANNEL_ID`
   - チャネルシークレット → `LINE_LOGIN_CHANNEL_SECRET`
   - コールバックURL: `https://<ドメイン>/api/line/callback`

> 無料メッセージ枠は月200通。会員が増えたらLINE側プランを増強する。

## 4. J-Quants(株価データの正規化)

yfinance は非公式ライブラリのため、公開運用では J-Quants へ移行する。

1. https://jpx-jquants.com/ で登録 → リフレッシュトークン → `JQUANTS_REFRESH_TOKEN`
2. 無料プランは12週間遅延なので、**公開時は Light プラン以上を利用する**
3. 移行後は日次バッチの `fetch_prices.py --bulk` を
   `fetch_prices_jquants.py --date <当日>` に置き換える(初期履歴は `--code` で投入)

## 5. Vercel(Webデプロイ)

1. GitHubにリポジトリを push
2. https://vercel.com → Import → Root Directory を `apps/web` に設定
3. 環境変数(Production)を設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
   STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_ID_MONTHLY
   LINE_LOGIN_CHANNEL_ID / LINE_LOGIN_CHANNEL_SECRET
   NEXT_PUBLIC_APP_URL=https://<ドメイン>
   SERVICE_NAME / OPERATOR_NAME / CONTACT_EMAIL
   ```
4. デプロイ後、Stripe Webhook / LINE コールバック / Supabase Redirect のURLを本番ドメインに更新

## 6. GitHub Actions(日次バッチ)

リポジトリの Settings → Secrets and variables → Actions:

- **Secrets**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_DEV_USER_ID`, `JQUANTS_REFRESH_TOKEN`
- **Variables**: `NEXT_PUBLIC_APP_URL`, `PUSH_SUPABASE=true`(同期と会員通知を有効化)

`batch-daily.yml` が平日16:00 JSTに 取得→計算→Supabase同期→会員LINE通知 まで自動実行する。

## 7. 公開前チェックリスト(必須)

- [ ] **法務4ページの専門家レビュー**(行政書士・弁護士)
- [ ] 特商法ページの運営者氏名・連絡先を実名で設定(`OPERATOR_NAME` / `CONTACT_EMAIL`)
- [ ] 禁止ワードテスト通過(CIで自動)
- [ ] Supabase RLS が全テーブル有効(0001で設定済み、ダッシュボードで確認)
- [ ] Stripeを本番モードに切替、実カードで登録→解約を一巡テスト
- [ ] LINE通知のブロック時ハンドリング確認(403でスキップされること)
- [ ] J-Quants・LINE・Stripe 各利用規約の遵守確認
