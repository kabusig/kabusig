"use client";

import { useState, useTransition } from "react";
import { setSignalMode, type SignalMode } from "./actions";
import { CATEGORY_LABELS } from "@/lib/constants";

type Sig = { id: string; name: string; category: string };

const CATEGORY_ORDER = ["classic", "sakata", "legend"];
const MODES: { key: SignalMode; label: string }[] = [
  { key: "off", label: "しない" },
  { key: "watch", label: "監視のみ" },
  { key: "all", label: "全銘柄" },
];

export default function SignalToggles({
  types,
  initialModes,
}: {
  types: Sig[];
  initialModes: Record<string, SignalMode>;
}) {
  // タップで即座に見た目を反映し、保存はバックグラウンドで行う
  const [modes, setModes] = useState<Record<string, SignalMode>>(initialModes);
  const [, startTransition] = useTransition();

  const setMode = (id: string, mode: SignalMode) => {
    setModes((prev) => ({ ...prev, [id]: mode }));
    startTransition(() => {
      setSignalMode(id, mode);
    });
  };

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.filter((cat) =>
        types.some((t) => t.category === cat)
      ).map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-medium text-[#6e6e73] mb-2">
            {CATEGORY_LABELS[cat]}
          </h3>
          <div className="space-y-1.5">
            {types
              .filter((t) => t.category === cat)
              .map((t) => {
                const mode = modes[t.id] ?? "watch";
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 bg-white rounded-xl border border-black/5 px-4 py-2"
                  >
                    <span className="text-sm">{t.name}</span>
                    <div className="flex rounded-full bg-[#f5f5f7] p-0.5 shrink-0">
                      {MODES.map((m) => {
                        const active = mode === m.key;
                        const activeColor =
                          m.key === "all"
                            ? "bg-[#0071e3] text-white"
                            : m.key === "watch"
                              ? "bg-[#1d1d1f] text-white"
                              : "bg-[#8e8e93] text-white";
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setMode(t.id, m.key)}
                            className={`text-xs rounded-full px-3 py-1 font-medium transition-colors ${
                              active ? activeColor : "text-[#6e6e73]"
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
