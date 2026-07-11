import Link from "next/link";
import { listSignalTypes } from "@/lib/db";
import { runBacktest } from "@/lib/backtest";
import { BACKTEST_NOTE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function BacktestPage({
  searchParams,
}: {
  searchParams: Promise<{ signal?: string; hold?: string }>;
}) {
  const sp = await searchParams;
  const types = listSignalTypes();
  const signal = sp.signal ?? "";
  const hold = Number(sp.hold ?? "5");
  const result = signal ? runBacktest(signal, hold) : null;
  const signalName = types.find((t) => t.id === signal)?.name;

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">バックテスト</h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 leading-relaxed">
          シグナル発生の翌営業日始値から N
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
            <option value="1">1営業日</option>
            <option value="2">2営業日</option>
            <option value="3">3営業日</option>
            <option value="5">5営業日</option>
            <option value="20">20営業日</option>
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
            {signalName}
            <span className="text-[#6e6e73] font-normal text-lg ml-3">
              {result.holdDays}営業日後
            </span>
          </h2>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["発生回数", `${result.count.toLocaleString()}回`],
              ["上昇した割合", `${result.upRatioPct.toFixed(1)}%`],
              ["平均騰落率", `${result.meanReturnPct.toFixed(2)}%`],
              ["中央値", `${result.medianReturnPct.toFixed(2)}%`],
              ["上昇回数", `${result.upCount.toLocaleString()}回`],
              ["下落回数", `${result.downCount.toLocaleString()}回`],
              ["最大上昇", `+${result.maxGainPct.toFixed(2)}%`],
              ["最大下落", `${result.maxLossPct.toFixed(2)}%`],
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
                    <span className="w-12 text-[#6e6e73]">
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
                      騰落率({result.holdDays}営業日後)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.occurrences.map((o) => (
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
                          {o.code} {o.stockName}
                        </Link>
                      </td>
                      <td
                        className={`py-3 font-medium ${
                          o.returnPct >= 0
                            ? "text-[#d70015]"
                            : "text-[#0066cc]"
                        }`}
                      >
                        {o.returnPct >= 0 ? "+" : ""}
                        {o.returnPct.toFixed(2)}%
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
