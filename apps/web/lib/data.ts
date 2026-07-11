// データ層の切替: Supabase設定あり=本番(PostgREST) / なし=ローカルSQLite。
// ページは必ずこのモジュールを import する(db.ts / data-supabase.ts を直接使わない)。
import * as sqlite from "./db";
import * as sb from "./data-supabase";

export type {
  CalendarEvent,
  IndicatorRow,
  NewsItem,
  PriceRow,
  SignalEvent,
  SignalStat,
  SignalStatDetail,
  SignalType,
  Stock,
  StockWithPrice,
} from "./db";

const useSupabase = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

export async function recentSignalEvents(limit = 100, code?: string) {
  return useSupabase()
    ? sb.recentSignalEvents(limit, code)
    : sqlite.recentSignalEvents(limit, code);
}

export async function recentSignalEventsWithResult(limit = 15) {
  return useSupabase()
    ? sb.recentSignalEventsWithResult(limit)
    : sqlite.recentSignalEventsWithResult(limit);
}

export async function latestSignalStats() {
  return useSupabase() ? sb.latestSignalStats() : sqlite.latestSignalStats();
}

export async function countStocks() {
  return useSupabase() ? sb.countStocks() : sqlite.countStocks();
}

export async function searchStocks(query = "", limit = 100) {
  return useSupabase()
    ? sb.searchStocks(query, limit)
    : sqlite.searchStocks(query, limit);
}

export async function getStock(code: string) {
  return useSupabase() ? sb.getStock(code) : sqlite.getStock(code);
}

export async function getPrices(code: string, limit = 500) {
  return useSupabase() ? sb.getPrices(code, limit) : sqlite.getPrices(code, limit);
}

export async function getIndicators(code: string, limit = 500) {
  return useSupabase()
    ? sb.getIndicators(code, limit)
    : sqlite.getIndicators(code, limit);
}

export async function listSignalTypes() {
  return useSupabase() ? sb.listSignalTypes() : sqlite.listSignalTypes();
}

export async function getSignalStats(
  holdDays = 3,
  sort: "count" | "up_ratio" | "mean" = "count"
) {
  return useSupabase()
    ? sb.getSignalStats(holdDays, sort)
    : sqlite.getSignalStats(holdDays, sort);
}

export async function getSignalStatDetail(signalType: string, holdDays: number) {
  return useSupabase()
    ? sb.getSignalStatDetail(signalType, holdDays)
    : sqlite.getSignalStatDetail(signalType, holdDays);
}

export async function newsList(limit = 300) {
  return useSupabase() ? sb.newsList(limit) : sqlite.newsList(limit);
}

export async function newsSources() {
  return useSupabase() ? sb.newsSources() : sqlite.newsSources();
}

export async function recentNews(limit = 10) {
  return useSupabase() ? sb.recentNews(limit) : sqlite.recentNews(limit);
}

export async function recentCalendarEvents(limit = 30) {
  return useSupabase()
    ? sb.recentCalendarEvents(limit)
    : sqlite.recentCalendarEvents(limit);
}
