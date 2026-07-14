"use client";

import { useState, useTransition } from "react";
import { setSignalEnabled } from "./actions";
import { CATEGORY_LABELS } from "@/lib/constants";

type Sig = { id: string; name: string; category: string };

const CATEGORY_ORDER = ["classic", "sakata", "legend"];

export default function SignalToggles({
  types,
  initialDisabled,
}: {
  types: Sig[];
  initialDisabled: string[];
}) {
  // タップで即座に見た目を反映し、保存はバックグラウンドで行う
  const [disabled, setDisabled] = useState<Set<string>>(
    new Set(initialDisabled)
  );
  const [, startTransition] = useTransition();

  const toggle = (id: string) => {
    const willEnable = disabled.has(id); // 現在OFF → ONにする
    setDisabled((prev) => {
      const next = new Set(prev);
      if (willEnable) next.delete(id);
      else next.add(id);
      return next;
    });
    startTransition(() => {
      setSignalEnabled(id, willEnable);
    });
  };

  return (
    <div className="space-y-4">
      {CATEGORY_ORDER.filter((cat) =>
        types.some((t) => t.category === cat)
      ).map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-medium text-[#6e6e73] mb-2">
            {CATEGORY_LABELS[cat]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {types
              .filter((t) => t.category === cat)
              .map((t) => {
                const enabled = !disabled.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                      enabled
                        ? "bg-[#1d1d1f] text-white"
                        : "bg-[#f5f5f7] text-[#6e6e73] line-through"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
