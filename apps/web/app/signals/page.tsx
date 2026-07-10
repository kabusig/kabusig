import { listSignalTypes } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/constants";
import CategoryBadge from "@/components/CategoryBadge";

export const dynamic = "force-dynamic";

export default function SignalsPage() {
  const types = listSignalTypes();
  const categories = [...new Set(types.map((t) => t.category))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">シグナル図鑑</h1>
        <p className="text-sm text-slate-400 mt-1">
          本サービスが機械的に検知する「指標の状態」の定義一覧です。
          各シグナルは状態・形状の検知であり、売買の方向を示すものではありません。
        </p>
      </div>
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CategoryBadge category={cat} />
            <span>{CATEGORY_LABELS[cat] ?? cat}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {types
              .filter((t) => t.category === cat)
              .map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-slate-800 p-4 space-y-1"
                >
                  <div className="font-semibold">
                    {t.name}
                    {t.is_premium ? (
                      <span className="ml-2 text-xs text-amber-400 border border-amber-800 rounded px-1.5 py-0.5">
                        有料プラン
                      </span>
                    ) : (
                      <span className="ml-2 text-xs text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">
                        無料
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">{t.description}</p>
                  <p className="text-xs text-slate-500">{t.origin}</p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
