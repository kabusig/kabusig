export const dynamic = "force-static";

const ROWS: [string, string, string][] = [
  ["ダッシュボード閲覧", "◯", "◯"],
  ["ニュースリンク集", "◯", "◯"],
  ["監視銘柄数", "3銘柄", "50銘柄"],
  ["LINE通知", "1日1回まとめ", "シグナル種別ごと都度通知"],
  ["シグナル種別", "RSI系+決算予定", "全33種(酒田五法・著名分析家由来を含む)"],
  ["閾値カスタマイズ", "✕", "◯"],
  ["バックテスト", "直近6ヶ月・プリセットのみ", "全期間・条件自由設定"],
];

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">料金プラン</h1>
        <p className="text-sm text-[#6e6e73] mt-2 max-w-2xl">
          有料プランの課金対象は「通知の頻度・監視できる銘柄数・分析機能の範囲」
          といった機能・利便性です。表示・通知される情報はいずれも指標の機械的な
          計算結果および公開情報であり、情報の中身として投資判断を提供するものでは
          ありません。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm max-w-3xl">
          <thead>
            <tr className="text-left border-b border-black/10">
              <th className="py-3 pr-4">機能</th>
              <th className="py-3 pr-4">無料</th>
              <th className="py-3">有料(月額・税込)</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, free, paid]) => (
              <tr key={label} className="border-b border-black/5">
                <td className="py-3 pr-4">{label}</td>
                <td className="py-3 pr-4 text-[#424245]">{free}</td>
                <td className="py-3 text-[#424245]">{paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#6e6e73]">
        有料プランの申込機能はフェーズ3で提供予定です。申込前の最終確認画面で
        月額料金・課金周期・解約方法・提供内容を明示します。解約はいつでも可能で、
        解約後は当該課金期間の末日までご利用いただけます。
      </p>
    </div>
  );
}
