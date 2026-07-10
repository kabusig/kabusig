"""酒田五法・ローソク足パターン系シグナル(sakata)。

江戸時代の米商人・本間宗久に由来するとされる日本最古級のチャート分析。
いずれも「形状の検知」であり、売買の方向を勧めるものではない。
"""
from __future__ import annotations

import pandas as pd

from .base import SignalDef, body, is_bear, is_bull, newly_true

_ORIGIN = "酒田五法は江戸時代の米商人・本間宗久に由来するとされるローソク足分析。"


def _aka_sanpei(df):
    """赤三兵: 3日連続の陽線で、終値と始値がともに切り上がる形。"""
    bull = is_bull(df)
    close_up = df["close"] > df["close"].shift(1)
    open_up = df["open"] > df["open"].shift(1)
    cond = (bull & close_up & open_up).rolling(3).sum() == 3
    return newly_true(cond)


def _sanba_garasu(df):
    """三羽烏(黒三兵): 3日連続の陰線で、終値と始値がともに切り下がる形。"""
    bear = is_bear(df)
    close_dn = df["close"] < df["close"].shift(1)
    open_dn = df["open"] < df["open"].shift(1)
    cond = (bear & close_dn & open_dn).rolling(3).sum() == 3
    return newly_true(cond)


def _tsutsumi_yo(df):
    """陽の包み足: 前日陰線を当日陽線の実体が包む形。"""
    prev_bear = is_bear(df).shift(1, fill_value=False)
    engulf = (df["open"] < df[["open", "close"]].shift(1).min(axis=1)) & \
             (df["close"] > df[["open", "close"]].shift(1).max(axis=1))
    return prev_bear & is_bull(df) & engulf


def _tsutsumi_in(df):
    """陰の包み足: 前日陽線を当日陰線の実体が包む形。"""
    prev_bull = is_bull(df).shift(1, fill_value=False)
    engulf = (df["open"] > df[["open", "close"]].shift(1).max(axis=1)) & \
             (df["close"] < df[["open", "close"]].shift(1).min(axis=1))
    return prev_bull & is_bear(df) & engulf


def _ake_no_myojo(df):
    """明けの明星: 大陰線→下放れ小実体→前々日実体の中心を超える陽線。"""
    b = body(df)
    avg_body = b.rolling(20).mean()
    day1_bear = is_bear(df).shift(2, fill_value=False) & (b.shift(2) > avg_body.shift(2))
    small2 = b.shift(1) < avg_body.shift(1) * 0.5
    gap_dn = df[["open", "close"]].shift(1).max(axis=1) < df[["open", "close"]].shift(2).min(axis=1)
    mid1 = (df["open"].shift(2) + df["close"].shift(2)) / 2
    day3 = is_bull(df) & (df["close"] > mid1)
    return day1_bear & small2 & gap_dn & day3


def _yoi_no_myojo(df):
    """宵の明星: 大陽線→上放れ小実体→前々日実体の中心を割る陰線。"""
    b = body(df)
    avg_body = b.rolling(20).mean()
    day1_bull = is_bull(df).shift(2, fill_value=False) & (b.shift(2) > avg_body.shift(2))
    small2 = b.shift(1) < avg_body.shift(1) * 0.5
    gap_up = df[["open", "close"]].shift(1).min(axis=1) > df[["open", "close"]].shift(2).max(axis=1)
    mid1 = (df["open"].shift(2) + df["close"].shift(2)) / 2
    day3 = is_bear(df) & (df["close"] < mid1)
    return day1_bull & small2 & gap_up & day3


def _sanku_fumiage(df):
    """三空踏み上げ: 3日連続の上放れ(窓開け上昇)。"""
    gap_up = df["low"] > df["high"].shift(1)
    cond = gap_up.rolling(3).sum() == 3
    return newly_true(cond)


def _sanku_tatakikomi(df):
    """三空叩き込み: 3日連続の下放れ(窓開け下落)。"""
    gap_dn = df["high"] < df["low"].shift(1)
    cond = gap_dn.rolling(3).sum() == 3
    return newly_true(cond)


SAKATA_SIGNALS = [
    SignalDef("aka_sanpei", "赤三兵",
              "陽線が3本連続し、終値・始値がともに切り上がった形状。",
              _ORIGIN, "sakata", _aka_sanpei, (), is_premium=True),
    SignalDef("sanba_garasu", "三羽烏",
              "陰線が3本連続し、終値・始値がともに切り下がった形状。",
              _ORIGIN, "sakata", _sanba_garasu, (), is_premium=True),
    SignalDef("tsutsumi_yo", "陽の包み足",
              "前日の陰線の実体を当日の陽線の実体が包み込んだ形状。",
              "包み足(抱き線)はローソク足分析の基本形のひとつ。",
              "sakata", _tsutsumi_yo, (), is_premium=True),
    SignalDef("tsutsumi_in", "陰の包み足",
              "前日の陽線の実体を当日の陰線の実体が包み込んだ形状。",
              "包み足(抱き線)はローソク足分析の基本形のひとつ。",
              "sakata", _tsutsumi_in, (), is_premium=True),
    SignalDef("ake_no_myojo", "明けの明星",
              "大陰線、下放れの小実体、その後の陽線という3日間の形状。",
              _ORIGIN, "sakata", _ake_no_myojo, (), is_premium=True),
    SignalDef("yoi_no_myojo", "宵の明星",
              "大陽線、上放れの小実体、その後の陰線という3日間の形状。",
              _ORIGIN, "sakata", _yoi_no_myojo, (), is_premium=True),
    SignalDef("sanku_fumiage", "三空踏み上げ",
              "窓を開けた上昇が3日連続した形状。",
              _ORIGIN, "sakata", _sanku_fumiage, (), is_premium=True),
    SignalDef("sanku_tatakikomi", "三空叩き込み",
              "窓を開けた下落が3日連続した形状。",
              _ORIGIN, "sakata", _sanku_tatakikomi, (), is_premium=True),
]
