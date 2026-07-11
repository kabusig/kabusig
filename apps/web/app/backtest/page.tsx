import Link from "next/link";
import { listSignalTypes, getSignalStatDetail } from "@/lib/data";
import { getViewer } from "@/lib/auth";
import { BACKTEST_NOTE } from "@/lib/constants";
import Paywall from "@/components/Paywall";

export const dynamic = "force-dynamic";

const HOLDS = [1, 2, 3, 5, 20];

export default async function BacktestPage({
  searchParams,
}: {
  searchParams: Promise<{ signal?: string; hold?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer.paid) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">バックテスト</h1>
        <Paywall feature="バックテスト" />
      </div>
    );
  }

  const sp = await searchParams;
  const types = await listSignalTypes();
  const signal = sp.signal ?? "";
  const hold = HOLDS.includes(Number(sp.hold)) ? Number(sp.hold) : 5;
  const result = signal ? await getSignalStatDetail(signal, hold) : null;

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">バックテスト</h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 leading-relaxed">
          検知日終値から N
          営業日後終値までの騰落率を、過去の全発生について集計した統計です。
        </p>
        <p className="text-xs text-[#6e6e73] mt-3 bg-[#f5f5f7] rounded-xl px-4 py-3">
          {BACKTEST_NOTE}
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-3 items-end bg-white rounded-2xl border border-black/5 shadow-sm p-5"
      >
        <label className="text-sm">
          <span className="block text-[#6e6e73] text-xs mb-1.5">
            シグナル種別
          </span>
          <select
            name="signal"
            defaultValue={signal}
            className="bg-[#f5f5f7] rounded-xl px-4 py-2.5 text-sm min-w-56"
          >
            <option value="">選択してください</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-[#6e6e73] text-xs mb-1.5">保有期間</span>
          <select
            name="hold"
            defaultValue={String(hold)}
            className="bg-[#f5f5f7] rounded-xl px-4 py-2.5 text-sm"
          >
            {HOLDS.map((h) => (
              <option key={h} value={h}>
                {h}営業日
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          集計する
        </button>
      </form>

      {signal && !result && (
        <p className="text-[#6e6e73]">対象期間に計測可能な発生がありません。</p>
      )}

      {result && (
        <div className="space-y-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            {result.signal_name}
            <span className="text-[#6e6e73] font-normal text-lg ml-3">
              {result.hold_days}営業日後
            </span>
          </h2>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["発生回数", `${result.count.toLocaleString()}回`],
              ["上昇した割合", `${result.up_ratio_pct.toFixed(1)}%`],
              ["平均騰落率", `${result.mean_return_pct.toFixed(2)}%`],
              ["中央値", `${result.median_return_pct.toFixed(2)}%`],
              ["上昇回数", `${result.up_count.toLocaleString()}回`],
              ["下落回数", `${result.down_count.toLocaleString()}回`],
              ["最大上昇", `+${(result.max_gain_pct ?? 0).toFixed(2)}%`],
              ["最大下落", `${(result.max_loss_pct ?? 0).toFixed(2)}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-black/5 shadow-sm p-5"
              >
                <div className="text-[#6e6e73] text-xs">{label}</div>
                <div className="text-2xl font-semibold tracking-tight mt-1">
                  {value}
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">騰落率の分布</h3>
            <div className="space-y-1.5">
              {result.histogram.map((h) => {
                const max = Math.max(
                  ...result.histogram.map((x) => x.count),
                  1
                );
                return (
                  <div
                    key={h.bucket}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span className="w-20 text-right text-[#6e6e73]">
                      {h.bucket}
                    </span>
                    <div className="flex-1 bg-[#f5f5f7] rounded-full h-5">
                      <div
                        className="bg-[#0071e3] h-5 rounded-full min-w-1"
                        style={{ width: `${(h.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-[#6e6e73]">
                      {h.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">
              直近の発生(最大20件)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6e6e73] text-xs border-b border-black/5">
                    <th className="py-2.5 pr-4 font-medium">発生日</th>
                    <th className="py-2.5 pr-4 font-medium">銘柄</th>
                    <th className="py-2.5 font-medium">
                      騰落率({result.hold_days}営業日後)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.recent_occurrences.map((o) => (
                    <tr
                      key={`${o.code}-${o.date}`}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="py-3 pr-4 text-[#6e6e73]">{o.date}</td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/stocks/${o.code}`}
                          className="text-[#0066cc] hover:underline"
                        >
                          {o.code} {o.name}
                        </Link>
                      </td>
                      <td
                        className={`py-3 font-medium ${
                          o.return_pct >= 0
                            ? "text-[#d70015]"
                            : "text-[#0066cc]"
                        }`}
                      >
                        {o.return_pct >= 0 ? "+" : ""}
                        {o.return_pct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-[#6e6e73] bg-[#f5f5f7] rounded-xl px-4 py-3">
            {BACKTEST_NOTE}
          </p>
        </div>
      )}
    </div>
  );
}
