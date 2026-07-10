"""全シグナルのレジストリ。新シグナルは各カテゴリのモジュールに追加する。"""
from __future__ import annotations

from .base import SignalDef
from .classic import CLASSIC_SIGNALS
from .legend import LEGEND_SIGNALS
from .sakata import SAKATA_SIGNALS

ALL_SIGNALS: list[SignalDef] = [*CLASSIC_SIGNALS, *SAKATA_SIGNALS, *LEGEND_SIGNALS]

_BY_ID = {s.id: s for s in ALL_SIGNALS}
assert len(_BY_ID) == len(ALL_SIGNALS), "シグナルIDが重複しています"


def get_signal(signal_id: str) -> SignalDef:
    return _BY_ID[signal_id]


def seed_rows() -> list[dict]:
    """signal_types テーブルへ投入するマスタ行。"""
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "origin": s.origin,
            "category": s.category,
            "is_premium": int(s.is_premium),
        }
        for s in ALL_SIGNALS
    ]
