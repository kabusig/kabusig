"""著名投資家・分析家由来のシグナル(legend)。

歴史上の投資家・分析家が用いたとされる条件を機械的に判定する。
「その人物が勧めている」という表現は使わず、由来の紹介に留める。
"""
from __future__ import annotations

import pandas as pd

from .base import SignalDef, crossed_above, crossed_below, newly_true


def _granville_1(df):
    """グランビル第1法則相当: 200日線が下向きでない状態で終値が上抜け。"""
    slope_ok = df["sma200"] >= df["sma200"].shift(5)
    return crossed_above(df["close"], df["sma200"]) & slope_ok


def _granville_5(df):
    """グランビル第5法則相当: 200日線が上向きでない状態で終値が下抜け。"""
    slope_ok = df["sma200"] <= df["sma200"].shift(5)
    return crossed_below(df["close"], df["sma200"]) & slope_ok


def _darvas_box(df):
    """ダーバス・ボックス上放れ: 直近20日の高値圏もみ合いを終値が上抜け、出来高増加。"""
    box_high = df["high"].shift(1).rolling(20).max()
    box_low = df["low"].shift(1).rolling(20).min()
    narrow = (box_high - box_low) / box_high < 0.12  # もみ合い(値幅12%未満)
    breakout = df["close"] > box_high
    vol_up = df["volume_ratio20"] >= 1.5
    return newly_true(narrow & breakout & vol_up)


def _oneil_high_volume(df):
    """新高値・出来高増加: 52週高値更新と同時に出来高が20日平均の1.5倍以上。"""
    prev_max = df["high"].shift(1).rolling(250, min_periods=200).max()
    new_high = df["high"] > prev_max
    return newly_true(new_high & (df["volume_ratio20"] >= 1.5))


def _swing(series: pd.Series, window: int = 5, mode: str = "high") -> pd.Series:
    """単純なスイング高値/安値の検出(前後window日で最大/最小)。"""
    if mode == "high":
        piv = series == series.rolling(window * 2 + 1, center=True).max()
    else:
        piv = series == series.rolling(window * 2 + 1, center=True).min()
    return piv.fillna(False)


def _dow_uptrend(df):
    """ダウ理論・上昇トレンド確認: 直近2つのスイング高値と安値がともに切り上げ、
    かつ直近スイング高値を終値が上回った日。"""
    return _dow_trend(df, up=True)


def _dow_downtrend(df):
    return _dow_trend(df, up=False)


def _dow_trend(df, up: bool):
    highs = _swing(df["high"], 5, "high")
    lows = _swing(df["low"], 5, "low")
    result = pd.Series(False, index=df.index)
    high_idx = list(df.index[highs])
    low_idx = list(df.index[lows])
    if len(high_idx) < 2 or len(low_idx) < 2:
        return result
    import bisect
    positions = {ts: i for i, ts in enumerate(df.index)}
    high_pos = [positions[t] for t in high_idx]
    low_pos = [positions[t] for t in low_idx]
    for i, ts in enumerate(df.index):
        # スイングは前後5日で確定するため、位置 p のピボットが当日 i 時点で
        # 利用可能なのは p+5 <= i のもののみ(先読みバイアス防止)
        hi = bisect.bisect_right(high_pos, i - 5) - 1
        lo = bisect.bisect_right(low_pos, i - 5) - 1
        if hi < 1 or lo < 1:
            continue
        h2, h1 = df["high"].iloc[high_pos[hi - 1]], df["high"].iloc[high_pos[hi]]
        l2, l1 = df["low"].iloc[low_pos[lo - 1]], df["low"].iloc[low_pos[lo]]
        if up and h1 > h2 and l1 > l2 and df["close"].iloc[i] > h1:
            result.iloc[i] = True
        if (not up) and h1 < h2 and l1 < l2 and df["close"].iloc[i] < l1:
            result.iloc[i] = True
    return newly_true(result)


def _ichimoku_kouten(df):
    """一目均衡表・三役好転: 転換線>基準線、終値>雲、遅行スパンが26日前の価格を上回る。"""
    cloud_top = df[["senkou_a", "senkou_b"]].max(axis=1)
    cond = (df["tenkan"] > df["kijun"]) & (df["close"] > cloud_top) & \
           (df["close"] > df["close"].shift(26))
    return newly_true(cond)


def _ichimoku_gyakuten(df):
    """一目均衡表・三役逆転。"""
    cloud_bottom = df[["senkou_a", "senkou_b"]].min(axis=1)
    cond = (df["tenkan"] < df["kijun"]) & (df["close"] < cloud_bottom) & \
           (df["close"] < df["close"].shift(26))
    return newly_true(cond)


LEGEND_SIGNALS = [
    SignalDef("granville_1", "200日線上抜け(グランビル第1法則型)",
              "200日移動平均線が下向きでない状態で、終値が同線を下から上に抜けた状態。",
              "Joseph Granville が1960年代に整理した移動平均線と価格の8つの位置関係のひとつ。",
              "legend", _granville_1, ("sma200",), is_premium=True, min_rows=210),
    SignalDef("granville_5", "200日線下抜け(グランビル第5法則型)",
              "200日移動平均線が上向きでない状態で、終値が同線を上から下に抜けた状態。",
              "Joseph Granville が1960年代に整理した移動平均線と価格の8つの位置関係のひとつ。",
              "legend", _granville_5, ("sma200",), is_premium=True, min_rows=210),
    SignalDef("darvas_box_break", "ボックス上放れ(ダーバス・ボックス型)",
              "直近20日間の狭いもみ合いレンジの上限を終値が上抜け、出来高が20日平均の1.5倍以上となった状態。",
              "ダンサーの Nicolas Darvas が1950年代に用いたとされるボックス理論に由来。",
              "legend", _darvas_box, ("volume_ratio20",), is_premium=True),
    SignalDef("oneil_new_high_volume", "新高値・出来高増加(オニール型)",
              "52週高値を更新し、同時に出来高が20日平均の1.5倍以上となった状態。",
              "William O'Neil の CAN-SLIM 分析で重視されたとされる新高値と出来高の組み合わせに由来。",
              "legend", _oneil_high_volume, ("volume_ratio20",), is_premium=True, min_rows=210),
    SignalDef("dow_uptrend", "高値・安値切り上げ確認(ダウ理論型)",
              "直近のスイング高値と安値がともに切り上がり、終値が直近スイング高値を上回った状態。",
              "Charles Dow の相場論(ダウ理論)におけるトレンド定義に由来。",
              "legend", _dow_uptrend, (), is_premium=True, min_rows=60),
    SignalDef("dow_downtrend", "高値・安値切り下げ確認(ダウ理論型)",
              "直近のスイング高値と安値がともに切り下がり、終値が直近スイング安値を下回った状態。",
              "Charles Dow の相場論(ダウ理論)におけるトレンド定義に由来。",
              "legend", _dow_downtrend, (), is_premium=True, min_rows=60),
    SignalDef("ichimoku_sanyaku_kouten", "一目均衡表・三役好転",
              "転換線が基準線を上回り、終値が雲を上回り、遅行スパンが26日前の価格を上回った状態。",
              "一目均衡表は細田悟一(一目山人)が昭和初期に考案した日本発の分析手法。",
              "legend", _ichimoku_kouten, ("tenkan", "kijun"), is_premium=True, min_rows=90),
    SignalDef("ichimoku_sanyaku_gyakuten", "一目均衡表・三役逆転",
              "転換線が基準線を下回り、終値が雲を下回り、遅行スパンが26日前の価格を下回った状態。",
              "一目均衡表は細田悟一(一目山人)が昭和初期に考案した日本発の分析手法。",
              "legend", _ichimoku_gyakuten, ("tenkan", "kijun"), is_premium=True, min_rows=90),
]
