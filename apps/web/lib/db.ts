// データアクセス層(フェーズ1: ローカルSQLite / フェーズ2: Supabaseに差し替え)
// Node 24 標準の node:sqlite を使用(ネイティブ依存なし)
// サーバーコンポーネント・Route Handler からのみ使用すること
import { DatabaseSync } from "node:sqlite";
import path from "path";

const DB_PATH =
  process.env.DB_PATH ??
  path.resolve(process.cwd(), "..", "..", "data", "local.db");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH, { readOnly: true });
  }
  return db;
}

// node:sqlite はnullプロトタイプの行を返すため、Client Component へ渡せる
// プレーンオブジェクトに変換する
function plain<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as object) })) as T[];
}

function plainOne<T>(row: unknown): T | undefined {
  return row == null ? undefined : ({ ...(row as object) } as T);
}

export type Stock = { code: string; name: string; market: string };
export type SignalEvent = {
  id: number;
  code: string;
  stock_name: string;
  signal_type: string;
  signal_name: string;
  description: string;
  category: string;
  origin: string;
  is_premium: number;
  date: string;
  detail: string;
  return_1d_pct: number | null; // 検知日終値→N営業日後終値(過去の事実)
  return_1d_yen: number | null;
  return_2d_pct: number | null;
  return_2d_yen: number | null;
  return_3d_pct: number | null;
  return_3d_yen: number | null;
};

export type SignalStat = {
  signal_type: string;
  signal_name: string;
  category: string;
  hold_days: number;
  count: number;
  up_count: number;
  down_count: number;
  up_ratio_pct: number;
  mean_return_pct: number;
  median_return_pct: number;
};
export type SignalType = {
  id: string;
  name: string;
  description: string;
  origin: string;
  category: string;
  is_premium: number;
};
export type PriceRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export type IndicatorRow = {
  date: string;
  rsi14: number | null;
  sma5: number | null;
  sma25: number | null;
  sma75: number | null;
  macd: number | null;
  macd_signal: number | null;
  volume_ratio20: number | null;
  kairi25: number | null;
};
export type CalendarEvent = {
  event_type: string;
  date: string;
  title: string;
  body: string;
};

export function listStocks(): Stock[] {
  // 並び順は証券コード順(中立的順序)のみ
  return plain<Stock>(
    getDb().prepare("select code, name, market from stocks order by code").all()
  );
}

export function latestSignalStats(): { date: string | null; count: number } {
  const row = getDb()
    .prepare(
      "select date, count(*) as n from signal_events group by date order by date desc limit 1"
    )
    .get() as { date: string; n: number } | undefined;
  return { date: row?.date ?? null, count: row?.n ?? 0 };
}

export function countStocks(): number {
  const row = getDb().prepare("select count(*) as n from stocks").get() as {
    n: number;
  };
  return row.n;
}

export type StockWithPrice = Stock & {
  close: number | null;
  price_date: string | null;
};

export function searchStocks(query = "", limit = 100): StockWithPrice[] {
  // 並び順は証券コード順(中立的順序)のみ
  const like = `%${query}%`;
  return plain<StockWithPrice>(
    getDb()
      .prepare(
        `select s.code, s.name, s.market, p.close, p.date as price_date
         from stocks s
         left join (select code, max(date) as date from daily_prices group by code) m
           on m.code = s.code
         left join daily_prices p on p.code = m.code and p.date = m.date
         where s.code like ? or s.name like ?
         order by s.code limit ?`
      )
      .all(like, like, limit)
  );
}

export function getStock(code: string): Stock | undefined {
  return plainOne<Stock>(
    getDb().prepare("select code, name, market from stocks where code = ?").get(code)
  );
}

export function listSignalTypes(): SignalType[] {
  return plain<SignalType>(
    getDb()
      .prepare(
        "select id, name, description, origin, category, is_premium from signal_types order by category, id"
      )
      .all()
  );
}

export function recentSignalEvents(limit = 100, code?: string): SignalEvent[] {
  // 並び順は検知日降順・証券コード順(中立的順序)のみ
  const base = `
    select e.id, e.code, s.name as stock_name, e.signal_type,
           t.name as signal_name, t.description, t.category, t.origin,
           t.is_premium, e.date, e.detail,
           e.return_1d_pct, e.return_1d_yen, e.return_2d_pct, e.return_2d_yen,
           e.return_3d_pct, e.return_3d_yen
    from signal_events e
    join stocks s on s.code = e.code
    join signal_types t on t.id = e.signal_type`;
  if (code) {
    return plain<SignalEvent>(
      getDb()
        .prepare(`${base} where e.code = ? order by e.date desc, e.code limit ?`)
        .all(code, limit)
    );
  }
  return plain<SignalEvent>(
    getDb().prepare(`${base} order by e.date desc, e.code limit ?`).all(limit)
  );
}

export function getPrices(code: string, limit = 500): PriceRow[] {
  return plain<PriceRow>(
    getDb()
      .prepare(
        "select date, open, high, low, close, volume from daily_prices where code = ? order by date desc limit ?"
      )
      .all(code, limit)
  ).reverse();
}

export function getIndicators(code: string, limit = 500): IndicatorRow[] {
  return plain<IndicatorRow>(
    getDb()
      .prepare(
        `select date, rsi14, sma5, sma25, sma75, macd, macd_signal,
                volume_ratio20, kairi25
         from daily_indicators where code = ? order by date desc limit ?`
      )
      .all(code, limit)
  ).reverse();
}

const STAT_SORT_COLUMNS: Record<string, string> = {
  count: "st.count",
  up_ratio: "st.up_ratio_pct",
  mean: "st.mean_return_pct",
};

export function getSignalStats(
  holdDays = 3,
  sort: "count" | "up_ratio" | "mean" = "count"
): SignalStat[] {
  // 並び順はユーザーが選択した統計量の降順(過去の統計的事実の整列)
  const col = STAT_SORT_COLUMNS[sort] ?? STAT_SORT_COLUMNS.count;
  return plain<SignalStat>(
    getDb()
      .prepare(
        `select st.signal_type, t.name as signal_name, t.category,
                st.hold_days, st.count, st.up_count, st.down_count,
                st.up_ratio_pct, st.mean_return_pct, st.median_return_pct
         from signal_stats st join signal_types t on t.id = st.signal_type
         where st.hold_days = ?
         order by ${col} desc, st.signal_type`
      )
      .all(holdDays)
  );
}

export type SignalStatDetail = SignalStat & {
  max_gain_pct: number | null;
  max_loss_pct: number | null;
  histogram: { bucket: string; count: number }[];
  recent_occurrences: {
    code: string;
    name: string;
    date: string;
    return_pct: number;
  }[];
};

export function getSignalStatDetail(
  signalType: string,
  holdDays: number
): SignalStatDetail | null {
  const row = getDb()
    .prepare(
      `select st.signal_type, t.name as signal_name, t.category,
              st.hold_days, st.count, st.up_count, st.down_count,
              st.up_ratio_pct, st.mean_return_pct, st.median_return_pct,
              st.max_gain_pct, st.max_loss_pct, st.histogram, st.recent_occurrences
       from signal_stats st join signal_types t on t.id = st.signal_type
       where st.signal_type = ? and st.hold_days = ?`
    )
    .get(signalType, holdDays) as Record<string, unknown> | undefined;
  if (!row) return null;
  const r = { ...row } as SignalStatDetail & {
    histogram: unknown;
    recent_occurrences: unknown;
  };
  r.histogram = JSON.parse((row.histogram as string) ?? "[]");
  r.recent_occurrences = JSON.parse((row.recent_occurrences as string) ?? "[]");
  return r as SignalStatDetail;
}

export type NewsItem = {
  id: number;
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  tags: string | null;
};

export function newsList(limit = 300): NewsItem[] {
  return plain<NewsItem>(
    getDb()
      .prepare(
        "select id, title, url, source_name, published_at, tags from news_links " +
          "order by published_at desc, id desc limit ?"
      )
      .all(limit)
  );
}

export function newsSources(): string[] {
  return (
    getDb()
      .prepare(
        "select distinct source_name from news_links order by source_name"
      )
      .all() as unknown as { source_name: string }[]
  ).map((r) => r.source_name);
}

export function recentNews(limit = 10): NewsItem[] {
  const rows = plain<NewsItem>(
    getDb()
      .prepare(
        "select id, title, url, source_name, published_at, tags from news_links " +
          "order by published_at desc, id desc limit ?"
      )
      .all(limit * 2)
  );
  // 同一タイトルの重複(媒体のURL違い再配信)を除去
  const seen = new Set<string>();
  return rows
    .filter((r) => !seen.has(r.title) && (seen.add(r.title), true))
    .slice(0, limit);
}

export function recentSignalEventsWithResult(limit = 15): SignalEvent[] {
  // 3営業日が経過し実績が確定した検知(検知日降順)
  return plain<SignalEvent>(
    getDb()
      .prepare(
        `select e.id, e.code, s.name as stock_name, e.signal_type,
                t.name as signal_name, t.description, t.category, t.origin,
                t.is_premium, e.date, e.detail,
                e.return_1d_pct, e.return_1d_yen, e.return_2d_pct, e.return_2d_yen,
                e.return_3d_pct, e.return_3d_yen
         from signal_events e
         join stocks s on s.code = e.code
         join signal_types t on t.id = e.signal_type
         where e.return_1d_pct is not null
         order by e.date desc, e.code limit ?`
      )
      .all(limit)
  );
}

export function recentCalendarEvents(limit = 30): CalendarEvent[] {
  return plain<CalendarEvent>(
    getDb()
      .prepare(
        "select event_type, date, title, body from calendar_events order by date desc limit ?"
      )
      .all(limit)
  );
}

export function latestPrice(code: string): PriceRow | undefined {
  return plainOne<PriceRow>(
    getDb()
      .prepare(
        "select date, open, high, low, close, volume from daily_prices where code = ? order by date desc limit 1"
      )
      .get(code)
  );
}
