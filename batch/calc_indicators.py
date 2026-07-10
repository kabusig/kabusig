"""指標計算バッチ。daily_prices → daily_indicators。"""
from __future__ import annotations

import indicators
from storage import get_storage

INDICATOR_COLS = ["rsi14", "sma5", "sma25", "sma75", "sma200", "volume_ratio20",
                  "macd", "macd_signal", "bb_upper", "bb_lower",
                  "stoch_k", "stoch_d", "kairi25",
                  "tenkan", "kijun", "senkou_a", "senkou_b", "atr14"]


def main():
    storage = get_storage()
    for code in storage.list_codes():
        prices = storage.get_prices(code)
        if len(prices) < 30:
            continue
        df = indicators.compute_all(prices)
        storage.upsert_indicators(code, df[INDICATOR_COLS])
        print(f"  {code}: indicators for {len(df)} rows")
    print("calc_indicators done")


if __name__ == "__main__":
    main()
