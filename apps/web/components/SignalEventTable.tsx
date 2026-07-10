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
    return <p className="text-slate-400 text-sm">検知履歴はありません。</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-800">
            <th className="py-2 pr-4">検知日</th>
            {showStock && <th className="py-2 pr-4">銘柄</th>}
            <th className="py-2 pr-4">シグナル(状態)</th>
            <th className="py-2 pr-4">分類</th>
            <th className="py-2">検知値</th>
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
              <tr key={e.id} className="border-b border-slate-900">
                <td className="py-2 pr-4 whitespace-nowrap">{e.date}</td>
                {showStock && (
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <Link
                      href={`/stocks/${e.code}`}
                      className="text-sky-400 hover:underline"
                    >
                      {e.code} {e.stock_name}
                    </Link>
                  </td>
                )}
                <td className="py-2 pr-4" title={e.description}>
                  {e.signal_name}
                </td>
                <td className="py-2 pr-4">
                  <CategoryBadge category={e.category} />
                </td>
                <td className="py-2 text-slate-400 text-xs">
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
