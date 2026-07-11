import { CATEGORY_LABELS } from "@/lib/constants";

const COLORS: Record<string, string> = {
  classic: "bg-[#e8f2ff] text-[#0066cc]",
  sakata: "bg-[#fff3e0] text-[#b25000]",
  legend: "bg-[#f3e8ff] text-[#7c3aed]",
  anomaly: "bg-[#e6f7ee] text-[#0a7d43]",
};

export default function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
        COLORS[category] ?? "bg-[#f5f5f7] text-[#6e6e73]"
      }`}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
