"""相場の暦・アノマリー情報(市場全体、銘柄非依存)。

【位置づけ・法的注意】
ここで扱うのは「相場格言・アノマリーとして語り継がれてきた暦日の紹介」
という教育・雑学情報である。将来の値動きの示唆や売買を勧める表現は一切使わない。
本文には必ず「経験則・言い伝えであり、将来の値動きを示唆するものではない」
旨を含めること。検証はバックテスト機能で統計的事実としてのみ提示する。
"""
from __future__ import annotations

import math
from datetime import date, timedelta

import jpholiday

_NOTE = "これは古くから語り継がれる経験則・言い伝えの紹介であり、将来の値動きを示唆するものではありません。"

# 干支の相場格言(十二支)。年初に「今年の干支の格言」として紹介する。
ETO_KAKUGEN = {
    "子": "子(ね)は繁栄",
    "丑": "丑(うし)つまずき",
    "寅": "寅(とら)千里を走る",
    "卯": "卯(う)跳ねる",
    "辰": "辰巳(たつみ)天井",
    "巳": "辰巳(たつみ)天井",
    "午": "午(うま)尻下がり",
    "未": "未(ひつじ)辛抱",
    "申": "申酉(さるとり)騒ぐ",
    "酉": "申酉(さるとり)騒ぐ",
    "戌": "戌(いぬ)笑い",
    "亥": "亥(い)固まる",
}
_ETO_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]


def eto_of_year(year: int) -> str:
    return _ETO_ORDER[(year - 4) % 12]


def is_business_day(d: date) -> bool:
    return d.weekday() < 5 and not jpholiday.is_holiday(d)


def next_business_day(d: date) -> date:
    while not is_business_day(d):
        d += timedelta(days=1)
    return d


def _second_friday(year: int, month: int) -> date:
    d = date(year, month, 1)
    fridays = [date(year, month, day) for day in range(1, 15)
               if date(year, month, day).weekday() == 4]
    return fridays[1]


def moon_age(d: date) -> float:
    """月齢の近似計算(2000-01-06 18:14 UTC の新月を基準、朔望月29.530589日)。"""
    epoch = date(2000, 1, 6)
    days = (d - epoch).days + 0.24  # 18:14UTC≒0.76日経過→JST補正込みの近似
    return days % 29.530589


def moon_phase(d: date) -> str | None:
    age = moon_age(d)
    if age < 1.0 or age > 28.53:
        return "新月"
    if abs(age - 14.765) < 0.5:
        return "満月"
    return None


def anomalies_for_date(d: date) -> list[dict]:
    """指定日の暦アノマリーイベント一覧を返す。"""
    events: list[dict] = []

    def add(event_type: str, title: str, body: str):
        events.append({
            "event_type": event_type, "date": d,
            "title": title, "body": f"{body} {_NOTE}",
        })

    # 節分天井・彼岸底(2/3・春分の日前後)
    if (d.month, d.day) == (2, 3):
        add("setsubun_tenjo", "相場格言「節分天井」の暦日",
            "本日2月3日は、相場格言「節分天井・彼岸底」で天井の時期とされてきた暦日です。")
    if d.month == 3 and jpholiday.is_holiday_name(d) == "春分の日":
        add("higan_zoko", "相場格言「彼岸底」の暦日",
            "本日は春分の日(彼岸の中日)で、相場格言「節分天井・彼岸底」で底の時期とされてきた暦日です。")

    # セルインメイ(5月最初の営業日)/ ハロウィン効果(10月最終営業日)
    if d.month == 5 and d == next_business_day(date(d.year, 5, 1)):
        add("sell_in_may", "相場格言「Sell in May」の時期",
            "5月相場入りです。欧米には「Sell in May and go away」という相場格言があります。")
    if d.month == 10:
        last = date(d.year, 10, 31)
        while not is_business_day(last):
            last -= timedelta(days=1)
        if d == last:
            add("halloween_effect", "「ハロウィン効果」の暦日",
                "10月最終営業日です。11月〜4月の株式パフォーマンスに関する「ハロウィン効果」というアノマリーが知られています。")

    # メジャーSQ(3・6・9・12月の第2金曜)
    if d.month in (3, 6, 9, 12) and d == _second_friday(d.year, d.month):
        add("major_sq", "メジャーSQ日",
            "本日は先物・オプションの特別清算指数(SQ)算出日(メジャーSQ)です。SQ前後は売買が膨らみやすいと言われます。")

    # 45日ルール(ヘッジファンド解約通知期限とされる 2/15・5/15・8/15・11/15)
    if d.day == 15 and d.month in (2, 5, 8, 11):
        add("rule_45days", "「45日ルール」の暦日",
            "本日は四半期末の45日前にあたり、ヘッジファンドの解約通知期限(いわゆる45日ルール)とされる暦日です。")

    # 満月・新月アノマリー
    phase = moon_phase(d)
    if phase:
        add("moon_phase", f"本日は{phase}です",
            f"本日は{phase}(月齢{moon_age(d):.1f})です。月の満ち欠けと相場を関連付けるアノマリーが古くから語られています。")

    # 干支の相場格言(大発会=年始最初の営業日)
    if d.month == 1 and d == next_business_day(date(d.year, 1, 4)):
        eto = eto_of_year(d.year)
        add("eto_kakugen", f"今年の干支の相場格言「{ETO_KAKUGEN[eto]}」",
            f"{d.year}年の干支は{eto}。相場格言では「{ETO_KAKUGEN[eto]}」と言われてきました。")

    # 月末月初効果(月内最終営業日)— ダッシュボード表示用
    last_bd = d
    probe = d + timedelta(days=1)
    while probe.month == d.month:
        if is_business_day(probe):
            last_bd = probe
        probe += timedelta(days=1)
    if is_business_day(d) and last_bd == d:
        add("month_end", "月末最終営業日",
            "本日は月内最終営業日です。月末月初の資金フローに関するアノマリー(月末月初効果)が知られています。")

    return events


def backfill(start: date, end: date) -> list[dict]:
    events = []
    d = start
    while d <= end:
        events.extend(anomalies_for_date(d))
        d += timedelta(days=1)
    return events
