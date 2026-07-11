import Link from "next/link";

export const dynamic = "force-static";

const FEATURES = [
  ["シグナル検知", "東証プライム全銘柄 × 全33種(古典・酒田五法・著名分析家由来)"],
  ["LINE通知", "シグナル検知の都度通知/1日1回まとめの選択制"],
  ["3営業日後の実績表示", "全検知履歴に検知後の実際の値動き(過去の事実)を表示"],
  ["シグナル別統計", "全シグナル × 保有期間別の過去統計を一覧比較"],
  ["バックテスト", "全期間・全シグナル・保有期間自由設定"],
  ["銘柄詳細チャート", "ローソク足 + 移動平均 + シグナル検知マーカー"],
  ["相場の暦", "アノマリー・格言の暦日と過去統計"],
  ["経済ニュースまとめ", "報道・ブログ・SNS発の話題を自動集約(会員登録なしでも閲覧可)"],
];

export default function PricingPage() {
  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-semibold tracking-tight">プレミアム</h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 leading-relaxed">
          プランはひとつだけ。登録すればすべての機能をご利用いただけます。
          無料プランはありません(ニュースまとめは登録なしで閲覧できます)。
        </p>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-3xl border border-black/5 shadow-lg p-8 text-center">
        <div className="text-xs font-medium text-[#b25000] bg-[#fff3e0] rounded-full px-3 py-1 inline-block">
          プレミアム
        </div>
        <div className="mt-4">
          <span className="text-5xl font-semibold tracking-tight">980</span>
          <span className="text-[#6e6e73] ml-1">円/月(税込)</span>
        </div>
        <p className="text-xs text-[#6e6e73] mt-2">
          いつでも解約可能・解約後は課金期間末日まで利用可・日割返金なし
        </p>
        <div className="mt-6">
          <span className="inline-block bg-[#f5f5f7] text-[#6e6e73] rounded-full px-6 py-3 text-sm font-medium">
            登録受付はフェーズ2で開始予定
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-center">
          含まれる機能
        </h2>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm divide-y divide-black/5">
          {FEATURES.map(([name, desc]) => (
            <div key={name} className="px-6 py-4 flex gap-4">
              <span className="text-[#0071e3] mt-0.5">✓</span>
              <div>
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs text-[#6e6e73] mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto text-xs text-[#6e6e73] leading-relaxed space-y-2">
        <p>
          課金対象は「通知・統計・分析ツールなどの機能・利便性」です。表示・通知される
          情報はいずれも指標の機械的な計算結果および公開情報であり、情報の中身として
          投資判断を提供するものではありません。
        </p>
        <p>
          申込前の最終確認画面で月額料金・課金周期・解約方法・提供内容を明示します。
          詳細は
          <Link href="/legal/tokushoho" className="text-[#0066cc] hover:underline mx-1">
            特定商取引法に基づく表記
          </Link>
          をご確認ください。
        </p>
      </div>
    </div>
  );
}
