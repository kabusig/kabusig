// 日次バッチの起動(Vercel Cron → GitHub Actions を workflow_dispatch で叩く)。
// GitHub のスケジューラは混雑時に数時間遅延・スキップされるため、時刻の正確な
// Vercel Cron をトリガーにし、GitHub 側は実行だけを担当する。
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO ?? "kabusig/kabusig";
const WORKFLOW = "batch-daily.yml";

export async function GET(request: Request) {
  // Vercel Cron の認証(CRON_SECRET 必須。未設定・不一致は拒否=フェイルクローズ)
  // Vercel は CRON_SECRET を設定すると Cron 実行時に自動で Authorization に付与する。
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    console.error("[cron/batch] GITHUB_DISPATCH_TOKEN 未設定");
    return NextResponse.json(
      { error: "GITHUB_DISPATCH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  // 成功時は 204 No Content
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("[cron/batch] dispatch failed:", res.status, detail);
    return NextResponse.json(
      { error: "dispatch failed", status: res.status, detail },
      { status: 502 }
    );
  }

  return NextResponse.json({ dispatched: true, repo: REPO, workflow: WORKFLOW });
}
