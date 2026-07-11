import Link from "next/link";
import {
  countStocks,
  latestSignalStats,
  recentSignalEvents,
  recentCalendarEvents,
  listSignalTypes,
} from "@/lib/db";
import { ANOMALY_NOTE } from "@/lib/constants";
import SignalEventTable from "@/components/SignalEventTable";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const events = recentSignalEvents(50);
  const calendar = recentCalendarEvents(4);
  const stockCount = countStocks();
  const signalCount = listSignalTypes().length;
  const { date: latestDate, count: todayCount } = latestSignalStats();

  return (
    <div className="space-y-14">
      <section className="text-center pt-6 pb-2">
        <h1 className="text-5xl font-semibold tracking-tight">
          市場を、事実で見る。
        </h1>
        <p className="text-lg text-[#6e6e73] mt-4 max-w-xl mx-auto leading-relaxed">
          東証プライム{stockCount.toLocaleString()}
          銘柄のテクニカル指標を毎日機械的にチェックし、
          条件に一致した事実だけをお届けします。
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
        {[
          ["監視銘柄", `${stockCount.toLocaleString()}`, "/stocks"],
          [
            `直近検知(${latestDate ?? "-"})`,
            `${todayCount.toLocaleString()}`,
            "/backtest",
          ],
          ["シグナル定義", `${signalCount}種`, "/signals"],
        ].map(([label, value, href]) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="text-3xl font-semibold tracking-tight">
              {value}
            </div>
            <div className="text-xs text-[#6e6e73] mt-1">{label}</div>
          </Link>
        ))}
      </section>

      {calendar.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">
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

      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          シグナル検知履歴
          <span className="text-sm font-normal text-[#6e6e73] ml-3">
            最新50件
          </span>
        </h2>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <SignalEventTable events={events} />
        </div>
      </section>
    </div>
  );
}
