import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer.loggedIn) redirect("/login");

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">アカウント</h1>

      {viewer.devMode && (
        <p className="text-xs text-[#b25000] bg-[#fff3e0] rounded-xl p-3">
          開発モードで動作中です(Supabase未設定)。以下は本番環境での表示例です。
        </p>
      )}

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm divide-y divide-black/5">
        <div className="px-6 py-4 flex justify-between items-center">
          <span className="text-sm text-[#6e6e73]">メールアドレス</span>
          <span className="text-sm font-medium">{viewer.email}</span>
        </div>
        <div className="px-6 py-4 flex justify-between items-center">
          <span className="text-sm text-[#6e6e73]">プラン</span>
          {viewer.paid ? (
            <span className="text-xs font-medium text-[#0a7d43] bg-[#e6f7ee] rounded-full px-3 py-1">
              プレミアム
            </span>
          ) : (
            <Link
              href="/subscribe"
              className="text-xs font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full px-3 py-1 transition-colors"
            >
              プレミアムに登録する
            </Link>
          )}
        </div>
        <div className="px-6 py-4 flex justify-between items-center">
          <span className="text-sm text-[#6e6e73]">LINE通知</span>
          {viewer.lineLinked ? (
            <span className="text-xs font-medium text-[#0a7d43] bg-[#e6f7ee] rounded-full px-3 py-1">
              連携済み
            </span>
          ) : (
            <a
              href="/api/line/login"
              className="text-xs font-medium text-white bg-[#06c755] hover:bg-[#05b34c] rounded-full px-3 py-1 transition-colors"
            >
              LINEと連携する
            </a>
          )}
        </div>
        {viewer.paid && (
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-sm text-[#6e6e73]">お支払い・解約</span>
            <form action="/api/portal" method="post">
              <button className="text-xs text-[#0066cc] hover:underline">
                お支払い管理ポータルを開く
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-5">
          <Link
            href="/settings"
            className="text-sm text-[#0066cc] hover:underline"
          >
            監視銘柄・通知設定 →
          </Link>
          <Link
            href="/contact"
            className="text-sm text-[#0066cc] hover:underline"
          >
            お問い合わせ →
          </Link>
        </div>
        <form action={signOut}>
          <button className="text-sm text-[#6e6e73] hover:text-black">
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}
