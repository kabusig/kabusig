"""シグナル結果集計バッチ。

1. 各シグナル検知について「検知日終値 → 1/2/3営業日後終値」の騰落(円・%)を
   signal_events に記録する(過去の事実の記録。将来予測ではない)
2. シグナル種別ごとの過去統計(発生回数・上昇した割合・平均騰落率等)を
   保有期間 1/2/3/5/20 営業日で signal_stats に集計する

detect_signals.py の後に実行する。冪等(再実行しても結果は同じ)。

usage: python calc_signal_results.py
"""
from __future__ import annotations

import json
from statistics import median

from storage import get_storage

HOLD_DAYS = [1, 2, 3, 5, 20]
RESULT_DAYS = [1, 2, 3]  # signal_events に個別記録する日数


def build_histogram(vals: list[float]) -> list[dict]:
    """-10%〜+10%を2%刻み+両端オープンのヒストグラム。"""
    buckets = []
    for lo in range(-10, 10, 2):
        hi = lo + 2
        if lo == -10:
            n = sum(1 for v in vals if v < hi)
            label = f"<{hi}%"
        elif hi == 10:
            n = sum(1 for v in vals if v >= lo)
            label = f"{lo}%+"
        else:
            n = sum(1 for v in vals if lo <= v < hi)
            label = f"{lo}〜{hi}%"
        buckets.append({"bucket": label, "count": n})
    return buckets


def main():
    storage = get_storage()
    conn = storage.conn

    events = conn.execute(
        "select id, code, signal_type, date, return_1d_pct, return_2d_pct, "
        "return_3d_pct from signal_events order by code"
    ).fetchall()
    print(f"events: {len(events)}")

    names = dict(conn.execute("select code, name from stocks").fetchall())

    # 銘柄ごとに終値系列をロードして日付→位置を引けるようにする
    updates: dict[int, list[tuple[float, float, int]]] = {d: [] for d in RESULT_DAYS}
    stats: dict[tuple[str, int], list[float]] = {}
    occurrences: dict[tuple[str, int], list[dict]] = {}
    cur_code, closes, pos_by_date = None, [], {}

    for ev_id, code, signal_type, date, r1, r2, r3 in events:
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
                occurrences.setdefault((signal_type, h), []).append({
                    "code": code, "name": names.get(code, ""),
                    "date": date, "return_pct": round(pct, 3),
                })
        # 1/2/3営業日後の実績を signal_events に記録(未記録のもののみ)
        existing = {1: r1, 2: r2, 3: r3}
        for d in RESULT_DAYS:
            if existing[d] is None and pos + d < len(closes) \
                    and closes[pos + d] is not None:
                yen = closes[pos + d] - base
                updates[d].append(
                    (round(yen / base * 100, 3), round(yen, 2), ev_id))

    for d in RESULT_DAYS:
        if updates[d]:
            conn.executemany(
                f"update signal_events set return_{d}d_pct=?, "
                f"return_{d}d_yen=? where id=?",
                updates[d],
            )
        print(f"updated {d}d results: {len(updates[d])}")

    # 統計テーブルを全面再構築(分布・直近発生・最大値込み)
    conn.execute("delete from signal_stats")
    for (signal_type, h), vals in sorted(stats.items()):
        n = len(vals)
        up = sum(1 for v in vals if v > 0)
        occ = sorted(occurrences[(signal_type, h)],
                     key=lambda o: o["date"], reverse=True)[:20]
        conn.execute(
            "insert into signal_stats(signal_type, hold_days, count, up_count, "
            "down_count, up_ratio_pct, mean_return_pct, median_return_pct, "
            "max_gain_pct, max_loss_pct, histogram, recent_occurrences) "
            "values(?,?,?,?,?,?,?,?,?,?,?,?)",
            (signal_type, h, n, up, sum(1 for v in vals if v < 0),
             round(up / n * 100, 2), round(sum(vals) / n, 4),
             round(median(vals), 4), round(max(vals), 3), round(min(vals), 3),
             json.dumps(build_histogram(vals), ensure_ascii=False),
             json.dumps(occ, ensure_ascii=False)),
        )
    conn.commit()
    print(f"signal_stats rebuilt: {len(stats)} rows")


if __name__ == "__main__":
    main()
