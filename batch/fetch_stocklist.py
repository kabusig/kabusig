"""銘柄マスタ取得バッチ(東証プライム全銘柄)。

優先順位:
1. J-Quants API v2 の equities/master(APIキー設定時。株価と同一ソースで整合)
2. JPX公式の「東証上場銘柄一覧」(data_j.xls)
3. stocklist.STOCKS(主要45銘柄・最終フォールバック)

usage: python fetch_stocklist.py
"""
from __future__ import annotations

import io
import sys

import pandas as pd
import requests

import config
import stocklist
from storage import get_storage

JPX_URL = (
    "https://www.jpx.co.jp/markets/statistics-equities/misc/"
    "tvdivq0000001vg2-att/data_j.xls"
)

# JPXの区分表記は全角括弧
TARGET_SEGMENTS = ["プライム（内国株式）"]


def fetch_jquants_list() -> list[tuple[str, str, str]]:
    """J-Quants v2 equities/master からプライム普通株を取得。"""
    r = requests.get(f"{config.JQUANTS_BASE}/equities/master",
                     headers={"x-api-key": config.JQUANTS_API_KEY}, timeout=60)
    r.raise_for_status()
    rows = []
    for m in r.json().get("data", []):
        if m.get("MktNm") != "プライム":
            continue
        code = str(m.get("Code", ""))[:4]
        name = m.get("CoName", "").strip()
        if len(code) == 4 and code.isascii() and name:
            rows.append((code, name, "プライム"))
    # 同一4桁コードの重複を除去
    dedup = {c: (c, n, mk) for c, n, mk in rows}
    return sorted(dedup.values(), key=lambda x: x[0])


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
    rows = None
    if config.JQUANTS_API_KEY:
        try:
            rows = fetch_jquants_list()
            print(f"J-Quants master取得: プライム {len(rows)} 銘柄")
        except Exception as e:  # noqa: BLE001
            print(f"J-Quants master取得失敗: {e}", file=sys.stderr)
    if not rows:
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
