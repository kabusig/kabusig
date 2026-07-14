import Link from "next/link";

// 監視銘柄・LINE通知設定への目立つ導線(LINEカラー)
export default function NotifyButton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Link
      href="/settings"
      className={`inline-flex items-center gap-2 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors ${className}`}
    >
      🔔 監視銘柄・LINE通知を設定
    </Link>
  );
}
