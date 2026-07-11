"""シグナル結果集計バッチ。

1. 各シグナル検知について「検知日終値 → 3営業日後終値」の騰落(円・%)を
   signal_events に記録する(過去の事実の記録。将来予測ではない)
2. シグナル種別ごとの過去統計(発生回数・上昇した割合・平均騰落率等)を
   保有期間 1/3/5/20 営業日で signal_stats に集計する

detect_signals.py の後に実行する。冪等(再実行しても結果は同じ)。

usage: python calc_signal_results.py
"""
from __future__ import annotations

from statistics import median

from storage import get_storage

HOLD_DAYS = [1, 3, 5, 20]


def main():
    storage = get_storage()
    conn = storage.conn

    events = conn.execute(
        "select id, code, signal_type, date, return_3d_pct from signal_events "
        "order by code"
    ).fetchall()
    print(f"events: {len(events)}")

    # 銘柄ごとに終値系列をロードして日付→位置を引けるようにする
    updates: list[tuple[float, float, int]] = []
    stats: dict[tuple[str, int], list[float]] = {}
    cur_code, closes, pos_by_date = None, [], {}

    for ev_id, code, signal_type, date, r3d in events:
        if code != cur_code:
            rows = conn.execute(
                "select date, close from daily_prices where code=? order by date",
                (code,),
            ).fetchall()
            closes = [r[1] for r in rows]
            pos_by_date = {r[0]: i for i, r in enumerate(rows)}
            cur_code = code
        pos = pos_by_date.get(date)
        if pos is None or closes[pos] is None or closes[pos] <= 0:
            continue
        base = closes[pos]
        # 統計(全保有期間)
        for h in HOLD_DAYS:
            if pos + h < len(closes) and closes[pos + h] is not None:
                pct = (closes[pos + h] - base) / base * 100
                stats.setdefault((signal_type, h), []).append(pct)
        # 3営業日後の実績を signal_events に記録(未記録のもののみ)
        if r3d is None and pos + 3 < len(closes) and closes[pos + 3] is not None:
            yen = closes[pos + 3] - base
            updates.append((round(yen / base * 100, 3), round(yen, 2), ev_id))

    if updates:
        conn.executemany(
            "update signal_events set return_3d_pct=?, return_3d_yen=? where id=?",
            updates,
        )
    print(f"updated 3d results: {len(updates)}")

    # 統計テーブルを全面再構築
    conn.execute("delete from signal_stats")
    for (signal_type, h), vals in sorted(stats.items()):
        n = len(vals)
        up = sum(1 for v in vals if v > 0)
        conn.execute(
            "insert into signal_stats(signal_type, hold_days, count, up_count, "
            "down_count, up_ratio_pct, mean_return_pct, median_return_pct) "
            "values(?,?,?,?,?,?,?,?)",
            (signal_type, h, n, up, sum(1 for v in vals if v < 0),
             round(up / n * 100, 2), round(sum(vals) / n, 4),
             round(median(vals), 4)),
        )
    conn.commit()
    print(f"signal_stats rebuilt: {len(stats)} rows")


if __name__ == "__main__":
    main()
