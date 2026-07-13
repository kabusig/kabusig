// サービス定数(法務ページ・フッターで一元利用)
export const SERVICE_NAME = process.env.SERVICE_NAME ?? "カブシグナル";
// 正式名称(法務ページ等で使用)
export const SERVICE_NAME_FULL =
  process.env.SERVICE_NAME_FULL ?? "カブシグナル（株式市場シグナルウォッチ）";
export const OPERATOR_NAME = process.env.OPERATOR_NAME ?? "【運営者名】";
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "admin@kabusig.com";

// 全ページフッター・全通知に表示する固定免責文言(変更禁止)
export const DISCLAIMER =
  "本サービスが提供する情報はテクニカル指標等の機械的な計算結果および公開情報であり、" +
  "投資勧誘・投資助言を目的とするものではありません。" +
  "特定の金融商品の売買をすすめるものではなく、投資判断はご自身の責任で行ってください。";

export const BACKTEST_NOTE =
  "過去の統計であり、将来の値動きを保証・示唆するものではありません。";

export const ANOMALY_NOTE =
  "相場格言・アノマリーは古くから語り継がれる経験則・言い伝えの紹介であり、" +
  "将来の値動きを示唆するものではありません。";

export const CATEGORY_LABELS: Record<string, string> = {
  classic: "古典テクニカル",
  sakata: "酒田五法・ローソク足",
  legend: "著名分析家由来",
  anomaly: "相場の暦・アノマリー",
};
