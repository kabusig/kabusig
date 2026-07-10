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
           t.is_premium, e.date, e.detail
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
