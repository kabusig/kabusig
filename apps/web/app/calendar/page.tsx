import { recentCalendarEvents } from "@/lib/db";
import { ANOMALY_NOTE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const events = recentCalendarEvents(60);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">相場の暦・アノマリーカレンダー</h1>
        <p className="text-sm text-slate-400 mt-1">
          「節分天井・彼岸底」「Sell in May」など、古くから語り継がれてきた
          相場格言・アノマリーに関連する暦日を紹介します。
        </p>
        <p className="text-xs text-emerald-400/80 mt-2 border border-emerald-900 rounded p-2">
          {ANOMALY_NOTE}
          過去の統計はバックテスト機能で客観的に確認できます。
        </p>
      </div>
      <ul className="space-y-3">
        {events.map((e) => (
          <li
            key={`${e.event_type}-${e.date}`}
            className="rounded-lg border border-slate-800 p-4"
          >
            <div className="text-xs text-slate-400">{e.date}</div>
            <div className="font-semibold mt-0.5">{e.title}</div>
            <p className="text-sm text-slate-300 mt-1">{e.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
