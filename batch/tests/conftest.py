import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd
import pytest


def make_ohlcv(closes, opens=None, highs=None, lows=None, volumes=None) -> pd.DataFrame:
    """テスト用OHLCV生成。営業日インデックス。"""
    closes = np.asarray(closes, dtype=float)
    n = len(closes)
    opens = np.asarray(opens, dtype=float) if opens is not None else closes * 0.999
    highs = np.asarray(highs, dtype=float) if highs is not None else np.maximum(opens, closes) * 1.005
    lows = np.asarray(lows, dtype=float) if lows is not None else np.minimum(opens, closes) * 0.995
    volumes = np.asarray(volumes, dtype=float) if volumes is not None else np.full(n, 1_000_000)
    idx = pd.bdate_range("2024-01-04", periods=n)
    return pd.DataFrame({
        "open": opens, "high": highs, "low": lows,
        "close": closes, "volume": volumes,
    }, index=idx)


@pytest.fixture
def rng():
    return np.random.default_rng(42)
