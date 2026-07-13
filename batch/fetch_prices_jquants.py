"""株価取得バッチ(フェーズ2: J-Quants API v2、東証グループ公式)。

yfinance(非公式)の代替。JQUANTS_API_KEY(または JQUANTS_REFRESH_TOKEN)設定で使用可。
- v2 は APIキー方式(x-api-key ヘッダー)
- 調整済み価格(AdjO/AdjH/AdjL/AdjC/AdjVo)を使用(株式分割で指標が飛ばないように)
- Code は5桁("72030")で返るため先頭4桁("7203")に正規化

usage:
  python fetch_prices_jquants.py --date 2026-07-10  # 指定日の全銘柄(日次バッチ用・1リクエスト)
  python fetch_prices_jquants.py --bulk             # DB全銘柄の全履歴(初期投入用)
  python fetch_prices_jquants.py --code 7203        # 指定銘柄の全履歴
"""
from __future__ import annotations

import argparse
import sys
import time

import pandas as pd
import requests

import config
from storage import get_storage

BASE = config.JQUANTS_BASE


def _headers() -> dict:
    if not config.JQUANTS_API_KEY:
        print("JQUANTS_API_KEY 未設定。フェーズ1は fetch_prices.py(yfinance)を使用",
              file=sys.stderr)
        sys.exit(1)
    return {"x-api-key": config.JQUANTS_API_KEY}


def _to_frame(bars: list[dict]) -> dict[str, pd.DataFrame]:
    """v2 bars レスポンス → 銘柄コード別(4桁)のOHLCV DataFrame(調整済み)。"""
    rows = []
    for b in bars:
        if b.get("AdjC") is None:
            continue
        rows.append({
            "code": str(b["Code"])[:4],
            "date": pd.Timestamp(b["Date"]),
            "open": b.get("AdjO"),
            "high": b.get("AdjH"),
            "low": b.get("AdjL"),
            "close": b.get("AdjC"),
            "volume": b.get("AdjVo") or 0,
        })
    if not rows:
        return {}
    df = pd.DataFrame(rows).dropna(subset=["open", "high", "low", "close"])
    return {
        code: g.set_index("date")[["open", "high", "low", "close", "volume"]].sort_index()
        for code, g in df.groupby("code")
    }


def _get(headers: dict, params: dict) -> list[dict]:
    """bars/daily をページネーション対応で取得。"""
    out, pagination_key = [], None
    while True:
        p = dict(params)
        if pagination_key:
            p["pagination_key"] = pagination_key
        r = requests.get(f"{BASE}/equities/bars/daily", headers=headers,
                         params=p, timeout=90)
        r.raise_for_status()
        body = r.json()
        out.extend(body.get("data", []))
        pagination_key = body.get("pagination_key")
        if not pagination_key:
            return out
        time.sleep(config.JQUANTS_RATE_LIMIT_SEC)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=None, help="対象日 YYYY-MM-DD(全銘柄)")
    parser.add_argument("--code", default=None, help="銘柄コード(全履歴)")
    parser.add_argument("--bulk", action="store_true",
                        help="DB内の全銘柄の全履歴を取得(初期投入)")
    args = parser.parse_args()

    storage = get_storage()
    headers = _headers()
    watch = set(storage.list_codes())

    if args.date:
        bars = _get(headers, {"date": args.date.replace("-", "")})
        frames = _to_frame(bars)
        n = 0
        for code, df in frames.items():
            if code in watch:
                storage.upsert_prices(code, df)
                n += 1
        print(f"fetch_prices_jquants(date={args.date}) done: {n} stocks")
        return

    codes = [args.code] if args.code else sorted(watch)
    ok, ng = 0, []
    for i, code in enumerate(codes, 1):
        try:
            bars = _get(headers, {"code": code})
            frames = _to_frame(bars)
            df = frames.get(code)
            if df is None or df.empty:
                ng.append(code)
            else:
                storage.upsert_prices(code, df)
                ok += 1
        except Exception as e:  # noqa: BLE001
            ng.append(code)
            print(f"  {code}: ERROR {e}", file=sys.stderr)
        if i % 100 == 0:
            print(f"  progress: {i}/{len(codes)} (ok={ok})")
        time.sleep(config.JQUANTS_RATE_LIMIT_SEC)
    print(f"fetch_prices_jquants done: ok={ok} ng={len(ng)} {ng[:20]}")


if __name__ == "__main__":
    main()
