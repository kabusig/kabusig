import Link from "next/link";
import { newsList, newsSources } from "@/lib/data";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

const TAGS = ["話題", "決算", "金融政策", "市況", "為替", "経済指標", "企業"];

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; source?: string }>;
}) {
  const { tag = "", source = "" } = await searchParams;
  // 要約・論評は行わない。タイトル+媒体名+公開日時+外部リンクのみ(指示書§9)
  const sources = (await newsSources()).map((source_name) => ({ source_name }));
  const rows = await newsList(300);

  const links = rows.filter((n) => {
    if (source && n.source_name !== source) return false;
    if (tag) {
      try {
        const tags: string[] = JSON.parse(n.tags ?? "[]");
        if (!tags.includes(tag)) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  const buildHref = (t: string, s: string) => {
    const p = new URLSearchParams();
    if (t) p.set("tag", t);
    if (s) p.set("source", s);
    const qs = p.toString();
    return qs ? `/news?${qs}` : "/news";
  };

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          経済ニュースまとめ
        </h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 leading-relaxed">
          各メディアが公式配信する経済・市場ニュースの見出しを自動収集した
          リンク集です。内容の要約・論評は行いません。リンク先は外部サイトです。
        </p>
      </div>

      <AdSlot slot="news_top" />

      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-[#6e6e73] w-14">タグ</span>
          <Link
            href={buildHref("", source)}
            className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
              !tag ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
            }`}
          >
            すべて
          </Link>
          {TAGS.map((t) => (
            <Link
              key={t}
              href={buildHref(t === tag ? "" : t, source)}
              className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                t === tag
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
        {sources.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-[#6e6e73] w-14">媒体</span>
            <Link
              href={buildHref(tag, "")}
              className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                !source ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              すべて
            </Link>
            {sources.map(({ source_name }) => (
              <Link
                key={source_name}
                href={buildHref(tag, source_name === source ? "" : source_name)}
                className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                  source_name === source
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
                }`}
              >
                {source_name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {links.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-10 text-center text-[#6e6e73] text-sm">
          ニュースがまだありません。バッチ
          <code className="mx-1 bg-[#f5f5f7] rounded px-1.5 py-0.5 text-xs">
            python fetch_news.py
          </code>
          を実行すると自動収集されます。
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((n, i) => {
            let tags: string[] = [];
            try {
              tags = JSON.parse(n.tags ?? "[]");
            } catch {}
            return (
              <div key={n.id}>
                {i > 0 && i % 15 === 0 && <AdSlot slot="news_inline" />}
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-2xl border border-black/5 shadow-sm px-6 py-4 hover:shadow-md transition-shadow"
                >
                  <div className="text-[15px] font-medium leading-snug">
                    {n.title}
                    <span className="text-[#6e6e73] text-xs ml-1.5">↗</span>
                  </div>
                  <div className="flex gap-2 items-center mt-1.5 text-[11px] text-[#6e6e73]">
                    <span>{n.source_name}</span>
                    {n.published_at && <span>・{fmtDate(n.published_at)}</span>}
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="bg-[#f5f5f7] rounded-full px-2 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-[#6e6e73]">
        見出し・リンクは各媒体の公式RSSフィードから機械的に取得しています。
        著作権は各媒体に帰属します。
      </p>
    </div>
  );
}
