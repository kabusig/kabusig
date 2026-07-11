import Link from "next/link";
import { getSignalStats } from "@/lib/db";
import { BACKTEST_NOTE } from "@/lib/constants";
import CategoryBadge from "@/components/CategoryBadge";

export const dynamic = "force-dynamic";

const HOLDS = [1, 3, 5, 20];
const SORTS = [
  { key: "count", label: "発生回数" },
  { key: "up_ratio", label: "上昇した割合" },
  { key: "mean", label: "平均騰落率" },
] as const;

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ hold?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const hold = HOLDS.includes(Number(sp.hold)) ? Number(sp.hold) : 3;
  const sort = (["count", "up_ratio", "mean"].includes(sp.sort ?? "")
    ? sp.sort
    : "count") as "count" | "up_ratio" | "mean";
  const stats = getSignalStats(hold, sort);

  const href = (h: number, s: string) => `/stats?hold=${h}&sort=${s}`;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          シグナル別 過去統計
        </h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 leading-relaxed">
          全シグナルについて、検知日終値から N
          営業日後終値までの騰落率を過去の全発生で集計した統計です。
          並び順は選択した統計量の降順で、特定のシグナルの利用をすすめるものではありません。
        </p>
        <p className="text-xs text-[#6e6e73] mt-3 bg-[#f5f5f7] rounded-xl px-4 py-3">
          {BACKTEST_NOTE}
          市場全体が上昇した期間の統計は全シグナルが高めに出る等、期間の影響を受けます。
        </p>
      </div>

      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-[#6e6e73]">期間</span>
          {HOLDS.map((h) => (
            <Link
              key={h}
              href={href(h, sort)}
              className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                h === hold
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              {h}営業日後
            </Link>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-[#6e6e73]">並び順</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={href(hold, s.key)}
              className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                s.key === sort
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#6e6e73] text-xs border-b border-black/5">
                <th className="py-2.5 pr-4 font-medium">シグナル</th>
                <th className="py-2.5 pr-4 font-medium">分類</th>
                <th className="py-2.5 pr-4 font-medium text-right">発生回数</th>
                <th className="py-2.5 pr-4 font-medium text-right">
                  上昇した割合
                </th>
                <th className="py-2.5 pr-4 font-medium text-right">
                  平均騰落率
                </th>
                <th className="py-2.5 pr-4 font-medium text-right">中央値</th>
                <th className="py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr
                  key={s.signal_type}
                  className="border-b border-black/5 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium">{s.signal_name}</td>
                  <td className="py-3 pr-4">
                    <CategoryBadge category={s.category} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-[#424245]">
                    {s.count.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums font-medium">
                    {s.up_ratio_pct.toFixed(1)}%
                  </td>
                  <td
                    className={`py-3 pr-4 text-right tabular-nums font-medium ${
                      s.mean_return_pct >= 0
                        ? "text-[#d70015]"
                        : "text-[#0066cc]"
                    }`}
                  >
                    {s.mean_return_pct >= 0 ? "+" : ""}
                    {s.mean_return_pct.toFixed(2)}%
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-[#424245]">
                    {s.median_return_pct >= 0 ? "+" : ""}
                    {s.median_return_pct.toFixed(2)}%
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/backtest?signal=${s.signal_type}&hold=${hold}`}
                      className="text-xs text-[#0066cc] hover:underline whitespace-nowrap"
                    >
                      詳細 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#6e6e73] mt-4">
          統計は東証プライム全銘柄・過去約2年の検知結果に基づきます。{BACKTEST_NOTE}
        </p>
      </div>
    </div>
  );
}
