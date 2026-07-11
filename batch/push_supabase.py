"""ローカルSQLite(計算結果)→ Supabase(配信用DB)同期バッチ。

アーキテクチャ: バッチはSQLiteを作業領域として計算し、Webが読む
Supabaseへ結果を同期する(計算と配信の分離)。冪等。

usage:
  python push_supabase.py           # 増分(直近7日分の価格/指標/イベント + マスタ全量)
  python push_supabase.py --full    # 初回全量同期
  python push_supabase.py --days 30 # 同期日数指定
"""
from __future__ import annotations

import argparse
import json
from datetime import date, timedelta

from storage import SqliteStorage
from supabase_client import SupabaseClient


def rows_from(conn, sql, params=()):
    cur = conn.execute(sql, params)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true")
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()

    sq = SqliteStorage()
    sb = SupabaseClient()
    since = None if args.full else (
        date.today() - timedelta(days=args.days)).strftime("%Y-%m-%d")

    def date_filter(col="date"):
        return "" if since is None else f" where {col} >= '{since}'"

    # マスタ系は常に全量
    stocks = rows_from(sq.conn, "select code, name, market from stocks")
    print(f"stocks: {sb.upsert('stocks', stocks, 'code')}")

    types_ = rows_from(sq.conn,
                       "select id, name, description, origin, category, "
                       "cast(is_premium as int) as is_premium from signal_types")
    for t in types_:
        t["is_premium"] = bool(t["is_premium"])
    print(f"signal_types: {sb.upsert('signal_types', types_, 'id')}")

    # 統計は全量入れ替え(histogram/recent_occurrencesはjsonb)
    stats = rows_from(sq.conn,
                      "select signal_type, hold_days, count, up_count, down_count, "
                      "up_ratio_pct, mean_return_pct, median_return_pct, "
                      "max_gain_pct, max_loss_pct, histogram, recent_occurrences "
                      "from signal_stats")
    for s in stats:
        s["histogram"] = json.loads(s["histogram"] or "[]")
        s["recent_occurrences"] = json.loads(s["recent_occurrences"] or "[]")
    print(f"signal_stats: {sb.upsert('signal_stats', stats, 'signal_type,hold_days')}")

    # 時系列(増分)
    prices = rows_from(sq.conn,
                       "select code, date, open, high, low, close, volume "
                       f"from daily_prices{date_filter()}")
    print(f"daily_prices: {sb.upsert('daily_prices', prices, 'code,date')}")

    inds = rows_from(sq.conn, f"select * from daily_indicators{date_filter()}")
    print(f"daily_indicators: {sb.upsert('daily_indicators', inds, 'code,date')}")

    events = rows_from(sq.conn,
                       "select code, signal_type, date, detail, "
                       "return_1d_pct, return_1d_yen, return_2d_pct, return_2d_yen, "
                       "return_3d_pct, return_3d_yen "
                       f"from signal_events{date_filter()}")
    for e in events:
        e["detail"] = json.loads(e["detail"] or "{}")
    print(f"signal_events: {sb.upsert('signal_events', events, 'code,signal_type,date')}")
    # 実績(return_*)は後から埋まるため、増分同期でも過去30日分は再送して更新する
    if since is not None:
        since30 = (date.today() - timedelta(days=30)).strftime("%Y-%m-%d")
        backfill = rows_from(sq.conn,
                             "select code, signal_type, date, detail, "
                             "return_1d_pct, return_1d_yen, return_2d_pct, return_2d_yen, "
                             "return_3d_pct, return_3d_yen "
                             f"from signal_events where date >= '{since30}'")
        for e in backfill:
            e["detail"] = json.loads(e["detail"] or "{}")
        print(f"signal_events(実績更新): "
              f"{sb.upsert('signal_events', backfill, 'code,signal_type,date')}")

    cal = rows_from(sq.conn,
                    f"select event_type, date, title, body from calendar_events{date_filter()}")
    print(f"calendar_events: {sb.upsert('calendar_events', cal, 'event_type,date')}")

    news = rows_from(sq.conn,
                     "select title, url, source_name, published_at, tags "
                     f"from news_links{date_filter('created_at')}")
    for n in news:
        n["tags"] = json.loads(n["tags"] or "[]")
    print(f"news_links: {sb.upsert('news_links', news, 'url', ignore_duplicates=True)}")

    earnings = rows_from(sq.conn,
                         "select code, announce_date, fiscal_quarter from earnings_schedule")
    if earnings:
        print(f"earnings: {sb.upsert('earnings_schedule', earnings, 'code,announce_date')}")

    print("push_supabase done")


if __name__ == "__main__":
    main()
