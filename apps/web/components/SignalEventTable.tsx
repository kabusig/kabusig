import Link from "next/link";
import type { SignalEvent } from "@/lib/db";
import CategoryBadge from "./CategoryBadge";

// 検知値の指標キーを日本語ラベルに変換(表示を分かりやすくする)
const DETAIL_LABELS: Record<string, string> = {
  rsi14: "RSI",
  sma5: "5日線",
  sma25: "25日線",
  sma75: "75日線",
  sma200: "200日線",
  macd: "MACD",
  macd_signal: "シグナル線",
  bb_upper: "+2σ",
  bb_lower: "-2σ",
  stoch_k: "%K",
  stoch_d: "%D",
  kairi25: "25日線乖離率",
  volume_ratio20: "出来高倍率",
  tenkan: "転換線",
  kijun: "基準線",
};

// 検知値を「ラベル 値」の読みやすい形に整形
function formatDetail(rest: Record<string, number>): string {
  return Object.entries(rest)
    .map(([k, v]) => {
      const label = DETAIL_LABELS[k] ?? k;
      const num =
        Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2);
      const unit = k === "kairi25" ? "%" : k === "volume_ratio20" ? "倍" : "";
      return `${label} ${num}${unit}`;
    })
    .join(" / ");
}

function Result({
  pct,
  yen,
}: {
  pct: number | null;
  yen: number | null;
}) {
  if (pct == null || yen == null) {
    return <span className="text-[#6e6e73] text-xs">集計中</span>;
  }
  const up = pct >= 0;
  return (
    <span
      className={`font-medium tabular-nums text-xs ${
        up ? "text-[#d70015]" : "text-[#0066cc]"
      }`}
    >
      {up ? "+" : ""}
      {yen.toLocaleString()}円
      <span className="block text-[10px] opacity-80">
        {up ? "+" : ""}
        {pct.toFixed(2)}%
      </span>
    </span>
  );
}

export default function SignalEventTable({
  events,
  showStock = true,
}: {
  events: SignalEvent[];
  showStock?: boolean;
}) {
  if (events.length === 0) {
    return <p className="text-[#6e6e73] text-sm">検知履歴はありません。</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#6e6e73] text-xs border-b border-black/5">
            <th className="py-2.5 pr-4 font-medium">検知日</th>
            {showStock && <th className="py-2.5 pr-4 font-medium">銘柄</th>}
            <th className="py-2.5 pr-4 font-medium">シグナル(状態)</th>
            <th className="py-2.5 pr-4 font-medium">分類</th>
            <th className="py-2.5 pr-4 font-medium">1営業日後</th>
            <th className="py-2.5 pr-4 font-medium">2営業日後</th>
            <th className="py-2.5 pr-4 font-medium">3営業日後</th>
            <th className="py-2.5 font-medium">検知値</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            let detail: Record<string, number> = {};
            try {
              detail = JSON.parse(e.detail ?? "{}");
            } catch {}
            const { close, ...rest } = detail;
            return (
              <tr key={e.id} className="border-b border-black/5 last:border-0">
                <td className="py-3 pr-4 whitespace-nowrap text-[#6e6e73]">
                  {e.date}
                </td>
                {showStock && (
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Link
                      href={`/stocks/${e.code}`}
                      className="text-[#0066cc] hover:underline"
                    >
                      {e.code} {e.stock_name}
                    </Link>
                  </td>
                )}
                <td className="py-3 pr-4 font-medium" title={e.description}>
                  {e.signal_name}
                </td>
                <td className="py-3 pr-4">
                  <CategoryBadge category={e.category} />
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <Result pct={e.return_1d_pct} yen={e.return_1d_yen} />
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <Result pct={e.return_2d_pct} yen={e.return_2d_yen} />
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <Result pct={e.return_3d_pct} yen={e.return_3d_yen} />
                </td>
                <td className="py-3 text-[#6e6e73] text-xs">
                  {close != null && (
                    <span>終値 {close.toLocaleString()}円 </span>
                  )}
                  {formatDetail(rest)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-[#6e6e73] mt-3">
        「N営業日後」は検知日終値からN営業日後終値までの実際の値動き(過去の事実)です。将来の値動きを保証・示唆するものではありません。
      </p>
    </div>
  );
}
