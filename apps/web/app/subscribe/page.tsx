// 【特商法対応】Stripe Checkout 直前の最終確認画面。
// 月額料金・課金周期・解約方法・提供内容を明示する(2022年改正対応)。
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import CheckoutButton from "./CheckoutButton";

export const dynamic = "force-dynamic";

const CONFIRM_ITEMS: [string, string][] = [
  ["サービス名", "カブシグナル プレミアム"],
  ["月額料金", "980円(税込)"],
  ["課金周期", "申込日に初回課金、以後毎月同日に自動更新・自動課金"],
  ["支払方法", "クレジットカード(Stripe)"],
  ["提供内容", "全シグナル検知・検知後実績・シグナル統計・バックテスト・LINE通知・監視銘柄管理"],
  ["提供時期", "決済完了後、直ちに利用可能"],
  [
    "解約方法",
    "アカウントページの「お支払い管理ポータル」からいつでも解約可能。解約後は当該課金期間の末日まで利用でき、日割返金はありません。",
  ],
];

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer.loggedIn) redirect("/login");
  if (viewer.paid && !viewer.devMode) redirect("/account");

  const { error } = await searchParams;

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-center">
        お申込み内容の確認
      </h1>
      <p className="text-sm text-[#6e6e73] text-center">
        以下の内容をご確認のうえ、決済へお進みください。
      </p>

      {error && (
        <div className="text-sm text-[#d70015] bg-[#fff0f0] rounded-xl p-4">
          決済を開始できませんでした。時間をおいて再度お試しください。
          <span className="block mt-1 text-[11px] text-[#6e6e73] break-all">
            詳細: {error}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            {CONFIRM_ITEMS.map(([label, value]) => (
              <tr key={label} className="border-b border-black/5 last:border-0">
                <th className="text-left text-[#6e6e73] font-medium px-5 py-3.5 w-28 align-top whitespace-nowrap text-xs">
                  {label}
                </th>
                <td className="px-5 py-3.5 text-[#424245]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action="/api/checkout" method="post" className="space-y-3">
        <CheckoutButton>上記に同意して決済へ進む(Stripe)</CheckoutButton>
        <p className="text-[11px] text-[#6e6e73] text-center">
          <Link href="/legal/tokushoho" className="text-[#0066cc] hover:underline">
            特定商取引法に基づく表記
          </Link>
          ・
          <Link href="/legal/terms" className="text-[#0066cc] hover:underline">
            利用規約
          </Link>
          ・
          <Link href="/legal/privacy" className="text-[#0066cc] hover:underline">
            プライバシーポリシー
          </Link>
        </p>
      </form>
    </div>
  );
}
