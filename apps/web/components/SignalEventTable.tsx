import Link from "next/link";
import type { SignalEvent } from "@/lib/db";
import CategoryBadge from "./CategoryBadge";

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
              <tr
                key={e.id}
                className="border-b border-black/5 last:border-0"
              >
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
                <td className="py-3 text-[#6e6e73] text-xs">
                  {close != null && <span>終値 {close}円 </span>}
                  {Object.entries(rest)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" / ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
