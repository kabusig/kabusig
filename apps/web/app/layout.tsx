import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { DISCLAIMER, SERVICE_NAME, SERVICE_NAME_FULL } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${SERVICE_NAME} | 株式市場シグナルウォッチ`,
    template: `%s | ${SERVICE_NAME}`,
  },
  description:
    "東証プライム全銘柄のテクニカル指標・シグナル検知・決算スケジュールを機械的に通知する情報ツール「カブシグナル」",
};

const NAV = [
  { href: "/", label: "ダッシュボード" },
  { href: "/news", label: "ニュース" },
  { href: "/stocks", label: "銘柄" },
  { href: "/signals", label: "シグナル図鑑" },
  { href: "/stats", label: "統計" },
  { href: "/backtest", label: "バックテスト" },
  { href: "/calendar", label: "相場の暦" },
  { href: "/pricing", label: "プレミアム" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 h-12 flex items-center gap-8 overflow-x-auto">
            <Link
              href="/"
              className="flex items-baseline gap-1.5 whitespace-nowrap"
            >
              <span className="font-semibold text-[15px] tracking-tight">
                {SERVICE_NAME}
              </span>
              <span className="hidden sm:inline text-[10px] text-[#6e6e73]">
                株式市場シグナルウォッチ
              </span>
            </Link>
            <nav className="flex gap-6 text-xs text-[#424245] flex-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="hover:text-black transition-colors whitespace-nowrap"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/account"
              className="text-xs text-[#424245] hover:text-black whitespace-nowrap"
            >
              アカウント
            </Link>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12 w-full flex-1">
          {children}
        </main>
        <footer className="border-t border-black/10 bg-[#f5f5f7]">
          <div className="max-w-6xl mx-auto px-6 py-8 text-[11px] leading-relaxed text-[#6e6e73] space-y-4">
            <p>{DISCLAIMER}</p>
            <div className="flex gap-5 flex-wrap border-t border-black/5 pt-4">
              <Link href="/contact" className="hover:text-black">
                お問い合わせ
              </Link>
              <Link href="/legal/disclaimer" className="hover:text-black">
                免責事項
              </Link>
              <Link href="/legal/terms" className="hover:text-black">
                利用規約
              </Link>
              <Link href="/legal/privacy" className="hover:text-black">
                プライバシーポリシー
              </Link>
              <Link href="/legal/tokushoho" className="hover:text-black">
                特定商取引法に基づく表記
              </Link>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
