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

## セットアップ(フェーズ1: ローカル)

```powershell
# 1. Python 環境
python -m venv .venv
.venv\Scripts\pip install -r batch\requirements.txt

# 2. データ取得 → 指標計算 → シグナル検知(初回はバックフィル)
cd batch
..\.venv\Scripts\python fetch_prices.py --period 2y
..\.venv\Scripts\python calc_indicators.py
..\.venv\Scripts\python detect_signals.py --backfill

# 3. 通知テスト(トークン未設定なら dry-run で標準出力)
..\.venv\Scripts\python send_notifications.py --digest

# 4. Web アプリ
cd ..\apps\web
npm install
npm run dev   # http://localhost:3000
```

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

- **フェーズ1(現在)**: ローカル SQLite + yfinance。自分用ツールとして完成
- **フェーズ2**: Supabase 移行(`supabase/migrations`)+ J-Quants API + 認証 + 決算予定通知
  - yfinance は非公式ライブラリのため、公開運用前に必ず J-Quants へ移行する
- **フェーズ3**: Stripe 課金、閾値カスタマイズ、管理画面

## 法務(公開前チェックリスト)

- [ ] 法務4ページ(免責・規約・プライバシー・特商法)の**専門家レビュー**
- [ ] 特商法の最終確認画面(課金直前)の表示要件充足
- [ ] J-Quants・LINE・Stripe 各利用規約の遵守確認
- [ ] 禁止ワードテスト通過(CI で自動)
- [ ] Supabase RLS が全テーブルで有効なこと
