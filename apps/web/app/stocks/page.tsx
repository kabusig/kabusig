import Link from "next/link";
import { countStocks, searchStocks } from "@/lib/data";
import NotifyButton from "@/components/NotifyButton";

export const dynamic = "force-dynamic";

export default async function StocksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const total = await countStocks();
  const stocks = await searchStocks(q, 200); // 証券コード順(中立的順序)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">銘柄</h1>
        <p className="text-[15px] text-[#6e6e73] mt-3">
          東証プライム全{total.toLocaleString()}
          銘柄を監視しています。並び順は証券コード順です。
        </p>
        <div className="mt-4">
          <NotifyButton />
        </div>
      </div>

      <form method="get" className="flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="銘柄名・証券コードで検索"
          className="bg-white border border-black/10 rounded-full px-5 py-2.5 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
        />
        <button
          type="submit"
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          検索
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        {stocks.length === 0 ? (
          <p className="text-[#6e6e73] text-sm">
            「{q}」に一致する銘柄はありません。
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6e6e73] text-xs border-b border-black/5">
                    <th className="py-2.5 pr-4 font-medium">コード</th>
                    <th className="py-2.5 pr-4 font-medium">銘柄名</th>
                    <th className="py-2.5 pr-4 font-medium">市場</th>
                    <th className="py-2.5 font-medium">終値(最終取得日)</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s) => (
                    <tr
                      key={s.code}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="py-3 pr-4 text-[#6e6e73]">{s.code}</td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/stocks/${s.code}`}
                          className="text-[#0066cc] hover:underline font-medium"
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-[#6e6e73]">{s.market}</td>
                      <td className="py-3 text-[#6e6e73]">
                        {s.close != null
                          ? `${s.close.toLocaleString()}円 (${s.price_date})`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stocks.length === 200 && (
              <p className="text-xs text-[#6e6e73] mt-4">
                先頭200件を表示しています。検索で絞り込んでください。
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
