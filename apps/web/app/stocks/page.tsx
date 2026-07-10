import Link from "next/link";
import { listStocks, latestPrice } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function StocksPage() {
  const stocks = listStocks(); // 証券コード順(中立的順序)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">銘柄一覧</h1>
      <p className="text-sm text-slate-400">
        並び順は証券コード順です。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-800">
              <th className="py-2 pr-4">コード</th>
              <th className="py-2 pr-4">銘柄名</th>
              <th className="py-2 pr-4">市場</th>
              <th className="py-2">終値(最終取得日)</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => {
              const p = latestPrice(s.code);
              return (
                <tr key={s.code} className="border-b border-slate-900">
                  <td className="py-2 pr-4">{s.code}</td>
                  <td className="py-2 pr-4">
                    <Link
                      href={`/stocks/${s.code}`}
                      className="text-sky-400 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{s.market}</td>
                  <td className="py-2 text-slate-300">
                    {p ? `${p.close.toLocaleString()}円 (${p.date})` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
