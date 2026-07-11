"""銘柄マスタ取得バッチ(JPX公式の上場銘柄一覧 → 東証プライム全銘柄)。

JPXが公開している「東証上場銘柄一覧」(data_j.xls)をダウンロードし、
プライム市場の内国株式のみを stocks テーブルへ upsert する。
取得失敗時は stocklist.STOCKS(主要45銘柄)にフォールバック。

usage: python fetch_stocklist.py
"""
from __future__ import annotations

import io
import sys

import pandas as pd
import requests

import stocklist
from storage import get_storage

JPX_URL = (
    "https://www.jpx.co.jp/markets/statistics-equities/misc/"
    "tvdivq0000001vg2-att/data_j.xls"
)

# JPXの区分表記は全角括弧
TARGET_SEGMENTS = ["プライム（内国株式）"]


def fetch_jpx_list() -> list[tuple[str, str, str]]:
    r = requests.get(JPX_URL, timeout=60,
                     headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    df = pd.read_excel(io.BytesIO(r.content))
    # 列: 日付, コード, 銘柄名, 市場・商品区分, 33業種コード, ...
    df.columns = [str(c).strip() for c in df.columns]
    code_col = next(c for c in df.columns if "コード" in c and "業種" not in c)
    name_col = next(c for c in df.columns if "銘柄名" in c)
    seg_col = next(c for c in df.columns if "市場" in c)

    rows = []
    for _, r_ in df.iterrows():
        seg = str(r_[seg_col]).strip()
        if seg not in TARGET_SEGMENTS:
            continue
        code = str(r_[code_col]).strip()
        if not (len(code) == 4 and code.isascii()):
            continue  # 普通株4桁のみ(優先株等の5桁は除外)
        market = seg.replace("（内国株式）", "")
        rows.append((code, str(r_[name_col]).strip(), market))
    rows.sort(key=lambda x: x[0])
    return rows


def main():
    storage = get_storage()
    try:
        rows = fetch_jpx_list()
        print(f"JPX一覧取得: プライム {len(rows)} 銘柄")
    except Exception as e:  # noqa: BLE001
        print(f"JPX一覧取得失敗、フォールバック使用: {e}", file=sys.stderr)
        rows = stocklist.STOCKS
    storage.upsert_stocks(rows)
    print(f"fetch_stocklist done: {len(rows)} stocks")


if __name__ == "__main__":
    main()
