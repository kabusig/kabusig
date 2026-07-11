import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { getSignalStats, latestSignalStats, countStocks } from "@/lib/data";
import { BACKTEST_NOTE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const FEATURES: [string, string, string][] = [
  [
    "📡",
    "全シグナル検知(33種)",
    "東証プライム全銘柄を毎日チェック。RSI・ゴールデンクロスなどの古典から、江戸時代の酒田五法、グランビル・オニール・ダウ理論など著名分析家由来まで、検知した事実をすべて閲覧できます。",
  ],
  [
    "📈",
    "検知後の実績表示",
    "各検知の1・2・3営業日後に実際どう動いたかを「+○円(○%)」で表示。過去の事実をそのまま確認できます。",
  ],
  [
    "🏆",
    "シグナル別 過去統計",
    "33シグナル×保有期間別に「発生回数」「上昇した割合」「平均騰落率」を一覧比較。どのシグナルが過去どうだったかがひと目で分かります。",
  ],
  [
    "🧪",
    "バックテスト",
    "シグナルごとの騰落率分布ヒストグラム・直近発生一覧を全期間で確認できます。",
  ],
  [
    "💬",
    "LINE通知",
    "監視銘柄(最大50)にシグナルが出たら、その日のうちにLINEへお知らせ。通知するシグナルは自由に選べます。",
  ],
  [
    "📊",
    "銘柄詳細チャート",
    "ローソク足+移動平均線+シグナル検知マーカー付きのチャートと指標を全銘柄分。",
  ],
];

export default async function PricingPage() {
  const viewer = await getViewer();
  const stockCount = await countStocks();
  const { count: todayCount } = await latestSignalStats();
  // サンプル統計(紹介用に3件だけ表示)
  const sampleStats = (await getSignalStats(3, "up_ratio")).slice(0, 3);
  const ctaHref = viewer.loggedIn ? "/subscribe" : "/login";

  return (
    <div className="space-y-16">
      {/* ヒーロー */}
      <section className="text-center pt-4 max-w-2xl mx-auto">
        <div className="text-xs font-medium text-[#b25000] bg-[#fff3e0] rounded-full px-4 py-1.5 inline-block">
          プレミアム
        </div>
        <h1 className="text-5xl font-semibold tracking-tight mt-5 bg-gradient-to-br from-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent pb-1">
          市場のすべてを、この一画面に。
        </h1>
        <p className="text-lg text-[#6e6e73] mt-4 leading-relaxed">
          プランはひとつだけ。登録すれば、東証プライム
          {stockCount.toLocaleString()}銘柄 × 33シグナルのすべてが見られます。
        </p>
        <div className="mt-7">
          <span className="text-5xl font-semibold tracking-tight">980</span>
          <span className="text-[#6e6e73] ml-1.5">円/月(税込)</span>
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <Link
            href={ctaHref}
            className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-8 py-3.5 text-sm font-medium transition-colors"
          >
            プレミアムに登録する
          </Link>
        </div>
        <p className="text-xs text-[#6e6e73] mt-3">
          いつでも解約可能・解約後は課金期間末日まで利用可・日割返金なし
        </p>
      </section>

      {/* 会員が見られるもの */}
      <section>
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-8">
          プレミアム会員が見られるもの
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(([icon, title, desc]) => (
            <div
              key={title}
              className="bg-white rounded-3xl border border-black/5 shadow-sm p-7"
            >
              <div className="text-3xl">{icon}</div>
              <h3 className="font-semibold text-[17px] mt-3">{title}</h3>
              <p className="text-sm text-[#6e6e73] mt-2 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 実物のプレビュー */}
      <section className="bg-gradient-to-br from-[#f5f5f7] to-[#e8f2ff] rounded-3xl p-8 md:p-12">
        <h2 className="text-2xl font-semibold tracking-tight text-center">
          たとえば、こんな統計が見られます
        </h2>
        <p className="text-sm text-[#6e6e73] text-center mt-2">
          シグナル別過去統計(3営業日後・上昇した割合順)の一部
        </p>
        <div className="bg-white rounded-2xl shadow-sm max-w-2xl mx-auto mt-6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#6e6e73] text-xs border-b border-black/5">
                <th className="px-5 py-3 font-medium">シグナル</th>
                <th className="px-5 py-3 font-medium text-right">発生回数</th>
                <th className="px-5 py-3 font-medium text-right">
                  上昇した割合
                </th>
                <th className="px-5 py-3 font-medium text-right">平均騰落率</th>
              </tr>
            </thead>
            <tbody>
              {sampleStats.map((s) => (
                <tr key={s.signal_type} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3.5 font-medium">{s.signal_name}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-[#424245]">
                    {s.count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-semibold">
                    {s.up_ratio_pct.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-[#d70015] font-medium">
                    +{s.mean_return_pct.toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="px-5 py-4 text-center">
                  <span className="text-xs text-[#6e6e73]">
                    …残り30シグナル×5期間は登録後に閲覧できます
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#6e6e73] text-center mt-4 max-w-xl mx-auto">
          {BACKTEST_NOTE}
        </p>
        <p className="text-sm text-center mt-6">
          きょうも{" "}
          <span className="font-semibold">
            {todayCount.toLocaleString()}件
          </span>{" "}
          のシグナルを検知しています。
        </p>
      </section>

      {/* 登録の流れ */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold tracking-tight text-center mb-6">
          登録はかんたん3ステップ
        </h2>
        <div className="space-y-3">
          {[
            ["1", "メールアドレスでログイン", "ログイン用リンクが届きます。パスワードは不要です。"],
            ["2", "申込内容を確認して決済", "クレジットカード(Stripe)で月額980円。確認画面で内容を明示します。"],
            ["3", "LINE連携して通知を受け取る", "監視銘柄を登録すれば、その日の検知がLINEに届きます。"],
          ].map(([n, title, desc]) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex gap-4 items-start"
            >
              <span className="bg-[#0071e3] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-semibold shrink-0">
                {n}
              </span>
              <div>
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-[#6e6e73] mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href={ctaHref}
            className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-8 py-3.5 text-sm font-medium transition-colors"
          >
            プレミアムに登録する
          </Link>
        </div>
      </section>

      {/* 法的整理 */}
      <section className="max-w-2xl mx-auto text-xs text-[#6e6e73] leading-relaxed space-y-2">
        <p>
          課金対象は「通知・統計・分析ツールなどの機能・利便性」です。表示・通知される
          情報はいずれも指標の機械的な計算結果および公開情報であり、情報の中身として
          投資判断を提供するものではありません。ニュースまとめ・シグナル図鑑・相場の暦は
          登録なしでご覧いただけます。
        </p>
        <p>
          詳細は
          <Link href="/legal/tokushoho" className="text-[#0066cc] hover:underline mx-1">
            特定商取引法に基づく表記
          </Link>
          をご確認ください。
        </p>
      </section>
    </div>
  );
}
