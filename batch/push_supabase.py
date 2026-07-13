"""ローカルSQLite(計算結果)→ Supabase(配信用DB)同期バッチ。

アーキテクチャ: バッチはSQLiteを作業領域として計算し、Webが読む
Supabaseへ結果を同期する(計算と配信の分離)。冪等。

【容量方針】Supabase無料枠(500MB)に収めるため、重いテーブル(株価・指標・
シグナル)はクラウドには「直近◯日分」だけ置く。5年分の全履歴は手元(SQLite)に
残るので統計・バックテストの計算は影響を受けない。古い行は毎回prune(削除)する
ので、時間が経ってもクラウドDBは太らない。

usage:
  python push_supabase.py           # 増分(直近数日 + マスタ・統計)
  python push_supabase.py --full    # 保持期間内を全同期(初回スリム投入)
  python push_supabase.py --days 30 # 増分同期の日数指定
"""
from __future__ import annotations

import argparse
import json
from datetime import date, timedelta

from storage import SqliteStorage
from supabase_client import SupabaseClient

# クラウドに保持する期間(手元には5年分すべて残る)
PRICE_RETENTION_DAYS = 400   # チャート表示に必要な直近約270営業日 + 余裕
EVENT_RETENTION_DAYS = 300    # シグナル履歴表示用(約10ヶ月)


def rows_from(conn, sql, params=()):
    cur = conn.execute(sql, params)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def cutoff(days: int) -> str:
    return (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--full", action="store_true")
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()

    sq = SqliteStorage()
    sb = SupabaseClient()

    price_floor = cutoff(PRICE_RETENTION_DAYS)
    event_floor = cutoff(EVENT_RETENTION_DAYS)
    # 増分同期では直近days分のみ送る(保持期間の下限は常に適用)
    incr = None if args.full else cutoff(args.days)
    price_since = price_floor if incr is None else max(incr, price_floor)
    event_since = event_floor if incr is None else max(incr, event_floor)

    # マスタ系は常に全量(軽い)
    stocks = rows_from(sq.conn, "select code, name, market from stocks")
    print(f"stocks: {sb.upsert('stocks', stocks, 'code')}")

    types_ = rows_from(sq.conn,
                       "select id, name, description, origin, category, "
                       "cast(is_premium as int) as is_premium from signal_types")
    for t in types_:
        t["is_premium"] = bool(t["is_premium"])
    print(f"signal_types: {sb.upsert('signal_types', types_, 'id')}")

    # 統計は全量入れ替え(165行と軽量。histogram/recent_occurrencesはjsonb)
    stats = rows_from(sq.conn,
                      "select signal_type, hold_days, count, up_count, down_count, "
                      "up_ratio_pct, mean_return_pct, median_return_pct, "
                      "max_gain_pct, max_loss_pct, histogram, recent_occurrences "
                      "from signal_stats")
    for s in stats:
        s["histogram"] = json.loads(s["histogram"] or "[]")
        s["recent_occurrences"] = json.loads(s["recent_occurrences"] or "[]")
    print(f"signal_stats: {sb.upsert('signal_stats', stats, 'signal_type,hold_days')}")

    # 時系列(保持期間内のみ)
    prices = rows_from(sq.conn,
                       "select code, date, open, high, low, close, volume "
                       f"from daily_prices where date >= '{price_since}'")
    print(f"daily_prices: {sb.upsert('daily_prices', prices, 'code,date')}")

    inds = rows_from(sq.conn,
                     f"select * from daily_indicators where date >= '{price_since}'")
    print(f"daily_indicators: {sb.upsert('daily_indicators', inds, 'code,date')}")

    events = rows_from(sq.conn,
                       "select code, signal_type, date, detail, "
                       "return_1d_pct, return_1d_yen, return_2d_pct, return_2d_yen, "
                       "return_3d_pct, return_3d_yen "
                       f"from signal_events where date >= '{event_since}'")
    for e in events:
        e["detail"] = json.loads(e["detail"] or "{}")
    print(f"signal_events: {sb.upsert('signal_events', events, 'code,signal_type,date')}")

    cal = rows_from(sq.conn,
                    "select event_type, date, title, body from calendar_events "
                    f"where date >= '{cutoff(400)}'")
    print(f"calendar_events: {sb.upsert('calendar_events', cal, 'event_type,date')}")

    news = rows_from(sq.conn,
                     "select title, url, source_name, published_at, tags "
                     f"from news_links where created_at >= '{cutoff(60)}'")
    for n in news:
        n["tags"] = json.loads(n["tags"] or "[]")
    print(f"news_links: {sb.upsert('news_links', news, 'url', ignore_duplicates=True)}")

    earnings = rows_from(sq.conn,
                         "select code, announce_date, fiscal_quarter from earnings_schedule")
    if earnings:
        print(f"earnings: {sb.upsert('earnings_schedule', earnings, 'code,announce_date')}")

    # 古い行のprune(保持期間より前を削除。日次では少量なので高速)
    prune_old(sb, price_floor, event_floor)

    print("push_supabase done")


def prune_old(sb: SupabaseClient, price_floor: str, event_floor: str):
    """保持期間より古いクラウド上の行を削除し、DBを太らせない。"""
    for table, floor in (
        ("daily_prices", price_floor),
        ("daily_indicators", price_floor),
        ("signal_events", event_floor),
    ):
        try:
            sb.delete(table, f"date=lt.{floor}")
            print(f"prune {table}: < {floor}")
        except Exception as e:  # noqa: BLE001
            # 初回など削除量が多すぎてタイムアウトする場合はSQLエディタのTRUNCATEで対応
            print(f"prune {table} skipped: {str(e)[:80]}")


if __name__ == "__main__":
    main()
