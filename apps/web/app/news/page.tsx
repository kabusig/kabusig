import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type NewsLink = {
  id: number;
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  tags: string | null;
};

export default function NewsPage() {
  // 要約・論評は行わない。タイトル+媒体名+公開日時+外部リンクのみ(指示書§9)
  const links = getDb()
    .prepare(
      "select id, title, url, source_name, published_at, tags from news_links order by published_at desc limit 100"
    )
    .all() as unknown as NewsLink[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">ニュースリンク集</h1>
        <p className="text-sm text-slate-400 mt-1">
          外部メディアの記事へのリンク集です。内容の要約・論評は行いません。
        </p>
      </div>
      {links.length === 0 ? (
        <p className="text-slate-400 text-sm">
          登録されたニュースはまだありません(公式RSS取り込みバッチはフェーズ2で稼働します)。
        </p>
      ) : (
        <ul className="space-y-2">
          {links.map((n) => (
            <li key={n.id} className="rounded border border-slate-800 p-3">
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline"
              >
                {n.title} ↗
              </a>
              <div className="text-xs text-slate-500 mt-1">
                {n.source_name}
                {n.published_at ? ` / ${n.published_at}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
