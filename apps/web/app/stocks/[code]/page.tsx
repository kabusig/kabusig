import { notFound } from "next/navigation";
import {
  getStock,
  getPrices,
  getIndicators,
  recentSignalEvents,
} from "@/lib/db";
import PriceChart from "@/components/PriceChart";
import SignalEventTable from "@/components/SignalEventTable";

export const dynamic = "force-dynamic";

export default async function StockDetail({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const stock = getStock(code);
  if (!stock) notFound();

  const prices = getPrices(code, 250);
  const indicators = getIndicators(code, 250);
  const events = recentSignalEvents(50, code);
  const latest = prices[prices.length - 1];
  const latestInd = indicators[indicators.length - 1];
  const prev = prices[prices.length - 2];
  const changePct =
    latest && prev ? ((latest.close - prev.close) / prev.close) * 100 : null;

  const markers = events
    .filter((e) => prices.some((p) => p.date === e.date))
    .map((e) => ({ date: e.date, label: e.signal_name }));

  return (
    <div className="space-y-8">
      <div>
        <div className="text-sm text-[#6e6e73]">
          {stock.code} ・ {stock.market}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight mt-1">
          {stock.name}
        </h1>
        {latest && (
          <p className="text-2xl mt-3 font-medium tracking-tight">
            {latest.close.toLocaleString()}
            <span className="text-base font-normal">円</span>
            {changePct != null && (
              <span
                className={`ml-3 text-base ${
                  changePct >= 0 ? "text-[#d70015]" : "text-[#0066cc]"
                }`}
              >
                {changePct >= 0 ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
            )}
            <span className="ml-3 text-xs font-normal text-[#6e6e73]">
              {latest.date}
            </span>
          </p>
        )}
      </div>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
        <PriceChart
          candles={prices}
          sma5={indicators.map((i) => ({ date: i.date, value: i.sma5 }))}
          sma25={indicators.map((i) => ({ date: i.date, value: i.sma25 }))}
          sma75={indicators.map((i) => ({ date: i.date, value: i.sma75 }))}
          markers={markers}
        />
        <p className="text-[11px] text-[#6e6e73] mt-3">
          ●はシグナル検知日(指標が条件に一致した日)を示します。
        </p>
      </section>

      {latestInd && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["RSI(14)", latestInd.rsi14?.toFixed(1)],
            ["MACD", latestInd.macd?.toFixed(1)],
            ["出来高比(20日)", latestInd.volume_ratio20?.toFixed(2)],
            [
              "25日線乖離率",
              latestInd.kairi25 != null
                ? `${latestInd.kairi25.toFixed(2)}%`
                : null,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-black/5 shadow-sm p-5"
            >
              <div className="text-[#6e6e73] text-xs">{label}</div>
              <div className="text-2xl font-semibold tracking-tight mt-1">
                {value ?? "-"}
              </div>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          シグナル検知履歴
        </h2>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <SignalEventTable events={events} showStock={false} />
        </div>
      </section>
    </div>
  );
}
