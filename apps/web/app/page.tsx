import Link from "next/link";
import {
  listStocks,
  recentSignalEvents,
  recentCalendarEvents,
} from "@/lib/db";
import { ANOMALY_NOTE } from "@/lib/constants";
import SignalEventTable from "@/components/SignalEventTable";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const events = recentSignalEvents(50);
  const calendar = recentCalendarEvents(5);
  const stocks = listStocks();
  const latestDate = events[0]?.date;
  const todayCount = events.filter((e) => e.date === latestDate).length;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-1">ダッシュボード</h1>
        <p className="text-sm text-slate-400">
          テクニカル指標の状態を機械的に検知し、客観的事実として表示します。
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-800 p-4">
          <div className="text-slate-400 text-xs">監視銘柄数</div>
          <div className="text-2xl font-bold">{stocks.length}</div>
        </div>
        <div className="rounded-lg border border-slate-800 p-4">
          <div className="text-slate-400 text-xs">
            直近検知日({latestDate ?? "-"})の検知数
          </div>
          <div className="text-2xl font-bold">{todayCount}</div>
        </div>
        <div className="rounded-lg border border-slate-800 p-4">
          <div className="text-slate-400 text-xs">シグナル定義数</div>
          <div className="text-2xl font-bold">
            <Link href="/signals" className="hover:underline">
              33種
            </Link>
          </div>
        </div>
      </section>

      {calendar.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">相場の暦(直近)</h2>
          <ul className="space-y-2">
            {calendar.map((c) => (
              <li
                key={`${c.event_type}-${c.date}`}
                className="rounded border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm"
              >
                <span className="text-slate-400 mr-2">{c.date}</span>
                {c.title}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-2">{ANOMALY_NOTE}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">シグナル検知履歴(最新50件)</h2>
        <SignalEventTable events={events} />
      </section>
    </div>
  );
}
