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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">バックテスト</h1>
        <p className="text-sm text-slate-400 mt-1">
          シグナル発生の翌営業日始値から N 営業日後終値までの騰落率を、
          過去の全発生について集計した統計です。
        </p>
        <p className="text-xs text-amber-400/90 mt-2 border border-amber-900 rounded p-2">
          {BACKTEST_NOTE}
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          <span className="block text-slate-400 text-xs mb-1">シグナル種別</span>
          <select
            name="signal"
            defaultValue={signal}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
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
          <span className="block text-slate-400 text-xs mb-1">保有期間</span>
          <select
            name="hold"
            defaultValue={String(hold)}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
          >
            <option value="1">1営業日</option>
            <option value="5">5営業日</option>
            <option value="20">20営業日</option>
          </select>
        </label>
        <button
          type="submit"
          className="bg-sky-700 hover:bg-sky-600 rounded px-4 py-2 text-sm"
        >
          集計する
        </button>
      </form>

      {signal && !result && (
        <p className="text-slate-400">
          対象期間に計測可能な発生がありません。
        </p>
      )}

      {result && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">
            {signalName} / {result.holdDays}営業日後
          </h2>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["発生回数", `${result.count}回`],
              ["上昇した割合", `${result.upRatioPct.toFixed(1)}%`],
              ["平均騰落率", `${result.meanReturnPct.toFixed(2)}%`],
              ["中央値", `${result.medianReturnPct.toFixed(2)}%`],
              ["上昇回数", `${result.upCount}回`],
              ["下落回数", `${result.downCount}回`],
              ["最大上昇", `${result.maxGainPct.toFixed(2)}%`],
              ["最大下落", `${result.maxLossPct.toFixed(2)}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-800 p-4"
              >
                <div className="text-slate-400 text-xs">{label}</div>
                <div className="text-xl font-bold">{value}</div>
              </div>
            ))}
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2 text-slate-300">
              騰落率の分布
            </h3>
            <div className="space-y-1">
              {result.histogram.map((h) => {
                const max = Math.max(...result.histogram.map((x) => x.count), 1);
                return (
                  <div key={h.bucket} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-right text-slate-400">
                      {h.bucket}
                    </span>
                    <div className="flex-1 bg-slate-900 rounded h-4">
                      <div
                        className="bg-sky-700 h-4 rounded"
                        style={{ width: `${(h.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-slate-400">{h.count}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2 text-slate-300">
              直近の発生(最大20件)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-800">
                    <th className="py-2 pr-4">発生日</th>
                    <th className="py-2 pr-4">銘柄</th>
                    <th className="py-2">騰落率({result.holdDays}営業日後)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.occurrences.map((o) => (
                    <tr
                      key={`${o.code}-${o.date}`}
                      className="border-b border-slate-900"
                    >
                      <td className="py-2 pr-4">{o.date}</td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/stocks/${o.code}`}
                          className="text-sky-400 hover:underline"
                        >
                          {o.code}
                        </Link>
                      </td>
                      <td
                        className={`py-2 ${
                          o.returnPct >= 0 ? "text-red-400" : "text-blue-400"
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
          <p className="text-xs text-amber-400/90 border border-amber-900 rounded p-2">
            {BACKTEST_NOTE}
          </p>
        </div>
      )}
    </div>
  );
}
