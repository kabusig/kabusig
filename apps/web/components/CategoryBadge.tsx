import { CATEGORY_LABELS } from "@/lib/constants";

const COLORS: Record<string, string> = {
  classic: "bg-sky-900 text-sky-200",
  sakata: "bg-amber-900 text-amber-200",
  legend: "bg-purple-900 text-purple-200",
  anomaly: "bg-emerald-900 text-emerald-200",
};

export default function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs whitespace-nowrap ${
        COLORS[category] ?? "bg-slate-800 text-slate-300"
      }`}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
