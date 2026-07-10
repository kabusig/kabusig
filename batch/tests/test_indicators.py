"""指標計算の既知値との突合・性質テスト。"""
import numpy as np
import pandas as pd

import indicators
from tests.conftest import make_ohlcv


def wilder_rsi_reference(closes, period=14):
    """教科書通りの逐次計算による Wilder RSI(検証用リファレンス)。"""
    closes = list(map(float, closes))
    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i - 1]
        gains.append(max(d, 0.0))
        losses.append(max(-d, 0.0))
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    out = []
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        rs = avg_gain / avg_loss if avg_loss else float("inf")
        out.append(100 - 100 / (1 + rs))
    return out


def test_rsi_matches_wilder_reference(rng):
    closes = 1000 + np.cumsum(rng.normal(0, 10, 100))
    result = indicators.rsi(pd.Series(closes), 14)
    ref = wilder_rsi_reference(closes, 14)
    # ewm(alpha=1/14) は初期値の馴染みで序盤にわずかな差が出るため終盤で比較
    assert abs(result.iloc[-1] - ref[-1]) < 0.5
    assert abs(result.iloc[-10] - ref[-10]) < 0.5


def test_rsi_bounds_and_direction(rng):
    up = pd.Series(np.arange(100, 200, dtype=float))
    down = pd.Series(np.arange(200, 100, -1, dtype=float))
    assert indicators.rsi(up).iloc[-1] > 99
    assert indicators.rsi(down).iloc[-1] < 1
    noisy = pd.Series(1000 + np.cumsum(rng.normal(0, 5, 200)))
    r = indicators.rsi(noisy).dropna()
    assert ((r >= 0) & (r <= 100)).all()


def test_sma_known_values():
    s = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])
    result = indicators.sma(s, 3)
    assert result.iloc[2] == 2.0
    assert result.iloc[4] == 4.0
    assert pd.isna(result.iloc[1])


def test_macd_zero_for_constant_series():
    s = pd.Series([100.0] * 60)
    macd_line, signal_line = indicators.macd(s)
    assert abs(macd_line.iloc[-1]) < 1e-9
    assert abs(signal_line.iloc[-1]) < 1e-9


def test_bollinger_symmetry(rng):
    s = pd.Series(1000 + rng.normal(0, 10, 60))
    upper, mid, lower = indicators.bollinger(s)
    np.testing.assert_allclose((upper + lower) / 2, mid, rtol=1e-9)
    assert (upper.dropna() >= mid.dropna()).all()


def test_stochastics_bounds(rng):
    df = make_ohlcv(1000 + np.cumsum(rng.normal(0, 10, 100)))
    k, d = indicators.stochastics(df["high"], df["low"], df["close"])
    kd = pd.concat([k, d]).dropna()
    assert ((kd >= 0) & (kd <= 100)).all()


def test_kairi_known_value():
    # 25日間一定→乖離0%、最終日に10%上昇
    closes = [100.0] * 25 + [110.0]
    s = pd.Series(closes)
    k = indicators.kairi(s, 25)
    assert abs(k.iloc[24]) < 1e-9
    # 最終日の乖離率: MA25 = (24*100+110)/25 = 100.4 → (110-100.4)/100.4*100
    assert abs(k.iloc[25] - (110 - 100.4) / 100.4 * 100) < 1e-9


def test_ichimoku_flat_market():
    df = make_ohlcv([100.0] * 120, highs=[101.0] * 120, lows=[99.0] * 120)
    tenkan, kijun, sa, sb = indicators.ichimoku(df["high"], df["low"])
    assert abs(tenkan.iloc[-1] - 100.0) < 1e-9
    assert abs(kijun.iloc[-1] - 100.0) < 1e-9
    assert abs(sb.iloc[-1] - 100.0) < 1e-9


def test_compute_all_has_expected_columns(rng):
    df = make_ohlcv(1000 + np.cumsum(rng.normal(0, 10, 300)))
    out = indicators.compute_all(df)
    for col in ["rsi14", "sma5", "sma25", "sma75", "sma200", "volume_ratio20",
                "macd", "macd_signal", "bb_upper", "bb_lower", "stoch_k",
                "stoch_d", "kairi25", "tenkan", "kijun", "senkou_a",
                "senkou_b", "atr14", "high_52w", "low_52w"]:
        assert col in out.columns, col
        assert out[col].notna().any(), f"{col} が全て NaN"
