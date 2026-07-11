"""古典テクニカル指標系シグナル(classic)。

すべて「状態の検知」であり、売買の方向を勧めるものではない。
"""
from __future__ import annotations

import pandas as pd

from .base import SignalDef, crossed_above, crossed_below, newly_true


def _rsi_over(df):  # RSI(14) が 70 を上抜け
    return crossed_above(df["rsi14"], 70)


def _rsi_under(df):
    return crossed_below(df["rsi14"], 30)


def _golden(df):
    return crossed_above(df["sma5"], df["sma25"])


def _dead(df):
    return crossed_below(df["sma5"], df["sma25"])


def _macd_up(df):
    return crossed_above(df["macd"], df["macd_signal"])


def _macd_down(df):
    return crossed_below(df["macd"], df["macd_signal"])


def _bb_upper(df):
    return newly_true(df["close"] > df["bb_upper"])


def _bb_lower(df):
    return newly_true(df["close"] < df["bb_lower"])


def _volume_surge(df):
    return newly_true(df["volume_ratio20"] >= 3.0)


def _high_52w(df):
    # 「52週」を名乗る以上、最低200営業日の履歴を要求する
    prev_max = df["high"].shift(1).rolling(250, min_periods=200).max()
    return newly_true(df["high"] > prev_max)


def _low_52w(df):
    prev_min = df["low"].shift(1).rolling(250, min_periods=200).min()
    return newly_true(df["low"] < prev_min)


def _kairi_plus(df):
    return crossed_above(df["kairi25"], 8.0)


def _kairi_minus(df):
    return crossed_below(df["kairi25"], -8.0)


def _stoch_over(df):
    return crossed_above(df["stoch_d"], 80)


def _stoch_under(df):
    return crossed_below(df["stoch_d"], 20)


def _renzoku_josho(df):  # 5日続伸
    up = df["close"] > df["close"].shift(1)
    run = up.rolling(5).sum() == 5
    return newly_true(run)


def _renzoku_geraku(df):  # 5日続落
    down = df["close"] < df["close"].shift(1)
    run = down.rolling(5).sum() == 5
    return newly_true(run)


CLASSIC_SIGNALS = [
    SignalDef("rsi_overbought", "RSI過熱水域入り",
              "RSI(14)が前日70以下から当日70超に上昇した状態。",
              "RSIは J. Welles Wilder Jr. が1978年に発表したオシレーター系指標。",
              "classic", _rsi_over, ("rsi14",)),
    SignalDef("rsi_oversold", "RSI売られすぎ水域入り",
              "RSI(14)が前日30以上から当日30未満に低下した状態。",
              "RSIは J. Welles Wilder Jr. が1978年に発表したオシレーター系指標。",
              "classic", _rsi_under, ("rsi14",)),
    SignalDef("golden_cross", "ゴールデンクロス",
              "5日移動平均線が25日移動平均線を下から上に抜けた状態。",
              "移動平均線のクロスは欧米で古くから使われる古典的な分析手法。",
              "classic", _golden, ("sma5", "sma25"), is_premium=True),
    SignalDef("dead_cross", "デッドクロス",
              "5日移動平均線が25日移動平均線を上から下に抜けた状態。",
              "移動平均線のクロスは欧米で古くから使われる古典的な分析手法。",
              "classic", _dead, ("sma5", "sma25"), is_premium=True),
    SignalDef("macd_cross_up", "MACD上方クロス",
              "MACD線がシグナル線を下から上に抜けた状態。",
              "MACDは Gerald Appel が1970年代に考案したトレンド系指標。",
              "classic", _macd_up, ("macd", "macd_signal"), is_premium=True),
    SignalDef("macd_cross_down", "MACD下方クロス",
              "MACD線がシグナル線を上から下に抜けた状態。",
              "MACDは Gerald Appel が1970年代に考案したトレンド系指標。",
              "classic", _macd_down, ("macd", "macd_signal"), is_premium=True),
    SignalDef("bb_upper_break", "ボリンジャーバンド+2σ超え",
              "終値が20日ボリンジャーバンドの+2σを上回った状態。",
              "ボリンジャーバンドは John Bollinger が1980年代に考案した指標。",
              "classic", _bb_upper, ("bb_upper",), is_premium=True),
    SignalDef("bb_lower_break", "ボリンジャーバンド-2σ割れ",
              "終値が20日ボリンジャーバンドの-2σを下回った状態。",
              "ボリンジャーバンドは John Bollinger が1980年代に考案した指標。",
              "classic", _bb_lower, ("bb_lower",), is_premium=True),
    SignalDef("volume_surge", "出来高急増",
              "当日出来高が過去20日平均の3倍以上に達した状態。",
              "出来高分析は市場参加者の関心度を測る古典的手法。",
              "classic", _volume_surge, ("volume_ratio20",), is_premium=True),
    SignalDef("high_52w", "52週高値更新",
              "当日高値が過去52週(約250営業日)の高値を上回った状態。",
              "新値の更新は古くから記録される市場統計のひとつ。",
              "classic", _high_52w, (), is_premium=True, min_rows=210),
    SignalDef("low_52w", "52週安値更新",
              "当日安値が過去52週(約250営業日)の安値を下回った状態。",
              "新値の更新は古くから記録される市場統計のひとつ。",
              "classic", _low_52w, (), is_premium=True, min_rows=210),
    SignalDef("kairi_plus_8", "25日線プラス乖離拡大",
              "終値の25日移動平均線からの乖離率が+8%を上回った状態。",
              "移動平均乖離率は価格と平均線の距離を測る古典的指標。",
              "classic", _kairi_plus, ("kairi25",), is_premium=True),
    SignalDef("kairi_minus_8", "25日線マイナス乖離拡大",
              "終値の25日移動平均線からの乖離率が-8%を下回った状態。",
              "移動平均乖離率は価格と平均線の距離を測る古典的指標。",
              "classic", _kairi_minus, ("kairi25",), is_premium=True),
    SignalDef("stoch_overbought", "ストキャスティクス高水準",
              "スローストキャスティクス%Dが80を上回った状態。",
              "ストキャスティクスは George Lane が1950年代に考案した指標。",
              "classic", _stoch_over, ("stoch_k", "stoch_d"), is_premium=True),
    SignalDef("stoch_oversold", "ストキャスティクス低水準",
              "スローストキャスティクス%Dが20を下回った状態。",
              "ストキャスティクスは George Lane が1950年代に考案した指標。",
              "classic", _stoch_under, ("stoch_k", "stoch_d"), is_premium=True),
    SignalDef("renzoku_josho_5", "5日続伸",
              "終値が5営業日連続で前日を上回った状態。",
              "連続陽線・続伸日数は江戸時代の米相場から数えられてきた市場統計。",
              "classic", _renzoku_josho, (), is_premium=True),
    SignalDef("renzoku_geraku_5", "5日続落",
              "終値が5営業日連続で前日を下回った状態。",
              "連続陰線・続落日数は江戸時代の米相場から数えられてきた市場統計。",
              "classic", _renzoku_geraku, (), is_premium=True),
]
