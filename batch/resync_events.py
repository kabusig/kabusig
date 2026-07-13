"""Supabase の signal_events を一旦全削除し、ローカルの最新版だけを入れ直す。

株価ソース切替(yfinance→J-Quants)で、古い検知が upsert では消えず残るため、
一度クリアして現行データのみに揃える(一回限りのメンテナンス用)。
"""
from __future__ import annotations

import json

from storage import SqliteStorage
from supabase_client import SupabaseClient


def main():
    sq = SqliteStorage()
    sb = SupabaseClient()

    print("delete Supabase signal_events ...")
    sb.delete("signal_events", "id=gt.0")

    cur = sq.conn.execute(
        "select code, signal_type, date, detail, "
        "return_1d_pct, return_1d_yen, return_2d_pct, return_2d_yen, "
        "return_3d_pct, return_3d_yen from signal_events")
    cols = [c[0] for c in cur.description]
    rows = []
    for r in cur.fetchall():
        d = dict(zip(cols, r))
        d["detail"] = json.loads(d["detail"] or "{}")
        rows.append(d)
    print(f"re-push {len(rows)} events ...")
    n = sb.upsert("signal_events", rows, "code,signal_type,date")
    print(f"resync_events done: {n}")


if __name__ == "__main__":
    main()
