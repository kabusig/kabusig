"""バックテスト計算エンジン。

「このシグナルは過去にどう機能したか」の統計的事実のみを算出する。
将来予測ではない(UI側で必ず注記を表示すること)。

- 各シグナル発生日について、発生翌営業日の始値→N営業日後終値の騰落率を計算
- 出力: 発生回数、上昇した割合、平均騰落率、中央値、最大上昇、最大下落、分布

usage: python backtest_engine.py --signal golden_cross --hold 5 [--code 7203]
"""
from __future__ import annotations

import argparse
import json
from statistics import median

import pandas as pd

from storage import get_storage


def run_backtest(storage, signal_type: str, hold_days: int = 5,
                 code: str | None = None, since: str | None = None) -> dict:
    events = [e for e in storage.get_signal_events()
              if e["signal_type"] == signal_type
              and (code is None or e["code"] == code)
              and (since is None or e["date"] >= since)]

    returns: list[dict] = []
    prices_cache: dict[str, pd.DataFrame] = {}
    for ev in events:
        c = ev["code"]
        if c not in prices_cache:
            prices_cache[c] = storage.get_prices(c)
        df = prices_cache[c]
        if df.empty:
            continue
        try:
            pos = df.index.get_loc(pd.Timestamp(ev["date"]))
        except KeyError:
            continue
        entry_pos, exit_pos = pos + 1, pos + 1 + hold_days
        if exit_pos >= len(df):
            continue  # 保有期間分のデータがまだない
        entry = float(df.iloc[entry_pos]["open"])
        exit_ = float(df.iloc[exit_pos]["close"])
        if entry <= 0:
            continue
        pct = (exit_ - entry) / entry * 100
        returns.append({"code": c, "date": ev["date"], "return_pct": round(pct, 3)})

    n = len(returns)
    if n == 0:
        return {"signal_type": signal_type, "hold_days": hold_days, "count": 0,
                "note": "対象期間に計測可能な発生がありません"}
    vals = [r["return_pct"] for r in returns]
    up = sum(1 for v in vals if v > 0)
    return {
        "signal_type": signal_type,
        "hold_days": hold_days,
        "count": n,
        "up_count": up,
        "down_count": sum(1 for v in vals if v < 0),
        "up_ratio_pct": round(up / n * 100, 1),   # 「上昇した割合」(勝率という語は使わない)
        "mean_return_pct": round(sum(vals) / n, 3),
        "median_return_pct": round(median(vals), 3),
        "max_gain_pct": round(max(vals), 3),
        "max_loss_pct": round(min(vals), 3),
        "occurrences": returns,
        "note": "過去の統計であり、将来の値動きを保証・示唆するものではありません",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--signal", required=True)
    parser.add_argument("--hold", type=int, default=5, choices=[1, 5, 20])
    parser.add_argument("--code", default=None)
    parser.add_argument("--since", default=None)
    args = parser.parse_args()

    storage = get_storage()
    result = run_backtest(storage, args.signal, args.hold, args.code, args.since)
    occ = result.pop("occurrences", [])
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if occ:
        print(f"(発生 {len(occ)} 件、直近5件: "
              f"{json.dumps(occ[:5], ensure_ascii=False)})")


if __name__ == "__main__":
    main()
