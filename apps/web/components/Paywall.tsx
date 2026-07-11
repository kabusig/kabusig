import Link from "next/link";

// 有料会員限定コンテンツの案内(未ログイン/未課金時に表示)
export default function Paywall({ feature }: { feature: string }) {
  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-12 text-center max-w-xl mx-auto my-8">
      <div className="text-4xl">🔒</div>
      <h2 className="text-2xl font-semibold tracking-tight mt-4">
        {feature}はプレミアム会員限定です
      </h2>
      <p className="text-sm text-[#6e6e73] mt-3 leading-relaxed">
        プレミアム(月額980円・税込)に登録すると、全シグナル検知・統計・
        バックテスト・LINE通知など、すべての機能をご利用いただけます。
      </p>
      <div className="flex gap-3 justify-center mt-6">
        <Link
          href="/pricing"
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          できることを見る
        </Link>
        <Link
          href="/login"
          className="bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          ログイン
        </Link>
      </div>
    </div>
  );
}
