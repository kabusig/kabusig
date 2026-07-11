import { recentCalendarEvents } from "@/lib/db";
import { ANOMALY_NOTE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const events = recentCalendarEvents(60);

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          相場の暦・アノマリーカレンダー
        </h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 leading-relaxed">
          「節分天井・彼岸底」「Sell in May」など、古くから語り継がれてきた
          相場格言・アノマリーに関連する暦日を紹介します。
        </p>
        <p className="text-xs text-[#6e6e73] mt-3 bg-[#f5f5f7] rounded-xl px-4 py-3">
          {ANOMALY_NOTE}
          過去の統計はバックテスト機能で客観的に確認できます。
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {events.map((e) => (
          <div
            key={`${e.event_type}-${e.date}`}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-6"
          >
            <div className="text-[11px] text-[#6e6e73]">{e.date}</div>
            <div className="font-semibold text-[15px] mt-1">{e.title}</div>
            <p className="text-sm text-[#424245] mt-2 leading-relaxed">
              {e.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
