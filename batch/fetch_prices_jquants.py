"""株価取得バッチ(フェーズ2: J-Quants API、東証グループ公式)。

yfinance(非公式)の代替。JQUANTS_REFRESH_TOKEN 設定で使用可能。
- 無料プラン: データ12週間遅延・履歴2年・5リクエスト/分
  → レートリミット13秒間隔(config.JQUANTS_RATE_LIMIT_SEC)を厳守
- リアルタイム性が必要になったら Light プラン以上へ
- 調整済み価格(AdjustmentOpen/High/Low/Close, AdjustmentVolume)を使用

usage:
  python fetch_prices_jquants.py --date 2026-07-10   # 指定日の全銘柄(日次バッチ用)
  python fetch_prices_jquants.py --code 7203         # 指定銘柄の全期間(初期投入用)
"""
from __future__ import annotations

import argparse
import sys
import time

import pandas as pd
import requests

import config
from storage import get_storage

BASE = "https://api.jquants.com/v1"


def get_id_token() -> str:
    r = requests.post(f"{BASE}/token/auth_refresh",
                      params={"refreshtoken": config.JQUANTS_REFRESH_TOKEN},
                      timeout=30)
    r.raise_for_status()
    return r.json()["idToken"]


def fetch_quotes(headers: dict, *, code: str | None = None,
                 target_date: str | None = None) -> list[dict]:
    """日次株価。code または date のどちらかを指定。ページネーション対応。"""
    params: dict = {}
    if code:
        params["code"] = code
    if target_date:
        params["date"] = target_date.replace("-", "")
    quotes, pagination_key = [], None
    while True:
        if pagination_key:
            params["pagination_key"] = pagination_key
        r = requests.get(f"{BASE}/prices/daily_quotes",
                         headers=headers, params=params, timeout=60)
        r.raise_for_status()
        body = r.json()
        quotes.extend(body.get("daily_quotes", []))
        pagination_key = body.get("pagination_key")
        time.sleep(config.JQUANTS_RATE_LIMIT_SEC)  # 5req/分制限
        if not pagination_key:
            return quotes


def to_frame(quotes: list[dict]) -> dict[str, pd.DataFrame]:
    """J-Quantsレスポンス → 銘柄コード別のOHLCV DataFrame。"""
    rows = []
    for q in quotes:
        if q.get("AdjustmentClose") is None:
            continue
        rows.append({
            "code": str(q["Code"])[:4],
            "date": pd.Timestamp(q["Date"]),
            "open": q.get("AdjustmentOpen"),
            "high": q.get("AdjustmentHigh"),
            "low": q.get("AdjustmentLow"),
            "close": q.get("AdjustmentClose"),
            "volume": q.get("AdjustmentVolume") or 0,
        })
    if not rows:
        return {}
    df = pd.DataFrame(rows).dropna()
    return {
        code: g.set_index("date")[["open", "high", "low", "close", "volume"]]
        for code, g in df.groupby("code")
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=None, help="対象日 YYYY-MM-DD")
    parser.add_argument("--code", default=None, help="銘柄コード(全期間取得)")
    args = parser.parse_args()

    if not config.JQUANTS_REFRESH_TOKEN:
        print("JQUANTS_REFRESH_TOKEN 未設定。フェーズ1は fetch_prices.py(yfinance)を使用",
              file=sys.stderr)
        sys.exit(1)
    if not (args.date or args.code):
        parser.error("--date か --code を指定してください")

    storage = get_storage()
    watch = set(storage.list_codes())
    headers = {"Authorization": f"Bearer {get_id_token()}"}

    quotes = fetch_quotes(headers, code=args.code, target_date=args.date)
    frames = to_frame(quotes)
    n = 0
    for code, df in frames.items():
        if code in watch:
            storage.upsert_prices(code, df)
            n += 1
    print(f"fetch_prices_jquants done: {n} stocks, {len(quotes)} quotes")


if __name__ == "__main__":
    main()
