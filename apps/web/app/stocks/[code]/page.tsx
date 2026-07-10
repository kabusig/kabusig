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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {stock.code} {stock.name}
          <span className="ml-3 text-sm font-normal text-slate-400">
            {stock.market}
          </span>
        </h1>
        {latest && (
          <p className="text-lg mt-1">
            {latest.close.toLocaleString()}円
            {changePct != null && (
              <span
                className={`ml-2 text-sm ${
                  changePct >= 0 ? "text-red-400" : "text-blue-400"
                }`}
              >
                前日比 {changePct >= 0 ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
            )}
            <span className="ml-2 text-xs text-slate-500">({latest.date})</span>
          </p>
        )}
      </div>

      <section className="rounded-lg border border-slate-800 p-3">
        <PriceChart
          candles={prices}
          sma5={indicators.map((i) => ({ date: i.date, value: i.sma5 }))}
          sma25={indicators.map((i) => ({ date: i.date, value: i.sma25 }))}
          sma75={indicators.map((i) => ({ date: i.date, value: i.sma75 }))}
          markers={markers}
        />
        <p className="text-xs text-slate-500 mt-2">
          ●はシグナル検知日(指標が条件に一致した日)を示します。
        </p>
      </section>

      {latestInd && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["RSI(14)", latestInd.rsi14?.toFixed(1)],
            ["MACD", latestInd.macd?.toFixed(1)],
            ["出来高比(20日)", latestInd.volume_ratio20?.toFixed(2)],
            ["25日線乖離率", latestInd.kairi25 != null ? `${latestInd.kairi25.toFixed(2)}%` : null],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-800 p-4">
              <div className="text-slate-400 text-xs">{label}</div>
              <div className="text-xl font-bold">{value ?? "-"}</div>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">シグナル検知履歴</h2>
        <SignalEventTable events={events} showStock={false} />
      </section>
    </div>
  );
}
