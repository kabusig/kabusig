"""決算発表予定日取得バッチ(フェーズ2: J-Quants API)。

無料プランで利用可能な決算発表予定日API(/fins/announcement)を使う。
レートリミット: 5件/分 → 13秒間隔(config.JQUANTS_RATE_LIMIT_SEC)。

フェーズ1では未使用。JQUANTS_REFRESH_TOKEN 設定後に有効化する。
"""
from __future__ import annotations

import sys
import time

import requests

import config
from storage import get_storage

BASE = "https://api.jquants.com/v1"


def get_id_token() -> str:
    r = requests.post(
        f"{BASE}/token/auth_refresh",
        params={"refreshtoken": config.JQUANTS_REFRESH_TOKEN},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["idToken"]


def main():
    if not config.JQUANTS_REFRESH_TOKEN:
        print("JQUANTS_REFRESH_TOKEN 未設定のためスキップ(フェーズ2で有効化)")
        return
    storage = get_storage()
    watch = set(storage.list_codes())
    token = get_id_token()
    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(f"{BASE}/fins/announcement", headers=headers, timeout=30)
    r.raise_for_status()
    time.sleep(config.JQUANTS_RATE_LIMIT_SEC)

    rows = []
    for item in r.json().get("announcement", []):
        code = item.get("Code", "")[:4]
        if code in watch and item.get("Date"):
            rows.append((code, item["Date"], item.get("FiscalQuarter", "")))
    for code, d, q in rows:
        storage.conn.execute(
            "insert or ignore into earnings_schedule(code,announce_date,fiscal_quarter) "
            "values(?,?,?)", (code, d, q))
    storage.conn.commit()
    print(f"fetch_earnings done: {len(rows)} rows")


if __name__ == "__main__":
    main()
