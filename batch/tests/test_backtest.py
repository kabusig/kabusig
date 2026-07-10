"""バックテストエンジンと SQLite ストレージの結合テスト。"""
import numpy as np
import pandas as pd
import pytest

import indicators
from backtest_engine import run_backtest
from signals import seed_rows
from storage import SqliteStorage
from tests.conftest import make_ohlcv


@pytest.fixture
def storage(tmp_path):
    s = SqliteStorage(str(tmp_path / "test.db"))
    s.upsert_stocks([("9999", "テスト銘柄", "テスト")])
    s.upsert_signal_types(seed_rows())
    return s


def test_upsert_prices_idempotent(storage):
    df = make_ohlcv([100.0, 101.0, 102.0])
    storage.upsert_prices("9999", df)
    storage.upsert_prices("9999", df)  # 再実行しても増えない
    got = storage.get_prices("9999")
    assert len(got) == 3
    assert got.iloc[-1]["close"] == 102.0


def test_signal_events_idempotent(storage):
    ev = {"code": "9999", "signal_type": "golden_cross",
          "date": pd.Timestamp("2024-06-01"), "detail": {"sma5": 1}}
    assert storage.insert_signal_events([ev]) == 1
    assert storage.insert_signal_events([ev]) == 0  # unique制約で冪等


def test_backtest_computes_returns(storage):
    # 60日間: シグナル日以降に既知の値動きを作る
    closes = [100.0] * 30 + [100.0, 110.0, 110.0, 110.0, 110.0, 121.0] + [121.0] * 24
    opens = list(closes)
    opens[31] = 100.0  # シグナル翌日(31日目)の始値=100
    df = make_ohlcv(closes, opens=opens)
    storage.upsert_prices("9999", df)
    storage.insert_signal_events([{
        "code": "9999", "signal_type": "golden_cross",
        "date": df.index[30], "detail": {},
    }])
    res = run_backtest(storage, "golden_cross", hold_days=5)
    assert res["count"] == 1
    # entry=翌日始値100, exit=5営業日後終値121 → +21%
    assert abs(res["mean_return_pct"] - 21.0) < 0.01
    assert res["up_ratio_pct"] == 100.0
    assert "将来の値動きを保証・示唆するものではありません" in res["note"]


def test_backtest_skips_incomplete_holding_period(storage):
    df = make_ohlcv([100.0] * 40)
    storage.upsert_prices("9999", df)
    storage.insert_signal_events([{
        "code": "9999", "signal_type": "dead_cross",
        "date": df.index[-2], "detail": {},  # 保有期間分のデータがない
    }])
    res = run_backtest(storage, "dead_cross", hold_days=20)
    assert res["count"] == 0


def test_notification_log_prevents_duplicates(storage):
    df = make_ohlcv([100.0] * 40)
    storage.upsert_prices("9999", df)
    storage.insert_signal_events([{
        "code": "9999", "signal_type": "golden_cross",
        "date": df.index[-1], "detail": {},
    }])
    events = storage.get_signal_events()
    assert storage.log_notification("user1", events[0]["id"]) is True
    assert storage.log_notification("user1", events[0]["id"]) is False
