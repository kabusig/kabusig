import Link from "next/link";
import {
  countStocks,
  latestSignalStats,
  recentSignalEvents,
  recentSignalEventsWithResult,
  recentCalendarEvents,
  recentNews,
  listSignalTypes,
} from "@/lib/db";
import { ANOMALY_NOTE } from "@/lib/constants";
import SignalEventTable from "@/components/SignalEventTable";

export const dynamic = "force-dynamic";

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Dashboard() {
  const events = recentSignalEvents(15);
  const resultEvents = recentSignalEventsWithResult(15);
  const calendar = recentCalendarEvents(4);
  const news = recentNews(9);
  const stockCount = countStocks();
  const signalCount = listSignalTypes().length;
  const { date: latestDate, count: todayCount } = latestSignalStats();

  return (
    <div className="space-y-16">
      {/* ヒーロー */}
      <section className="text-center pt-4">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight bg-gradient-to-br from-[#1d1d1f] via-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent pb-1">
          市場を、事実で見る。
        </h1>
        <p className="text-lg text-[#6e6e73] mt-4 max-w-xl mx-auto leading-relaxed">
          東証プライム{stockCount.toLocaleString()}銘柄 ×{" "}
          {signalCount}種のシグナルを毎日機械的にチェック。
          条件に一致した事実だけをお届けします。
        </p>
        <div className="flex gap-3 justify-center mt-7">
          <Link
            href="/pricing"
            className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-7 py-3 text-sm font-medium transition-colors"
          >
            プレミアムのご案内
          </Link>
          <Link
            href="/stats"
            className="bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full px-7 py-3 text-sm font-medium transition-colors"
          >
            シグナル統計を見る
          </Link>
        </div>
      </section>

      {/* ニュース(主役) */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-3xl font-semibold tracking-tight">
            きょうのマーケット
          </h2>
          <Link
            href="/news"
            className="text-sm text-[#0066cc] hover:underline"
          >
            ニュースまとめへ →
          </Link>
        </div>
        {news.length === 0 ? (
          <p className="text-sm text-[#6e6e73]">
            ニュースは収集バッチ実行後に表示されます。
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {news.map((n, i) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all ${
                  i === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                <div
                  className={`font-medium leading-snug ${
                    i === 0 ? "text-xl" : "text-[14px]"
                  }`}
                >
                  {n.title}
                </div>
                <div className="text-[11px] text-[#6e6e73] mt-2">
                  {n.source_name}
                  {n.published_at && ` ・ ${fmtTime(n.published_at)}`}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* 本日のシグナル */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-3xl font-semibold tracking-tight">
            シグナル検知
            <span className="text-sm font-normal text-[#6e6e73] ml-3">
              {latestDate ?? "-"} は {todayCount.toLocaleString()} 件
            </span>
          </h2>
          <Link
            href="/stats"
            className="text-sm text-[#0066cc] hover:underline"
          >
            シグナル別統計 →
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <SignalEventTable events={events} />
        </div>
      </section>

      {/* 結果が確定した検知 */}
      {resultEvents.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-3xl font-semibold tracking-tight">
              検知後の結果
              <span className="text-sm font-normal text-[#6e6e73] ml-3">
                実績が確定した直近の検知(1〜3営業日後)
              </span>
            </h2>
            <Link
              href="/backtest"
              className="text-sm text-[#0066cc] hover:underline"
            >
              バックテストへ →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
            <SignalEventTable events={resultEvents} />
          </div>
        </section>
      )}

      {/* 相場の暦 */}
      {calendar.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-3xl font-semibold tracking-tight">
              相場の暦
            </h2>
            <Link
              href="/calendar"
              className="text-sm text-[#0066cc] hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {calendar.map((c) => (
              <div
                key={`${c.event_type}-${c.date}`}
                className="bg-white rounded-2xl border border-black/5 shadow-sm p-5"
              >
                <div className="text-[11px] text-[#6e6e73]">{c.date}</div>
                <div className="text-sm font-medium mt-1 leading-snug">
                  {c.title}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#6e6e73] mt-3">{ANOMALY_NOTE}</p>
        </section>
      )}
    </div>
  );
}
