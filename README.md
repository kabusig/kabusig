# 株式指標ウォッチ

日本株のテクニカル指標・決算スケジュールを**機械的に検知して通知する** Webアプリ + LINE通知サービス。

> **本サービスは投資助言サービスではありません。** 「指標が条件に一致した」という客観的事実のみを通知する情報ツールです。この設計思想は法的リスク回避のための本質であり、全実装・全文言で厳守します(詳細: [開発指示書](株式指標通知サービス_開発指示書.md) §1)。

## 構成

```
batch/            Python バッチ(株価取得・指標計算・シグナル判定・通知)
apps/web/         Next.js Webアプリ(ダッシュボード・バックテスト・法務ページ)
supabase/         PostgreSQL マイグレーション(フェーズ2)
.github/workflows CI + 日次バッチ(GitHub Actions cron)
data/             ローカル SQLite(フェーズ1、git管理外)
```

## シグナル一覧(33種)

| カテゴリ | 内容 |
|---|---|
| 古典テクニカル(17種) | RSI過熱/売られすぎ、ゴールデン/デッドクロス、MACDクロス、ボリンジャー±2σ、出来高急増、52週高安値、25日線乖離、ストキャスティクス、5日続伸/続落 |
| 酒田五法・ローソク足(8種) | 赤三兵、三羽烏、陽/陰の包み足、明けの明星、宵の明星、三空踏み上げ/叩き込み(江戸時代・本間宗久由来) |
| 著名分析家由来(8種) | グランビルの法則(第1/第5)、ダーバス・ボックス、オニール型新高値・出来高、ダウ理論トレンド確認、一目均衡表三役好転/逆転 |
| 相場の暦・アノマリー | 節分天井・彼岸底、Sell in May、ハロウィン効果、メジャーSQ、45日ルール、満月・新月、干支格言、月末効果 |

シグナル名・説明文はすべて「状態の記述」であり、売買の方向を示す表現は使いません(CI の禁止ワードテストで機械的に担保)。アノマリーは「言い伝えの紹介」として提示し、統計的検証はバックテスト機能で行います。

## 監視対象

**東証プライム全銘柄(約1,550)**。銘柄マスタは JPX 公式の上場銘柄一覧から
`fetch_stocklist.py` で自動生成する(証券コード順の中立的順序で表示)。

## セットアップ(フェーズ1: ローカル)

```powershell
# 1. Python 環境
python -m venv .venv
.venv\Scripts\pip install -r batch\requirements.txt

# 2. 銘柄マスタ → データ取得 → 指標計算 → シグナル検知(初回はバックフィル)
cd batch
..\.venv\Scripts\python fetch_stocklist.py
..\.venv\Scripts\python fetch_prices.py --bulk --period 2y
..\.venv\Scripts\python calc_indicators.py
..\.venv\Scripts\python detect_signals.py --backfill

# 3. ニュース収集(公式RSSのみ・リンクのみ保存)
..\.venv\Scripts\python fetch_news.py

# 4. 通知テスト(トークン未設定なら dry-run で標準出力)
..\.venv\Scripts\python send_notifications.py --digest

# 5. Web アプリ
cd ..\apps\web
npm install
npm run dev   # http://localhost:3000
```

## 収益化(ニュースまとめ)

`/news` は経済メディアの公式RSSを自動集約したまとめページ。広告・アフィリエイトは
`apps/web/components/AdSlot.tsx` の `AD_SLOTS` にタグを設定すると表示される
(金融系アフィリエイトでも、特定商品を勧める文言は書かないこと)。

## テスト

```powershell
cd batch
..\.venv\Scripts\python -m pytest tests -v
```

- 指標計算: Wilder RSI 逐次計算リファレンスとの突合、既知値検証
- シグナル判定: クロス境界値(70ちょうど→70超 等)、重複検知抑止
- **禁止ワード**: 全ソースを走査し、助言に当たる表現(リストは `tests/test_forbidden_words.py`)を検出したら fail
- 冪等性: 同日再実行でシグナル・通知が重複しないこと

## フェーズ計画

- **フェーズ1(完了)**: ローカル SQLite + yfinance。自分用ツールとして完成
- **フェーズ2(コード実装済み)**: Supabase(DB/認証)+ Stripe(プレミアム980円/月)+
  LINE連携 + J-Quants + Vercel/GitHub Actions 公開基盤
  - **セットアップ手順: [docs/SETUP_PHASE2.md](docs/SETUP_PHASE2.md)**
  - Supabase 未設定時は「開発モード」(ログイン不要・全機能・SQLite)で動作
  - アーキテクチャ: バッチはSQLiteで計算 → `push_supabase.py` で配信用DBへ同期
  - 公開範囲: ニュース/図鑑/暦/料金=誰でも、シグナル・統計・バックテスト・通知=プレミアム会員
- **フェーズ3**: 閾値カスタマイズ、管理画面(通知数集計・ニュース手動登録)

## 法務(公開前チェックリスト)

- [ ] 法務4ページ(免責・規約・プライバシー・特商法)の**専門家レビュー**
- [ ] 特商法の最終確認画面(課金直前)の表示要件充足
- [ ] J-Quants・LINE・Stripe 各利用規約の遵守確認
- [ ] 禁止ワードテスト通過(CI で自動)
- [ ] Supabase RLS が全テーブルで有効なこと
