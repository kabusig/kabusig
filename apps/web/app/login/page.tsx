import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function passwordLogin(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect(
      "/login?error=" + encodeURIComponent("メールとパスワードを入力してください")
    );
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "メールアドレスまたはパスワードが違います。パスワード未設定の方は「メールでログイン」をご利用ください。"
        )
    );
  }
  redirect("/account");
}

async function sendMagicLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(
      "/login?mode=magic&error=" +
        encodeURIComponent("メールアドレスを入力してください")
    );
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) {
    redirect(`/login?mode=magic&error=${encodeURIComponent(error.message)}`);
  }
  redirect("/login?mode=magic&sent=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; sent?: string; error?: string }>;
}) {
  const viewer = await getViewer();
  if (viewer.loggedIn && !viewer.devMode) redirect("/account");
  const { mode, sent, error } = await searchParams;

  if (!supabaseConfigured()) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">ログイン</h1>
        <p className="text-sm text-[#6e6e73] bg-[#f5f5f7] rounded-xl p-4">
          現在は開発モードで動作しています(全機能閲覧可)。
          本番環境では Supabase を設定するとログインが有効になります。
        </p>
      </div>
    );
  }

  const isMagic = mode === "magic";
  const errorBox = error && (
    <p className="text-sm text-[#d70015] bg-[#fff0f0] rounded-xl p-3">{error}</p>
  );

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-center">
        ログイン / 新規登録
      </h1>

      {isMagic ? (
        /* --- メールでログイン(パスワード不要・新規登録) --- */
        <>
          <p className="text-sm text-[#6e6e73] text-center mt-3">
            メールアドレスにログイン用リンクを送ります。パスワードは不要です。
          </p>
          {sent ? (
            <div className="mt-8 bg-[#e6f7ee] text-[#0a7d43] rounded-2xl p-6 text-sm text-center">
              ログイン用リンクを送信しました。メールをご確認ください。
            </div>
          ) : (
            <form action={sendMagicLink} className="mt-8 space-y-3">
              {errorBox}
              <input
                type="email"
                name="email"
                required
                placeholder="mail@example.com"
                className="w-full bg-white border border-black/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
              />
              <button
                type="submit"
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-3 text-sm font-medium transition-colors"
              >
                ログインリンクを送信
              </button>
            </form>
          )}
          <p className="text-center mt-6 text-sm">
            <Link href="/login" className="text-[#0066cc] hover:underline">
              ← パスワードでログイン
            </Link>
          </p>
        </>
      ) : (
        /* --- パスワードでログイン --- */
        <>
          <p className="text-sm text-[#6e6e73] text-center mt-3">
            メールアドレスとパスワードでログインします。
          </p>
          <form action={passwordLogin} className="mt-8 space-y-3">
            {errorBox}
            <input
              type="email"
              name="email"
              required
              placeholder="mail@example.com"
              className="w-full bg-white border border-black/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
            />
            <input
              type="password"
              name="password"
              required
              placeholder="パスワード"
              className="w-full bg-white border border-black/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
            />
            <button
              type="submit"
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-3 text-sm font-medium transition-colors"
            >
              ログイン
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-[#6e6e73] space-y-1">
            <p>
              初めての方・パスワード未設定の方は
            </p>
            <Link
              href="/login?mode=magic"
              className="text-[#0066cc] hover:underline font-medium"
            >
              メールでログイン / 新規登録 →
            </Link>
            <p className="text-[11px] pt-1">
              (メールでログイン後、アカウントページでパスワードを設定できます)
            </p>
          </div>
        </>
      )}

      <p className="text-[11px] text-[#6e6e73] text-center mt-8">
        登録により
        <a href="/legal/terms" className="text-[#0066cc] hover:underline mx-1">
          利用規約
        </a>
        と
        <a href="/legal/privacy" className="text-[#0066cc] hover:underline mx-1">
          プライバシーポリシー
        </a>
        に同意したものとみなされます。
      </p>
    </div>
  );
}
