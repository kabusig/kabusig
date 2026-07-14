"""暦アノマリーのテスト。"""
from datetime import date

import anomalies


def test_eto_of_year():
    assert anomalies.eto_of_year(2024) == "辰"
    assert anomalies.eto_of_year(2025) == "巳"
    assert anomalies.eto_of_year(2026) == "午"


def test_setsubun():
    events = anomalies.anomalies_for_date(date(2026, 2, 3))
    assert any(e["event_type"] == "setsubun_tenjo" for e in events)


def test_sell_in_may_first_business_day():
    # 2026-05-01 は金曜(営業日)
    events = anomalies.anomalies_for_date(date(2026, 5, 1))
    assert any(e["event_type"] == "sell_in_may" for e in events)
    # 5月2日には出ない
    events2 = anomalies.anomalies_for_date(date(2026, 5, 2))
    assert not any(e["event_type"] == "sell_in_may" for e in events2)


def test_major_sq_second_friday():
    # 2026年3月の第2金曜は 3/13
    events = anomalies.anomalies_for_date(date(2026, 3, 13))
    assert any(e["event_type"] == "major_sq" for e in events)
    events2 = anomalies.anomalies_for_date(date(2026, 3, 6))
    assert not any(e["event_type"] == "major_sq" for e in events2)


def test_rule_45days():
    for m in (2, 5, 8, 11):
        events = anomalies.anomalies_for_date(date(2026, m, 15))
        assert any(e["event_type"] == "rule_45days" for e in events)


def test_all_bodies_have_note():
    """全アノマリー本文に「将来を示唆しない」旨の注記が含まれる。"""
    from datetime import timedelta
    d = date(2026, 1, 1)
    while d <= date(2026, 12, 31):
        for e in anomalies.anomalies_for_date(d):
            assert "将来の値動きを示唆するものではありません" in e["body"], e
        d += timedelta(days=1)


def test_business_day():
    assert anomalies.is_business_day(date(2026, 7, 10))       # 金曜
    assert not anomalies.is_business_day(date(2026, 7, 11))   # 土曜
    assert not anomalies.is_business_day(date(2026, 1, 1))    # 元日
