import Link from "next/link";
import { BACKTEST_NOTE } from "@/lib/constants";
import type { SignalStat } from "@/lib/db";

// ダッシュボードの「餌」ランキング。1位のみ公開し、2位以下は会員限定でぼかす。
export default function SignalRankTeaser({
  title,
  subtitle,
  rows,
  metric,
  paid,
}: {
  title: string;
  subtitle: string;
  rows: SignalStat[];
  metric: "up_ratio" | "mean";
  paid: boolean;
}) {
  if (rows.length === 0) return null;

  const renderValue = (s: SignalStat) => {
    if (metric === "up_ratio") {
      return (
        <span className="text-right tabular-nums shrink-0">
          <span className="font-semibold">{s.up_ratio_pct.toFixed(1)}%</span>
          <span className="text-xs text-[#6e6e73] ml-2">
            {s.count.toLocaleString()}回
          </span>
        </span>
      );
    }
    return (
      <span className="text-right tabular-nums shrink-0">
        <span
          className={`font-semibold ${
            s.mean_return_pct >= 0 ? "text-[#d70015]" : "text-[#0066cc]"
          }`}
        >
          {s.mean_return_pct >= 0 ? "+" : ""}
          {s.mean_return_pct.toFixed(2)}%
        </span>
        <span className="text-xs text-[#6e6e73] ml-2">
          {s.count.toLocaleString()}回
        </span>
      </span>
    );
  };

  return (
    <section>
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {title}
          <span className="text-sm font-normal text-[#6e6e73] ml-3">
            {subtitle}
          </span>
        </h2>
        <Link href="/stats" className="text-sm text-[#0066cc] hover:underline">
          統計をすべて見る →
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="divide-y divide-black/5">
          {rows.map((s, i) => {
            const locked = !paid && i > 0;
            return (
              <div key={s.signal_type} className="flex items-center gap-4 py-3">
                <span className="w-6 text-lg font-semibold text-[#6e6e73] tabular-nums shrink-0">
                  {i + 1}
                </span>
                <span
                  className={`flex-1 font-medium leading-snug ${
                    locked ? "blur-sm select-none" : ""
                  }`}
                >
                  {s.signal_name}
                </span>
                {locked ? (
                  <span className="text-sm text-[#6e6e73] shrink-0">
                    🔒 会員限定
                  </span>
                ) : (
                  renderValue(s)
                )}
              </div>
            );
          })}
        </div>
        {!paid && (
          <div className="mt-4 rounded-xl bg-gradient-to-br from-[#f5f5f7] to-[#e8f2ff] p-6 text-center">
            <p className="text-sm font-medium">
              🔒 2位以下のシグナル名・数値はプレミアム会員限定
            </p>
            <p className="text-xs text-[#6e6e73] mt-1">
              全シグナルの発生回数・上昇割合・平均騰落率を、期間を切り替えて閲覧できます。
            </p>
            <Link
              href="/pricing"
              className="inline-block mt-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              プレミアムでできることを見る
            </Link>
          </div>
        )}
        <p className="text-[11px] text-[#6e6e73] mt-4">
          {metric === "up_ratio" ? "上昇した割合" : "平均騰落率"}
          の降順です。特定のシグナルの利用をすすめるものではありません。
          {BACKTEST_NOTE}
        </p>
      </div>
    </section>
  );
}
