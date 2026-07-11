"""Supabase PostgREST の薄いクライアント(バッチ用、service role key 使用)。"""
from __future__ import annotations

import time
from typing import Iterable

import requests

import config


class SupabaseClient:
    def __init__(self):
        if not (config.SUPABASE_URL and config.SUPABASE_SERVICE_ROLE_KEY):
            raise RuntimeError(
                "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください")
        self.base = config.SUPABASE_URL.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, max_retry: int = 3, **kw):
        for attempt in range(max_retry):
            try:
                r = requests.request(method, f"{self.base}{path}",
                                     headers={**self.headers, **kw.pop("extra_headers", {})},
                                     timeout=60, **kw)
                if r.status_code < 500:
                    r.raise_for_status()
                    return r
                print(f"  supabase {r.status_code}, retrying...")
            except requests.RequestException as e:
                print(f"  supabase error (attempt {attempt + 1}): {e}")
            time.sleep(2 ** attempt)
        raise RuntimeError(f"supabase request failed: {method} {path}")

    def upsert(self, table: str, rows: list[dict], on_conflict: str,
               chunk: int = 1000, ignore_duplicates: bool = False):
        """一括upsert。冪等。"""
        mode = "ignore-duplicates" if ignore_duplicates else "merge-duplicates"
        total = 0
        for i in range(0, len(rows), chunk):
            self._request(
                "POST", f"/{table}?on_conflict={on_conflict}",
                json=rows[i:i + chunk],
                extra_headers={"Prefer": f"resolution={mode},return=minimal"},
            )
            total += len(rows[i:i + chunk])
        return total

    def select(self, table: str, query: str = "") -> list[dict]:
        r = self._request("GET", f"/{table}?{query}")
        return r.json()

    def delete(self, table: str, query: str):
        """条件必須(全削除事故防止)。"""
        assert query, "delete には条件が必要"
        self._request("DELETE", f"/{table}?{query}")
