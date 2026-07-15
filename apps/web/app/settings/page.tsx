import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { listSignalTypes, searchStocks } from "@/lib/data";
import Paywall from "@/components/Paywall";
import SignalToggles from "./SignalToggles";
import type { SignalMode } from "./actions";

export const dynamic = "force-dynamic";

async function addToWatchlist(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && code) {
    await supabase.from("watchlists").insert({ user_id: user.id, code });
  }
  revalidatePath("/settings");
}

async function removeFromWatchlist(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && code) {
    await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", user.id)
      .eq("code", code);
  }
  revalidatePath("/settings");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer.loggedIn && !viewer.devMode) redirect("/login");
  if (!viewer.paid) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">通知設定</h1>
        <Paywall feature="監視銘柄・LINE通知設定" />
      </div>
    );
  }

  const { q = "" } = await searchParams;
  const types = await listSignalTypes();

  let watchlist: { code: string; name: string }[] = [];
  const modeMap: Record<string, SignalMode> = {};
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const { data: wl } = await supabase
      .from("watchlists")
      .select("code, stocks(name)")
      .order("code");
    watchlist = (wl ?? []).map((w) => ({
      code: w.code,
      name:
        (w.stocks as unknown as { name: string } | null)?.name ?? "",
    }));
    const { data: ns } = await supabase
      .from("notification_settings")
      .select("signal_type, enabled, all_stocks");
    for (const n of ns ?? []) {
      modeMap[n.signal_type] = !n.enabled
        ? "off"
        : n.all_stocks
          ? "all"
          : "watch";
    }
  }

  const searchResults = q ? await searchStocks(q, 10) : [];
  const watchSet = new Set(watchlist.map((w) => w.code));

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">
          監視銘柄・通知設定
        </h1>
        <p className="text-sm text-[#6e6e73] mt-2">
          監視銘柄のシグナル検知をLINEに通知します(最大50銘柄)。
          {!viewer.lineLinked && (
            <>
              {" "}
              <Link href="/account" className="text-[#0066cc] hover:underline">
                LINE連携はこちら →
              </Link>
            </>
          )}
        </p>
        {viewer.devMode && (
          <p className="text-xs text-[#b25000] bg-[#fff3e0] rounded-xl p-3 mt-3">
            開発モードのため設定の保存は本番環境(Supabase設定後)で有効になります。
          </p>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          監視銘柄({watchlist.length}/50)
        </h2>
        <form method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="銘柄名・コードで検索して追加"
            className="bg-white border border-black/10 rounded-full px-5 py-2.5 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50"
          />
          <button className="bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full px-5 py-2.5 text-sm font-medium">
            検索
          </button>
        </form>
        {searchResults.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm divide-y divide-black/5">
            {searchResults.map((s) => (
              <div
                key={s.code}
                className="px-5 py-3 flex justify-between items-center text-sm"
              >
                <span>
                  {s.code} {s.name}
                </span>
                {watchSet.has(s.code) ? (
                  <span className="text-xs text-[#6e6e73]">追加済み</span>
                ) : (
                  <form action={addToWatchlist}>
                    <input type="hidden" name="code" value={s.code} />
                    <button className="text-xs text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full px-3 py-1">
                      追加
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
        {watchlist.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {watchlist.map((w) => (
              <form
                key={w.code}
                action={removeFromWatchlist}
                className="bg-white rounded-full border border-black/10 pl-4 pr-2 py-1.5 text-sm flex items-center gap-2"
              >
                <span>
                  {w.code} {w.name}
                </span>
                <input type="hidden" name="code" value={w.code} />
                <button
                  className="text-[#6e6e73] hover:text-[#d70015] text-xs rounded-full w-5 h-5 bg-[#f5f5f7]"
                  title="削除"
                >
                  ✕
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6e6e73]">
            監視銘柄はまだありません。検索して追加してください。
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          通知するシグナル
        </h2>
        <div className="text-xs text-[#6e6e73] space-y-1 bg-[#f5f5f7] rounded-xl px-4 py-3">
          <p>タップで即座に切り替わります(表示には影響しません)。</p>
          <p>
            <span className="font-medium text-[#1d1d1f]">監視のみ</span>
            = 上の監視銘柄で検知したときだけ通知 /
            <span className="font-medium text-[#0071e3]"> 全銘柄</span>
            = 監視銘柄に関係なく、その1シグナルが東証プライム全銘柄で出たら通知 /
            <span className="font-medium"> しない</span>
            = 通知しない
          </p>
          <p className="text-[#b25000]">
            ※「全銘柄」は発生頻度の高いシグナルだと通知が非常に多くなります。ゴールデンクロス等の高頻度シグナルより、発生の少ないシグナル向けです。
          </p>
        </div>
        <SignalToggles types={types} initialModes={modeMap} />
      </section>
    </div>
  );
}
