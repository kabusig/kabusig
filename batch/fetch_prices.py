"""株価取得バッチ(フェーズ1: yfinance)。

- 調整済み価格(auto_adjust=True)を使用(株式分割で指標が飛ばないように)
- yfinance は非公式ライブラリのため個人検証用。公開運用前に J-Quants へ移行する
  (fetch_prices_jquants.py として別実装、レートリミット13秒間隔厳守)

usage: python fetch_prices.py [--period 2y] [--codes 7203,6758]
"""
from __future__ import annotations

import argparse
import sys
import time

import pandas as pd

import stocklist
from storage import get_storage


def fetch_one(code: str, period: str = "2y") -> pd.DataFrame | None:
    import yfinance as yf
    t = yf.Ticker(stocklist.yf_ticker(code))
    df = t.history(period=period, interval="1d", auto_adjust=True)
    if df is None or df.empty:
        return None
    df = df.rename(columns={
        "Open": "open", "High": "high", "Low": "low",
        "Close": "close", "Volume": "volume",
    })[["open", "high", "low", "close", "volume"]]
    df.index = pd.to_datetime(df.index).tz_localize(None)
    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--period", default="2y")
    parser.add_argument("--codes", default="")
    args = parser.parse_args()

    storage = get_storage()
    storage.upsert_stocks(stocklist.STOCKS)
    codes = args.codes.split(",") if args.codes else [c for c, _, _ in stocklist.STOCKS]

    ok, ng = 0, []
    for code in codes:
        try:
            df = fetch_one(code, args.period)
            if df is None:
                ng.append(code)
                continue
            storage.upsert_prices(code, df)
            ok += 1
            print(f"  {code}: {len(df)} rows")
            time.sleep(0.5)  # 行儀よく
        except Exception as e:  # noqa: BLE001
            ng.append(code)
            print(f"  {code}: ERROR {e}", file=sys.stderr)
    print(f"fetch_prices done: ok={ok} ng={ng}")


if __name__ == "__main__":
    main()
