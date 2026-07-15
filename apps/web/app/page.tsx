import Link from "next/link";
import {
  countStocks,
  latestSignalStats,
  recentSignalEvents,
  recentSignalEventsWithResult,
  recentCalendarEvents,
  recentNews,
  listSignalTypes,
  getSignalStats,
} from "@/lib/data";
import { ANOMALY_NOTE } from "@/lib/constants";
import SignalEventTable from "@/components/SignalEventTable";
import SignalRankTeaser from "@/components/SignalRankTeaser";
import AdSlot from "@/components/AdSlot";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function Dashboard() {
  const viewer = await getViewer();
  const events = await recentSignalEvents(viewer.paid ? 15 : 10);
  // 無料ユーザーにも「検知後の結果」を見せる(1営業日後は表示、2〜3はロック=餌)
  const resultEvents = await recentSignalEventsWithResult(15);
  const calendar = await recentCalendarEvents(4);
  const news = await recentNews(12);
  const stockCount = await countStocks();
  const signalCount = (await listSignalTypes()).length;
  const { date: latestDate, count: todayCount } = await latestSignalStats();
  // 上昇割合・平均騰落率が高いシグナル(過去統計・3営業日後)。サンプル数が極端に少ないものは除外。
  const upStats = await getSignalStats(3, "up_ratio");
  const topUp = upStats.filter((s) => s.count >= 20).slice(0, 5);
  const meanStats = await getSignalStats(3, "mean");
  const topMean = meanStats.filter((s) => s.count >= 20).slice(0, 5);

  return (
    <div className="space-y-16">
      {/* ヒーロー */}
      <section className="text-center pt-4">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-balance bg-gradient-to-br from-[#1d1d1f] via-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent pb-1">
          市場を 事実で見る。
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
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {news.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="font-medium leading-snug text-[14px]">
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

      {/* 広告(A8等) */}
      <AdSlot slot="signal_top" />

      {/* 本日のシグナル */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
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
          <SignalEventTable events={events} showResults={false} />
          {!viewer.paid && (
            <div className="mt-4 rounded-xl bg-gradient-to-br from-[#f5f5f7] to-[#e8f2ff] p-6 text-center">
              <p className="text-sm font-medium">
                本日の検知 {todayCount.toLocaleString()} 件のうち 10
                件を表示しています
              </p>
              <p className="text-xs text-[#6e6e73] mt-1">
                プレミアム会員はすべての検知・1〜3営業日後の実績・シグナル統計を閲覧できます。
              </p>
              <Link
                href="/pricing"
                className="inline-block mt-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
              >
                プレミアムでできることを見る
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 上昇割合が高いシグナル(過去統計・餌) */}
      <SignalRankTeaser
        title="上昇割合が高いシグナル"
        subtitle="過去統計・3営業日後"
        rows={topUp}
        metric="up_ratio"
        paid={viewer.paid}
      />

      {/* 平均騰落率が高いシグナル(過去統計・餌) */}
      <SignalRankTeaser
        title="平均騰落率が高いシグナル"
        subtitle="過去統計・3営業日後"
        rows={topMean}
        metric="mean"
        paid={viewer.paid}
      />

      {/* 結果が確定した検知 */}
      {resultEvents.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
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
            <SignalEventTable events={resultEvents} teaser={!viewer.paid} />
            {!viewer.paid && (
              <div className="mt-4 rounded-xl bg-gradient-to-br from-[#fff3e0] to-[#e8f2ff] p-6 text-center">
                <p className="text-sm font-medium">
                  🔒 2営業日後・3営業日後の結果はプレミアム会員限定
                </p>
                <p className="text-xs text-[#6e6e73] mt-1">
                  各シグナルが検知後にどう動いたか、全期間の実績と統計をプレミアムで。
                </p>
                <Link
                  href="/pricing"
                  className="inline-block mt-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
                >
                  プレミアムでできることを見る
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 相場の暦 */}
      {calendar.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
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
