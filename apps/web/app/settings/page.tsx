import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { listSignalTypes, searchStocks } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";
import Paywall from "@/components/Paywall";

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

async function toggleSignal(formData: FormData) {
  "use server";
  const signalType = String(formData.get("signal_type") ?? "");
  const enabled = formData.get("enabled") === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && signalType) {
    await supabase.from("notification_settings").upsert({
      user_id: user.id,
      signal_type: signalType,
      enabled: !enabled,
    });
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
  let disabled = new Set<string>();
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
      .select("signal_type, enabled")
      .eq("enabled", false);
    disabled = new Set((ns ?? []).map((n) => n.signal_type));
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
        <p className="text-xs text-[#6e6e73]">
          チェックを外したシグナルは通知されません(表示には影響しません)。
        </p>
        {["classic", "sakata", "legend"].map((cat) => (
          <div key={cat}>
            <h3 className="text-sm font-medium text-[#6e6e73] mb-2">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="flex flex-wrap gap-2">
              {types
                .filter((t) => t.category === cat)
                .map((t) => {
                  const enabled = !disabled.has(t.id);
                  return (
                    <form key={t.id} action={toggleSignal}>
                      <input type="hidden" name="signal_type" value={t.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={enabled ? "1" : "0"}
                      />
                      <button
                        className={`text-xs rounded-full px-3.5 py-1.5 font-medium transition-colors ${
                          enabled
                            ? "bg-[#1d1d1f] text-white"
                            : "bg-[#f5f5f7] text-[#6e6e73] line-through"
                        }`}
                      >
                        {t.name}
                      </button>
                    </form>
                  );
                })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
