"""ストレージ抽象化レイヤー。

フェーズ1はローカル SQLite、フェーズ2以降は Supabase(PostgREST) に
環境変数 DATA_BACKEND で切り替える。スキーマは supabase/migrations の
DDL と対応関係を保つこと。
"""
from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime
from typing import Iterable

import pandas as pd

import config

SQLITE_SCHEMA = """
create table if not exists stocks (
  code text primary key,
  name text not null,
  market text,
  updated_at text default (datetime('now'))
);
create table if not exists daily_prices (
  code text, date text,
  open real, high real, low real, close real,
  volume integer,
  primary key (code, date)
);
create table if not exists daily_indicators (
  code text, date text,
  rsi14 real,
  sma5 real, sma25 real, sma75 real, sma200 real,
  volume_ratio20 real,
  macd real, macd_signal real,
  bb_upper real, bb_lower real,
  stoch_k real, stoch_d real,
  kairi25 real,
  tenkan real, kijun real, senkou_a real, senkou_b real,
  atr14 real,
  primary key (code, date)
);
create table if not exists signal_types (
  id text primary key,
  name text not null,
  description text not null,
  origin text,
  category text not null default 'classic',
  is_premium integer default 0
);
create table if not exists signal_events (
  id integer primary key autoincrement,
  code text,
  signal_type text,
  date text not null,
  detail text,
  created_at text default (datetime('now')),
  unique (code, signal_type, date)
);
create table if not exists earnings_schedule (
  code text, announce_date text, fiscal_quarter text,
  primary key (code, announce_date)
);
create table if not exists calendar_events (
  id integer primary key autoincrement,
  event_type text not null,
  date text not null,
  title text not null,
  body text not null,
  unique (event_type, date)
);
create table if not exists notification_logs (
  id integer primary key autoincrement,
  user_id text,
  signal_event_id integer,
  channel text default 'line',
  sent_at text default (datetime('now')),
  unique (user_id, signal_event_id)
);
create table if not exists news_links (
  id integer primary key autoincrement,
  title text not null,
  url text not null unique,
  source_name text not null,
  published_at text,
  tags text,
  created_at text default (datetime('now'))
);
"""


def _d(v) -> str:
    if isinstance(v, (date, datetime)):
        return v.strftime("%Y-%m-%d")
    return str(v)[:10]


class SqliteStorage:
    def __init__(self, path: str | None = None):
        self.path = path or config.SQLITE_PATH
        self.conn = sqlite3.connect(self.path)
        self.conn.executescript(SQLITE_SCHEMA)
        self.conn.commit()

    # ---- マスタ ----
    def upsert_stocks(self, rows: Iterable[tuple[str, str, str]]):
        self.conn.executemany(
            "insert into stocks(code,name,market) values(?,?,?) "
            "on conflict(code) do update set name=excluded.name, market=excluded.market",
            list(rows),
        )
        self.conn.commit()

    def upsert_signal_types(self, rows: Iterable[dict]):
        self.conn.executemany(
            "insert into signal_types(id,name,description,origin,category,is_premium) "
            "values(:id,:name,:description,:origin,:category,:is_premium) "
            "on conflict(id) do update set name=excluded.name, description=excluded.description, "
            "origin=excluded.origin, category=excluded.category, is_premium=excluded.is_premium",
            list(rows),
        )
        self.conn.commit()

    # ---- 株価 ----
    def upsert_prices(self, code: str, df: pd.DataFrame):
        """df: index=DatetimeIndex, columns=open/high/low/close/volume"""
        rows = [
            (code, _d(idx), float(r.open), float(r.high), float(r.low),
             float(r.close), int(r.volume))
            for idx, r in df.iterrows()
        ]
        self.conn.executemany(
            "insert into daily_prices(code,date,open,high,low,close,volume) "
            "values(?,?,?,?,?,?,?) on conflict(code,date) do update set "
            "open=excluded.open, high=excluded.high, low=excluded.low, "
            "close=excluded.close, volume=excluded.volume",
            rows,
        )
        self.conn.commit()

    def get_prices(self, code: str) -> pd.DataFrame:
        df = pd.read_sql_query(
            "select date, open, high, low, close, volume from daily_prices "
            "where code = ? order by date",
            self.conn, params=(code,), parse_dates=["date"], index_col="date",
        )
        return df

    def list_codes(self) -> list[str]:
        cur = self.conn.execute("select code from stocks order by code")
        return [r[0] for r in cur.fetchall()]

    # ---- 指標 ----
    def upsert_indicators(self, code: str, df: pd.DataFrame):
        cols = ["rsi14", "sma5", "sma25", "sma75", "sma200", "volume_ratio20",
                "macd", "macd_signal", "bb_upper", "bb_lower", "stoch_k",
                "stoch_d", "kairi25", "tenkan", "kijun", "senkou_a",
                "senkou_b", "atr14"]
        rows = []
        for idx, r in df.iterrows():
            vals = [None if pd.isna(r.get(c)) else float(r.get(c)) for c in cols]
            rows.append((code, _d(idx), *vals))
        placeholders = ",".join(["?"] * (2 + len(cols)))
        updates = ",".join(f"{c}=excluded.{c}" for c in cols)
        self.conn.executemany(
            f"insert into daily_indicators(code,date,{','.join(cols)}) "
            f"values({placeholders}) on conflict(code,date) do update set {updates}",
            rows,
        )
        self.conn.commit()

    # ---- シグナル ----
    def insert_signal_events(self, events: Iterable[dict]) -> int:
        """events: {code, signal_type, date, detail(dict)} — 重複は無視(冪等)"""
        n = 0
        for e in events:
            cur = self.conn.execute(
                "insert or ignore into signal_events(code,signal_type,date,detail) "
                "values(?,?,?,?)",
                (e["code"], e["signal_type"], _d(e["date"]),
                 json.dumps(e.get("detail", {}), ensure_ascii=False)),
            )
            n += cur.rowcount
        self.conn.commit()
        return n

    def get_signal_events(self, on_date: str | None = None) -> list[dict]:
        q = ("select e.id, e.code, s.name as stock_name, e.signal_type, "
             "t.name as signal_name, t.description, e.date, e.detail "
             "from signal_events e join stocks s on s.code=e.code "
             "join signal_types t on t.id=e.signal_type")
        params: tuple = ()
        if on_date:
            q += " where e.date = ?"
            params = (on_date,)
        q += " order by e.date desc, e.code"
        cur = self.conn.execute(q, params)
        cols = [c[0] for c in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]

    # ---- 暦イベント ----
    def upsert_calendar_events(self, events: Iterable[dict]) -> int:
        n = 0
        for e in events:
            cur = self.conn.execute(
                "insert or ignore into calendar_events(event_type,date,title,body) "
                "values(?,?,?,?)",
                (e["event_type"], _d(e["date"]), e["title"], e["body"]),
            )
            n += cur.rowcount
        self.conn.commit()
        return n

    # ---- 通知ログ ----
    def log_notification(self, user_id: str, signal_event_id: int) -> bool:
        cur = self.conn.execute(
            "insert or ignore into notification_logs(user_id,signal_event_id) values(?,?)",
            (user_id, signal_event_id),
        )
        self.conn.commit()
        return cur.rowcount > 0


class SupabaseStorage:
    """フェーズ2: PostgREST 経由の Supabase バックエンド(実装スタブ)。

    SqliteStorage と同一インターフェースを実装し、requests で
    {SUPABASE_URL}/rest/v1/... に service role key を付与して upsert する。
    """

    def __init__(self):
        raise NotImplementedError(
            "フェーズ2で実装。DATA_BACKEND=sqlite を使用してください。")


def get_storage():
    if config.DATA_BACKEND == "supabase":
        return SupabaseStorage()
    return SqliteStorage()
