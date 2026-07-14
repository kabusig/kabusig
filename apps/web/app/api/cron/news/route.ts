// ニュース自動収集(Vercel Cron で30分ごとに実行)。
// batch/fetch_news.py のTS版。公式RSSの見出し+リンクのみ収集(要約・論評なし)。
import Parser from "rss-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// (媒体名, URL, 既定タグ, 取込上限)。会員登録必須で本文が読めない媒体は載せない。
const FEEDS: [string, string, string[], number][] = [
  ["NHKニュース(経済)", "https://www3.nhk.or.jp/rss/news/cat5.xml", [], 30],
  ["Yahoo!ニュース(経済)", "https://news.yahoo.co.jp/rss/topics/business.xml", [], 30],
  [
    "ロイター",
    "https://news.google.com/rss/search?q=site:jp.reuters.com&hl=ja&gl=JP&ceid=JP:ja",
    [],
    30,
  ],
  [
    "産経新聞(経済)",
    "https://news.google.com/rss/search?q=site:sankei.com+%E7%B5%8C%E6%B8%88&hl=ja&gl=JP&ceid=JP:ja",
    [],
    20,
  ],
  ["ITmedia ビジネスオンライン", "https://rss.itmedia.co.jp/rss/2.0/business.xml", [], 15],
  ["ダイヤモンド・オンライン", "https://diamond.jp/list/feed/rss", [], 10],
  ["PRESIDENT Online", "https://president.jp/list/rss", [], 5],
  ["市況かぶ全力2階建", "http://kabumatome.doorblog.jp/index.rdf", ["話題"], 10],
  ["はてなブックマーク(経済・金融 人気)", "https://b.hatena.ne.jp/hotentry/economics.rss", ["話題"], 20],
  [
    "はてなブックマーク(株 人気)",
    "https://b.hatena.ne.jp/q/%E6%A0%AA?mode=rss&sort=popular",
    ["話題"],
    20,
  ],
  ["Togetter(人気まとめ)", "https://togetter.com/rss/index", ["話題"], 10],
];

const TAG_KEYWORDS: Record<string, string[]> = {
  決算: ["決算", "業績", "上方修正", "下方修正", "増益", "減益", "赤字", "黒字"],
  金融政策: ["日銀", "日本銀行", "FRB", "FOMC", "ECB", "利上げ", "利下げ", "金利", "金融政策"],
  市況: ["日経平均", "株価", "株式市場", "TOPIX", "ダウ", "ナスダック", "東証"],
  為替: ["円安", "円高", "ドル円", "為替"],
  経済指標: ["GDP", "CPI", "消費者物価", "雇用統計", "景気"],
  企業: ["買収", "M&A", "上場", "IPO", "統合", "提携"],
};

function autoTags(title: string, defaults: string[]): string[] {
  const tags = new Set(defaults);
  for (const [tag, words] of Object.entries(TAG_KEYWORDS)) {
    if (words.some((w) => title.includes(w))) tags.add(tag);
  }
  return [...tags];
}

export async function GET(request: Request) {
  // Vercel Cron の認証(CRON_SECRET 設定時)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const parser = new Parser({ timeout: 15000 });
  const admin = createAdminClient();

  const rows: {
    title: string;
    url: string;
    source_name: string;
    published_at: string | null;
    tags: string[];
  }[] = [];

  await Promise.allSettled(
    FEEDS.map(async ([source, url, defaults, limit]) => {
      const feed = await parser.parseURL(url);
      const isGoogle = url.includes("news.google.com");
      for (const item of (feed.items ?? []).slice(0, limit)) {
        let title = (item.title ?? "").trim();
        const link = (item.link ?? "").trim();
        if (!title || !link) continue;
        // Google News はタイトル末尾に「 - 媒体名」が付くため除去
        if (isGoogle && title.includes(" - ")) {
          title = title.slice(0, title.lastIndexOf(" - ")).trim();
        }
        rows.push({
          title,
          url: link,
          source_name: source,
          published_at: item.isoDate ?? null,
          tags: autoTags(title, defaults),
        });
      }
    })
  );

  let inserted = 0;
  if (rows.length > 0) {
    // url 重複は無視(既存を上書きしない)
    const { error, count } = await admin
      .from("news_links")
      .upsert(rows, { onConflict: "url", ignoreDuplicates: true, count: "exact" });
    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
    inserted = count ?? 0;
  }

  return Response.json({ ok: true, fetched: rows.length, inserted });
}
