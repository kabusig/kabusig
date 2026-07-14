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

async function setPassword(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect("/account?pw=short");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  redirect(error ? "/account?pw=error" : "/account?pw=ok");
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer.loggedIn) redirect("/login");
  const { pw } = await searchParams;

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

      {/* パスワード設定(設定すればメール不要でログイン可能に) */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="text-sm font-semibold">パスワードの設定・変更</h2>
        <p className="text-xs text-[#6e6e73] mt-1">
          パスワードを設定すると、次回からメール不要でどの端末でもログインできます。
        </p>
        {pw === "ok" && (
          <p className="text-xs text-[#0a7d43] bg-[#e6f7ee] rounded-lg px-3 py-2 mt-3">
            パスワードを設定しました。次回から使えます。
          </p>
        )}
        {pw === "short" && (
          <p className="text-xs text-[#d70015] bg-[#fff0f0] rounded-lg px-3 py-2 mt-3">
            パスワードは8文字以上で設定してください。
          </p>
        )}
        {pw === "error" && (
          <p className="text-xs text-[#d70015] bg-[#fff0f0] rounded-lg px-3 py-2 mt-3">
            設定に失敗しました。時間をおいて再度お試しください。
          </p>
        )}
        <form action={setPassword} className="flex gap-2 mt-3">
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="新しいパスワード(8文字以上)"
            className="flex-1 bg-[#f5f5f7] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
          />
          <button className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors">
            設定する
          </button>
        </form>
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
