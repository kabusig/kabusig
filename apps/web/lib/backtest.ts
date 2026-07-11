// バックテスト計算(batch/backtest_engine.py と同一仕様のTS実装)
// 「過去にどうだったか」の統計的事実のみを算出する。将来予測ではない。
import { getDb, getPrices, type PriceRow } from "./db";

export type BacktestResult = {
  signalType: string;
  holdDays: number;
  count: number;
  upCount: number;
  downCount: number;
  upRatioPct: number; // 「上昇した割合」
  meanReturnPct: number;
  medianReturnPct: number;
  maxGainPct: number;
  maxLossPct: number;
  histogram: { bucket: string; count: number }[];
  occurrences: {
    code: string;
    stockName: string;
    date: string;
    returnPct: number;
  }[];
};

export function runBacktest(
  signalType: string,
  holdDays: number,
  sinceMonths?: number
): BacktestResult | null {
  const db = getDb();
  const rows = db
    .prepare(
      "select e.code, e.date, s.name as stock_name from signal_events e " +
        "join stocks s on s.code = e.code where e.signal_type = ? order by e.date"
    )
    .all(signalType) as unknown as {
    code: string;
    date: string;
    stock_name: string;
  }[];

  const since = sinceMonths
    ? new Date(Date.now() - sinceMonths * 30 * 86400_000)
        .toISOString()
        .slice(0, 10)
    : null;

  const pricesCache = new Map<string, PriceRow[]>();
  const returns: {
    code: string;
    stockName: string;
    date: string;
    returnPct: number;
  }[] = [];

  for (const ev of rows) {
    if (since && ev.date < since) continue;
    if (!pricesCache.has(ev.code)) {
      pricesCache.set(ev.code, getPrices(ev.code, 2000));
    }
    const prices = pricesCache.get(ev.code)!;
    const pos = prices.findIndex((p) => p.date === ev.date);
    if (pos < 0) continue;
    const entryPos = pos + 1;
    const exitPos = pos + 1 + holdDays;
    if (exitPos >= prices.length) continue;
    const entry = prices[entryPos].open;
    const exit = prices[exitPos].close;
    if (entry <= 0) continue;
    returns.push({
      code: ev.code,
      stockName: ev.stock_name,
      date: ev.date,
      returnPct: ((exit - entry) / entry) * 100,
    });
  }

  const n = returns.length;
  if (n === 0) return null;
  const vals = returns.map((r) => r.returnPct).sort((a, b) => a - b);
  const upCount = vals.filter((v) => v > 0).length;

  // ヒストグラム(-10%〜+10%を2%刻み)
  const buckets: { bucket: string; count: number }[] = [];
  for (let lo = -10; lo < 10; lo += 2) {
    const hi = lo + 2;
    const count = vals.filter(
      (v) =>
        (lo === -10 ? v < hi : v >= lo && v < hi) ||
        (hi === 10 && v >= 10 && lo === 8)
    ).length;
    buckets.push({
      bucket: lo === -10 ? `<${hi}%` : hi === 10 ? `${lo}%+` : `${lo}〜${hi}%`,
      count,
    });
  }

  return {
    signalType,
    holdDays,
    count: n,
    upCount,
    downCount: vals.filter((v) => v < 0).length,
    upRatioPct: (upCount / n) * 100,
    meanReturnPct: vals.reduce((a, b) => a + b, 0) / n,
    medianReturnPct:
      n % 2 ? vals[(n - 1) / 2] : (vals[n / 2 - 1] + vals[n / 2]) / 2,
    maxGainPct: vals[n - 1],
    maxLossPct: vals[0],
    histogram: buckets,
    occurrences: returns.slice(-20).reverse(),
  };
}
