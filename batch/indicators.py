"""テクニカル指標計算(pandas 自前実装、ta-lib 依存なし)。

入力 df: index=日付昇順, columns = open/high/low/close/volume(調整済み価格)。
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    """Wilder の RSI(平滑移動平均)。"""
    delta = close.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    out = 100 - 100 / (1 + rs)
    # 下落が一度もない区間は RSI=100、変動が全くない区間は中立の50
    out = out.mask((avg_loss == 0) & (avg_gain > 0), 100.0)
    out = out.mask((avg_loss == 0) & (avg_gain == 0), 50.0)
    out[avg_gain.isna() | avg_loss.isna()] = np.nan
    return out


def sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(period).mean()


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return macd_line, signal_line


def bollinger(close: pd.Series, period: int = 20, num_std: float = 2.0):
    mid = close.rolling(period).mean()
    std = close.rolling(period).std(ddof=0)
    return mid + num_std * std, mid, mid - num_std * std


def stochastics(high: pd.Series, low: pd.Series, close: pd.Series,
                k_period: int = 9, d_period: int = 3):
    """スロー・ストキャスティクス(%K=Fast%Kの3日平均 相当の %K/%D)。"""
    ll = low.rolling(k_period).min()
    hh = high.rolling(k_period).max()
    fast_k = 100 * (close - ll) / (hh - ll).replace(0, np.nan)
    slow_k = fast_k.rolling(d_period).mean()
    slow_d = slow_k.rolling(d_period).mean()
    return slow_k, slow_d


def kairi(close: pd.Series, period: int = 25) -> pd.Series:
    """移動平均乖離率(%)。"""
    m = close.rolling(period).mean()
    return (close - m) / m * 100


def atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    prev_close = close.shift(1)
    tr = pd.concat(
        [high - low, (high - prev_close).abs(), (low - prev_close).abs()], axis=1
    ).max(axis=1)
    return tr.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()


def ichimoku(high: pd.Series, low: pd.Series):
    """一目均衡表(転換線9・基準線26・先行スパンA/B)。

    先行スパンは「当日時点の値」を返し、雲との比較時に26日先行を考慮する。
    """
    tenkan = (high.rolling(9).max() + low.rolling(9).min()) / 2
    kijun = (high.rolling(26).max() + low.rolling(26).min()) / 2
    senkou_a = ((tenkan + kijun) / 2).shift(26)
    senkou_b = ((high.rolling(52).max() + low.rolling(52).min()) / 2).shift(26)
    return tenkan, kijun, senkou_a, senkou_b


def compute_all(df: pd.DataFrame) -> pd.DataFrame:
    """全指標をまとめて計算し、指標カラムを付加した DataFrame を返す。"""
    out = df.copy()
    c, h, l, v = out["close"], out["high"], out["low"], out["volume"]
    out["rsi14"] = rsi(c, 14)
    out["sma5"] = sma(c, 5)
    out["sma25"] = sma(c, 25)
    out["sma75"] = sma(c, 75)
    out["sma200"] = sma(c, 200)
    # 「過去20日平均」は当日を含めない(前日までの20日間)
    out["volume_ratio20"] = v / v.shift(1).rolling(20).mean().replace(0, np.nan)
    out["macd"], out["macd_signal"] = macd(c)
    out["bb_upper"], out["bb_mid"], out["bb_lower"] = bollinger(c)
    out["stoch_k"], out["stoch_d"] = stochastics(h, l, c)
    out["kairi25"] = kairi(c, 25)
    out["atr14"] = atr(h, l, c)
    out["tenkan"], out["kijun"], out["senkou_a"], out["senkou_b"] = ichimoku(h, l)
    out["high_52w"] = h.rolling(250, min_periods=60).max()
    out["low_52w"] = l.rolling(250, min_periods=60).min()
    return out
