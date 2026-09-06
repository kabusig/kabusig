// 会員申込ページ。決済手段に応じて表示を切り替える。
// - カード決済(将来再開時): 特商法確認 → Checkout
// - 銀行振込(現行): 年会費の振込申込フロー
// - どちらも無効: 準備中
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import {
  PAYMENTS_ENABLED,
  BANK_TRANSFER_ENABLED,
  ANNUAL_FEE_YEN,
  BANK_INFO,
  bankInfoConfigured,
  CONTACT_EMAIL,
} from "@/lib/constants";
import CheckoutButton from "./CheckoutButton";
import { applyBankTransfer } from "./actions";

export const dynamic = "force-dynamic";

const CONFIRM_ITEMS: [string, string][] = [
  ["サービス名", "カブシグナル プレミアム"],
  ["月額料金", "980円(税込)"],
  ["課金周期", "申込日に初回課金、以後毎月同日に自動更新・自動課金"],
  ["支払方法", "クレジットカード"],
  ["提供内容", "全シグナル検知・検知後実績・シグナル統計・バックテスト・LINE通知・監視銘柄管理"],
  ["提供時期", "決済完了後、直ちに利用可能"],
  [
    "解約方法",
    "アカウントページからいつでも解約可能。解約後は当該課金期間の末日まで利用でき、日割返金はありません。",
  ],
];

const BENEFITS = [
  "全シグナル検知(33種)の閲覧",
  "検知後 1〜3営業日の値動き実績",
  "シグナル別の過去統計・バックテスト",
  "銘柄チャート・LINE通知・監視銘柄の管理",
];

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; applied?: string; err?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer.loggedIn) redirect("/login");
  if (viewer.paid && !viewer.devMode) redirect("/account");

  const { error, applied, err } = await searchParams;

  // ── 1) カード決済(将来再開時) ──
  if (PAYMENTS_ENABLED) {
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
          <CheckoutButton>上記に同意して決済へ進む</CheckoutButton>
          <p className="text-[11px] text-[#6e6e73] text-center">
            <Link href="/legal/tokushoho" className="text-[#0066cc] hover:underline">
              特定商取引法に基づく表記
            </Link>
          </p>
        </form>
      </div>
    );
  }

  // ── 2) 銀行振込(年会費・前払い) ──
  if (BANK_TRANSFER_ENABLED && bankInfoConfigured()) {
    // 確認待ちの申込があるか
    let hasPending = false;
    if (supabaseConfigured()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("membership_orders")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .limit(1);
        hasPending = Boolean(data && data.length > 0);
      }
    }

    const fee = ANNUAL_FEE_YEN.toLocaleString();
    const BankBox = (
      <div className="bg-[#f5f7fa] rounded-xl p-5 text-sm space-y-1.5">
        <div className="font-semibold text-[#1d1d1f] mb-2">お振込先</div>
        <div>金融機関: {BANK_INFO.bankName} {BANK_INFO.branch}</div>
        <div>
          口座: {BANK_INFO.accountType} {BANK_INFO.accountNumber}
        </div>
        <div>口座名義: {BANK_INFO.holder}</div>
        <div className="pt-1 font-semibold">
          金額: {fee}円(年会費・税込)
        </div>
        <p className="text-[11px] text-[#6e6e73] pt-1">
          ※振込手数料はお客様負担です。ご入金の確認後、1〜3営業日で
          プレミアムが有効になります(有効期限はご入金日から1年間)。
        </p>
      </div>
    );

    if (applied || hasPending) {
      return (
        <div className="max-w-lg mx-auto py-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="text-4xl">📩</div>
            <h1 className="text-2xl font-semibold tracking-tight">
              お申し込みを受け付けました
            </h1>
            <p className="text-sm text-[#6e6e73]">
              下記口座へ<strong>7日以内</strong>にお振込みください。
              入金を確認しだい、プレミアムを有効化します。
            </p>
          </div>
          {BankBox}
          <div className="bg-[#fff8e6] rounded-xl p-4 text-xs text-[#8a6d00] leading-relaxed">
            <strong>照合のお願い:</strong>{" "}
            お申し込み時に入力いただいた「振込名義(カナ)」でご入金ください。
            名義が異なると入金確認ができない場合があります。名義を変えて振り込む
            場合は {CONTACT_EMAIL} までご連絡ください。
          </div>
          <div className="text-center">
            <Link
              href="/account"
              className="text-sm text-[#0066cc] hover:underline"
            >
              アカウントページへ →
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            プレミアム年会費のお申し込み
          </h1>
          <p className="text-sm text-[#6e6e73]">
            銀行振込による年額プランです。1回のお振込みで1年間ご利用いただけます。
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
          <div className="text-center">
            <span className="text-4xl font-semibold tracking-tight">{fee}</span>
            <span className="text-[#6e6e73] ml-1.5">円 / 年(税込)</span>
          </div>
          <ul className="text-sm text-[#424245] space-y-1.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-[#0071e3]">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {err === "name" && (
          <p className="text-sm text-[#d70015] bg-[#fff0f0] rounded-xl p-3">
            振込名義(カナ)を入力してください。
          </p>
        )}

        <form action={applyBankTransfer} className="space-y-3">
          <label className="block text-sm">
            <span className="text-[#6e6e73] text-xs">
              振込名義(カナ)— 入金の照合に使います
            </span>
            <input
              type="text"
              name="transfer_name"
              required
              placeholder="例: カブ タロウ"
              className="mt-1 w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-3.5 text-sm font-medium transition-colors"
          >
            この内容で申し込む(振込先を表示)
          </button>
          <p className="text-[11px] text-[#6e6e73] text-center">
            申し込むと振込先口座が表示されます。ご入金の確認後に有効化されます。
            <br />
            <Link href="/legal/tokushoho" className="text-[#0066cc] hover:underline">
              特定商取引法に基づく表記
            </Link>
          </p>
        </form>
      </div>
    );
  }

  // ── 3) それ以外は準備中 ──
  return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-5">
      <div className="text-4xl">🛠️</div>
      <h1 className="text-2xl font-semibold tracking-tight">
        ただいまお申し込みを準備中です
      </h1>
      <p className="text-sm text-[#6e6e73] leading-relaxed">
        決済手段の切替のため、プレミアムの新規お申し込みを一時停止しています。
        準備が整い次第、再開いたします。
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <Link
          href="/"
          className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          トップへ戻る
        </Link>
        <Link
          href="/news"
          className="bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
        >
          ニュースを見る
        </Link>
      </div>
    </div>
  );
}
