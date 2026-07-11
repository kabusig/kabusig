// Supabase(PostgREST)実装のデータ層。公開読み取りは anon key で行う
// (RLSのpublic readポリシーで保護。書き込み系はservice roleのみ)。
import type {
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

const URL_ = () => process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
const KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function rest<T>(path: string, revalidate = 300): Promise<T> {
  const res = await fetch(`${URL_()}/rest/v1/${path}`, {
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${path}`);
  return res.json();
}

// jsonb を SQLite 実装(文字列)と揃える
function strDetail<T extends { detail?: unknown }>(rows: T[]): T[] {
  return rows.map((r) => ({
    ...r,
    detail:
      typeof r.detail === "string" ? r.detail : JSON.stringify(r.detail ?? {}),
  }));
}

export async function recentSignalEvents(
  limit = 100,
  code?: string
): Promise<SignalEvent[]> {
  const filter = code ? `&code=eq.${encodeURIComponent(code)}` : "";
  return strDetail(
    await rest<SignalEvent[]>(
      `v_signal_events?order=date.desc,code.asc&limit=${limit}${filter}`
    )
  );
}

export async function recentSignalEventsWithResult(
  limit = 15
): Promise<SignalEvent[]> {
  return strDetail(
    await rest<SignalEvent[]>(
      `v_signal_events?return_1d_pct=not.is.null&order=date.desc,code.asc&limit=${limit}`
    )
  );
}

export async function latestSignalStats(): Promise<{
  date: string | null;
  count: number;
}> {
  const rows = await rest<{ date: string; n: number }[]>(
    "v_signal_daily_counts?order=date.desc&limit=1"
  );
  return { date: rows[0]?.date ?? null, count: rows[0]?.n ?? 0 };
}

export async function countStocks(): Promise<number> {
  const res = await fetch(`${URL_()}/rest/v1/stocks?select=code`, {
    method: "HEAD",
    headers: {
      apikey: KEY(),
      Authorization: `Bearer ${KEY()}`,
      Prefer: "count=exact",
    },
    next: { revalidate: 3600 },
  });
  const range = res.headers.get("content-range") ?? "/0";
  return Number(range.split("/")[1] ?? 0);
}

export async function searchStocks(
  query = "",
  limit = 100
): Promise<StockWithPrice[]> {
  const q = encodeURIComponent(`*${query}*`);
  const filter = query ? `&or=(code.ilike.${q},name.ilike.${q})` : "";
  return rest<StockWithPrice[]>(
    `v_stocks_with_price?order=code.asc&limit=${limit}${filter}`
  );
}

export async function getStock(code: string): Promise<Stock | undefined> {
  const rows = await rest<Stock[]>(
    `stocks?code=eq.${encodeURIComponent(code)}&limit=1`
  );
  return rows[0];
}

export async function getPrices(code: string, limit = 500): Promise<PriceRow[]> {
  const rows = await rest<PriceRow[]>(
    `daily_prices?select=date,open,high,low,close,volume&code=eq.${encodeURIComponent(code)}&order=date.desc&limit=${limit}`
  );
  return rows.reverse();
}

export async function getIndicators(
  code: string,
  limit = 500
): Promise<IndicatorRow[]> {
  const rows = await rest<IndicatorRow[]>(
    `daily_indicators?select=date,rsi14,sma5,sma25,sma75,macd,macd_signal,volume_ratio20,kairi25&code=eq.${encodeURIComponent(code)}&order=date.desc&limit=${limit}`
  );
  return rows.reverse();
}

export async function listSignalTypes(): Promise<SignalType[]> {
  return rest<SignalType[]>("signal_types?order=category.asc,id.asc", 3600);
}

const SORT_COLUMNS: Record<string, string> = {
  count: "count",
  up_ratio: "up_ratio_pct",
  mean: "mean_return_pct",
};

export async function getSignalStats(
  holdDays = 3,
  sort: "count" | "up_ratio" | "mean" = "count"
): Promise<SignalStat[]> {
  const col = SORT_COLUMNS[sort] ?? "count";
  return rest<SignalStat[]>(
    `v_signal_stats?select=signal_type,signal_name,category,hold_days,count,up_count,down_count,up_ratio_pct,mean_return_pct,median_return_pct&hold_days=eq.${holdDays}&order=${col}.desc,signal_type.asc`
  );
}

export async function getSignalStatDetail(
  signalType: string,
  holdDays: number
): Promise<SignalStatDetail | null> {
  const rows = await rest<SignalStatDetail[]>(
    `v_signal_stats?signal_type=eq.${encodeURIComponent(signalType)}&hold_days=eq.${holdDays}&limit=1`
  );
  return rows[0] ?? null;
}

function strTags(rows: NewsItem[]): NewsItem[] {
  return rows.map((r) => ({
    ...r,
    tags: typeof r.tags === "string" ? r.tags : JSON.stringify(r.tags ?? []),
  }));
}

export async function newsList(limit = 300): Promise<NewsItem[]> {
  return strTags(
    await rest<NewsItem[]>(
      `news_links?order=published_at.desc.nullslast,id.desc&limit=${limit}`,
      120
    )
  );
}

export async function newsSources(): Promise<string[]> {
  // 件数は小さいので全件から重複除去(distinct はPostgRESTに無い)
  const rows = await rest<{ source_name: string }[]>(
    "news_links?select=source_name&order=source_name.asc&limit=1000",
    600
  );
  return [...new Set(rows.map((r) => r.source_name))];
}

export async function recentNews(limit = 10): Promise<NewsItem[]> {
  const rows = await newsList(limit * 2);
  const seen = new Set<string>();
  return rows
    .filter((r) => !seen.has(r.title) && (seen.add(r.title), true))
    .slice(0, limit);
}

export async function recentCalendarEvents(
  limit = 30
): Promise<CalendarEvent[]> {
  return rest<CalendarEvent[]>(
    `calendar_events?select=event_type,date,title,body&order=date.desc&limit=${limit}`
  );
}
