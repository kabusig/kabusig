"""シグナル判定の境界値テスト。"""
import numpy as np
import pandas as pd

import indicators
from signals import ALL_SIGNALS, get_signal
from signals.base import crossed_above, crossed_below, newly_true
from tests.conftest import make_ohlcv


def _detect_dates(signal_id, df):
    sig = get_signal(signal_id)
    computed = indicators.compute_all(df)
    return [e["date"] for e in sig.detect(computed)]


# ---------- ヘルパーの境界値 ----------

def test_crossed_above_boundary():
    a = pd.Series([69.0, 70.0, 71.0, 71.0])
    dates = crossed_above(a, 70)
    # 70ちょうど→70超 の日のみ True(「前日≤70かつ当日>70」)
    assert list(dates) == [False, False, True, False]


def test_crossed_below_boundary():
    a = pd.Series([31.0, 30.0, 29.0, 29.0])
    assert list(crossed_below(a, 30)) == [False, False, True, False]


def test_newly_true_suppresses_consecutive():
    cond = pd.Series([False, True, True, False, True])
    assert list(newly_true(cond)) == [False, True, False, False, True]


# ---------- 個別シグナル ----------

def test_golden_cross_detected():
    # 下落トレンド(SMA5<SMA25)から急反発でクロスさせる
    closes = list(np.linspace(1500, 1000, 40)) + list(np.linspace(1000, 1500, 20))
    dates = _detect_dates("golden_cross", make_ohlcv(closes))
    assert len(dates) == 1


def test_dead_cross_detected():
    closes = list(np.linspace(1000, 1500, 40)) + list(np.linspace(1500, 1000, 20))
    dates = _detect_dates("dead_cross", make_ohlcv(closes))
    assert len(dates) == 1


def test_rsi_overbought_no_duplicate_on_stay():
    # 上昇でRSI>70到達後、高止まりしても再検知しない
    closes = [1000.0] * 20 + list(np.linspace(1000, 1400, 30)) + [1400.0] * 10
    df = make_ohlcv(closes)
    dates = _detect_dates("rsi_overbought", df)
    assert len(dates) == 1


def test_volume_surge_boundary():
    # 前日までの20日平均に対して、2,999,999(2.99倍)は検知せず 3,500,000(3.18倍)で検知
    vols = [1_000_000.0] * 30 + [2_999_999.0, 3_500_000.0, 3_500_000.0]
    closes = [1000.0] * 33
    df = make_ohlcv(closes, volumes=vols)
    dates = _detect_dates("volume_surge", df)
    assert len(dates) == 1
    assert dates[0] == df.index[31]


def test_tsutsumi_yo_engulfing():
    n = 30
    opens = [1000.0] * n
    closes = [995.0] * n   # 陰線続き
    opens[n - 1] = 990.0   # 最終日: 前日実体(995-1000)を包む陽線
    closes[n - 1] = 1005.0
    df = make_ohlcv(closes, opens=opens,
                    highs=[1010.0] * n, lows=[985.0] * n)
    dates = _detect_dates("tsutsumi_yo", df)
    assert df.index[n - 1] in dates


def test_aka_sanpei():
    n = 33
    # 始値・終値がともに3日連続で切り上がる陽線(前段は始値999の小陰線)
    opens = [999.0] * 30 + [1000.0, 1010.0, 1020.0]
    closes = [998.0] * 30 + [1008.0, 1018.0, 1028.0]
    df = make_ohlcv(closes, opens=opens,
                    highs=[float(max(o, c)) + 2 for o, c in zip(opens, closes)],
                    lows=[float(min(o, c)) - 2 for o, c in zip(opens, closes)])
    dates = _detect_dates("aka_sanpei", df)
    assert df.index[n - 1] in dates


def test_sanku_fumiage_three_gaps():
    n = 34
    base = [1000.0] * 30
    # 3日連続で窓開け上昇(安値 > 前日高値)
    closes = base + [1050.0, 1100.0, 1150.0, 1200.0]
    highs = base_h = [1005.0] * 30 + [1060.0, 1110.0, 1160.0, 1210.0]
    lows = [995.0] * 30 + [1040.0, 1070.0, 1120.0, 1170.0]
    df = make_ohlcv(closes, opens=closes, highs=highs, lows=lows)
    dates = _detect_dates("sanku_fumiage", df)
    assert len(dates) >= 1


def test_high_52w_detected():
    closes = [1000.0] * 70 + [1100.0]
    highs = [1005.0] * 70 + [1110.0]
    df = make_ohlcv(closes, highs=highs)
    dates = _detect_dates("high_52w", df)
    assert dates and dates[-1] == df.index[-1]


def test_all_signals_run_without_error(rng):
    """全シグナルがランダムウォークデータでエラーなく実行できる。"""
    closes = 1000 * np.exp(np.cumsum(rng.normal(0, 0.02, 300)))
    opens = closes * (1 + rng.normal(0, 0.005, 300))
    highs = np.maximum(opens, closes) * (1 + abs(rng.normal(0, 0.005, 300)))
    lows = np.minimum(opens, closes) * (1 - abs(rng.normal(0, 0.005, 300)))
    vols = rng.integers(500_000, 5_000_000, 300).astype(float)
    df = make_ohlcv(closes, opens=opens, highs=highs, lows=lows, volumes=vols)
    computed = indicators.compute_all(df)
    for sig in ALL_SIGNALS:
        events = sig.detect(computed)
        for e in events:
            assert e["signal_type"] == sig.id
            assert "close" in e["detail"]


def test_signal_ids_unique_and_categorized():
    ids = [s.id for s in ALL_SIGNALS]
    assert len(ids) == len(set(ids))
    from signals.base import CATEGORIES
    for s in ALL_SIGNALS:
        assert s.category in CATEGORIES
        assert s.name and s.description and s.origin
