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
  { href: "/stocks", label: "銘柄一覧" },
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
        <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6 overflow-x-auto">
            <Link href="/" className="font-bold text-lg whitespace-nowrap">
              📈 {SERVICE_NAME}
            </Link>
            <nav className="flex gap-4 text-sm text-slate-300">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="hover:text-white whitespace-nowrap"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-800 mt-10">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-400 space-y-3">
            <p>{DISCLAIMER}</p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/legal/disclaimer" className="hover:text-white">
                免責事項
              </Link>
              <Link href="/legal/terms" className="hover:text-white">
                利用規約
              </Link>
              <Link href="/legal/privacy" className="hover:text-white">
                プライバシーポリシー
              </Link>
              <Link href="/legal/tokushoho" className="hover:text-white">
                特定商取引法に基づく表記
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
