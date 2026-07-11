"""経済ニュースRSS収集バッチ(1日2回想定)。

【方針(指示書§9)】
- 公式に配信されているRSSフィードのみ利用(スクレイピング禁止)
- 保存するのはタイトル・URL・媒体名・公開日時・タグのみ。
  本文の複製・要約・論評は行わない(著作権・助言性リスクの回避)

usage: python fetch_news.py
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone

import feedparser

from storage import get_storage

# 公式RSSフィード(媒体名, URL, 既定タグ)。RSSを廃止した媒体は追加しないこと。
# まとめブログ・SNS系も「公式に配信されているRSS」のみ利用する。
FEEDS = [
    # 報道・経済メディア
    ("NHKニュース(経済)", "https://www3.nhk.or.jp/rss/news/cat5.xml", []),
    ("Yahoo!ニュース(経済)", "https://news.yahoo.co.jp/rss/topics/business.xml", []),
    ("ITmedia ビジネスオンライン", "https://rss.itmedia.co.jp/rss/2.0/business.xml", []),
    ("東洋経済オンライン", "https://toyokeizai.net/list/feed/rss", []),
    ("ダイヤモンド・オンライン", "https://diamond.jp/list/feed/rss", []),
    ("PRESIDENT Online", "https://president.jp/list/rss", []),
    # 個人ブログ・まとめ・SNS発の話題(タグ「話題」)
    ("市況かぶ全力2階建", "http://kabumatome.doorblog.jp/index.rdf", ["話題"]),
    ("はてなブックマーク(経済・金融 人気)", "https://b.hatena.ne.jp/hotentry/economics.rss", ["話題"]),
    ("はてなブックマーク(株 人気)", "https://b.hatena.ne.jp/q/%E6%A0%AA?mode=rss&sort=popular", ["話題"]),
    ("Togetter(人気まとめ)", "https://togetter.com/rss/index", ["話題"]),
]

# タイトルからの機械的タグ付け(キーワード一致のみ、内容の解釈はしない)
TAG_KEYWORDS = {
    "決算": ["決算", "業績", "上方修正", "下方修正", "増益", "減益", "赤字", "黒字"],
    "金融政策": ["日銀", "日本銀行", "FRB", "FOMC", "ECB", "利上げ", "利下げ", "金利", "金融政策"],
    "市況": ["日経平均", "株価", "株式市場", "TOPIX", "ダウ", "ナスダック", "東証"],
    "為替": ["円安", "円高", "ドル円", "為替"],
    "経済指標": ["GDP", "CPI", "消費者物価", "雇用統計", "景気"],
    "企業": ["買収", "M&A", "上場", "IPO", "統合", "提携"],
}


def auto_tags(title: str) -> list[str]:
    return [tag for tag, words in TAG_KEYWORDS.items()
            if any(w in title for w in words)]


def parse_published(entry) -> str | None:
    for key in ("published_parsed", "updated_parsed"):
        t = getattr(entry, key, None)
        if t:
            return datetime(*t[:6], tzinfo=timezone.utc).isoformat()
    return None


def main():
    storage = get_storage()
    total = 0
    for source_name, url, default_tags in FEEDS:
        try:
            feed = feedparser.parse(url)
        except Exception as e:  # noqa: BLE001
            print(f"  {source_name}: ERROR {e}", file=sys.stderr)
            continue
        n = 0
        for entry in feed.entries[:30]:
            title = getattr(entry, "title", "").strip()
            link = getattr(entry, "link", "").strip()
            if not title or not link:
                continue
            tags = list(dict.fromkeys(default_tags + auto_tags(title)))
            cur = storage.conn.execute(
                "insert or ignore into news_links"
                "(title,url,source_name,published_at,tags) values(?,?,?,?,?)",
                (title, link, source_name, parse_published(entry),
                 json.dumps(tags, ensure_ascii=False)),
            )
            n += cur.rowcount
        storage.conn.commit()
        total += n
        print(f"  {source_name}: +{n}")
        time.sleep(1)
    print(f"fetch_news done: {total} new links")


if __name__ == "__main__":
    main()
