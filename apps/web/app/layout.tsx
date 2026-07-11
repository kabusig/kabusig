import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { DISCLAIMER, SERVICE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: SERVICE_NAME,
  description:
    "日本株のテクニカル指標・シグナル検知履歴・決算スケジュールを機械的に通知する情報ツール",
};

const NAV = [
  { href: "/", label: "ダッシュボード" },
  { href: "/stocks", label: "銘柄" },
  { href: "/signals", label: "シグナル図鑑" },
  { href: "/calendar", label: "相場の暦" },
  { href: "/backtest", label: "バックテスト" },
  { href: "/news", label: "ニュース" },
  { href: "/pricing", label: "料金" },
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
              className="font-semibold text-[15px] tracking-tight whitespace-nowrap"
            >
              {SERVICE_NAME}
            </Link>
            <nav className="flex gap-6 text-xs text-[#424245]">
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
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12 w-full flex-1">
          {children}
        </main>
        <footer className="border-t border-black/10 bg-[#f5f5f7]">
          <div className="max-w-6xl mx-auto px-6 py-8 text-[11px] leading-relaxed text-[#6e6e73] space-y-4">
            <p>{DISCLAIMER}</p>
            <div className="flex gap-5 flex-wrap border-t border-black/5 pt-4">
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
      </body>
    </html>
  );
}
