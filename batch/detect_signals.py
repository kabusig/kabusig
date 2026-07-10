"""シグナル判定バッチ。大引け後に実行。

- 全銘柄 × 全シグナル定義を評価し signal_events に upsert(冪等)
- 暦アノマリーも当日分を calendar_events に登録
- --backfill で過去全日分を一括検知(初回セットアップ・バックテスト用)

usage: python detect_signals.py [--backfill] [--date YYYY-MM-DD]
"""
from __future__ import annotations

import argparse
from datetime import date, timedelta

import indicators
from anomalies import anomalies_for_date, backfill as anomaly_backfill
from signals import ALL_SIGNALS, seed_rows
from storage import get_storage


def detect_for_code(storage, code: str, only_date: str | None) -> list[dict]:
    prices = storage.get_prices(code)
    if len(prices) < 30:
        return []
    df = indicators.compute_all(prices)
    events = []
    for sig in ALL_SIGNALS:
        for e in sig.detect(df):
            e["code"] = code
            e_date = e["date"].strftime("%Y-%m-%d")
            if only_date and e_date != only_date:
                continue
            events.append(e)
    return events


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backfill", action="store_true",
                        help="過去全期間のシグナルを一括検知")
    parser.add_argument("--date", default=None, help="対象日(既定: 最新営業日)")
    args = parser.parse_args()

    storage = get_storage()
    storage.upsert_signal_types(seed_rows())

    total = 0
    for code in storage.list_codes():
        only_date = None if args.backfill else (args.date or _latest_date(storage, code))
        events = detect_for_code(storage, code, only_date)
        n = storage.insert_signal_events(events)
        total += n
        if n:
            print(f"  {code}: {n} new events")

    # 暦アノマリー
    if args.backfill:
        cal = anomaly_backfill(date.today() - timedelta(days=730), date.today())
    else:
        target = date.fromisoformat(args.date) if args.date else date.today()
        cal = anomalies_for_date(target)
    nc = storage.upsert_calendar_events(cal)
    print(f"detect_signals done: {total} signal events, {nc} calendar events")


def _latest_date(storage, code: str) -> str | None:
    prices = storage.get_prices(code)
    if prices.empty:
        return None
    return prices.index[-1].strftime("%Y-%m-%d")


if __name__ == "__main__":
    main()
