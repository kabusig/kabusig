import { listSignalTypes } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";
import CategoryBadge from "@/components/CategoryBadge";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER = ["classic", "sakata", "legend", "anomaly"];

export default async function SignalsPage() {
  const types = await listSignalTypes();
  const categories = CATEGORY_ORDER.filter((c) =>
    types.some((t) => t.category === c)
  );

  return (
    <div className="space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          シグナル図鑑
        </h1>
        <p className="text-[15px] text-[#6e6e73] mt-3 leading-relaxed">
          本サービスが機械的に検知する「指標の状態」全{types.length}
          種の定義一覧です。各シグナルは状態・形状の検知であり、売買の方向を示すものではありません。
        </p>
      </div>
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="text-2xl font-semibold tracking-tight mb-5">
            {CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {types
              .filter((t) => t.category === cat)
              .map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[15px]">{t.name}</span>
                    <CategoryBadge category={t.category} />
                  </div>
                  <p className="text-sm text-[#424245] leading-relaxed">
                    {t.description}
                  </p>
                  <p className="text-xs text-[#6e6e73] leading-relaxed">
                    {t.origin}
                  </p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
