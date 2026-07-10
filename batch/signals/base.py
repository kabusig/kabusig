"""シグナル定義の基盤。

【法的注意】name / description は「状態の記述」のみとし、売買方向を
勧める・示唆する語を含めてはならない(禁止語一覧と検査は
tests/test_forbidden_words.py)。origin は用語の由来の教育的説明であり、
有効性の主張を含めない。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

import pandas as pd

# カテゴリ: classic=古典テクニカル / sakata=酒田五法(ローソク足) /
#           legend=著名投資家・分析家由来 / anomaly=暦・アノマリー
CATEGORIES = ("classic", "sakata", "legend", "anomaly")


@dataclass(frozen=True)
class SignalDef:
    id: str
    name: str                 # 中立的な状態名(例: 「RSI過熱水域入り」)
    description: str          # 中立的な定義文
    origin: str               # 由来(教育的説明)
    category: str
    condition: Callable[[pd.DataFrame], pd.Series]  # 日付indexのbool Series
    detail_cols: tuple = field(default=())          # detailに含める指標カラム
    is_premium: bool = False
    min_rows: int = 30        # 判定に必要な最小データ日数

    def detect(self, df: pd.DataFrame) -> list[dict]:
        """指標計算済み df から全発生日のイベントを返す(バックフィル兼用)。"""
        if len(df) < self.min_rows:
            return []
        cond = self.condition(df).fillna(False)
        events = []
        for ts in df.index[cond]:
            row = df.loc[ts]
            detail = {}
            for col in self.detail_cols:
                val = row.get(col)
                if val is not None and pd.notna(val):
                    detail[col] = round(float(val), 4)
            detail["close"] = round(float(row["close"]), 2)
            events.append({"signal_type": self.id, "date": ts, "detail": detail})
        return events


def crossed_above(a: pd.Series, b) -> pd.Series:
    """a が b を下から上に抜けた日を True。b はSeriesまたはスカラ。"""
    if not isinstance(b, pd.Series):
        b = pd.Series(b, index=a.index)
    return (a.shift(1) <= b.shift(1)) & (a > b)


def crossed_below(a: pd.Series, b) -> pd.Series:
    if not isinstance(b, pd.Series):
        b = pd.Series(b, index=a.index)
    return (a.shift(1) >= b.shift(1)) & (a < b)


def newly_true(cond: pd.Series) -> pd.Series:
    """条件が False→True に転じた日のみ True(連日重複通知の防止)。"""
    cond = cond.fillna(False)
    return cond & ~cond.shift(1, fill_value=False)


# ローソク足ヘルパー
def is_bull(df: pd.DataFrame) -> pd.Series:
    return df["close"] > df["open"]


def is_bear(df: pd.DataFrame) -> pd.Series:
    return df["close"] < df["open"]


def body(df: pd.DataFrame) -> pd.Series:
    return (df["close"] - df["open"]).abs()
