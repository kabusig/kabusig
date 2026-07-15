import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// SNSシェア用OGP画像。「シグナル検知」風・銘柄名はモザイク。
export const runtime = "nodejs";
export const alt = "カブシグナル｜市場を、事実で見る。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "app/_og/NotoSansJP.ttf")),
    readFile(join(process.cwd(), "app/_og/NotoSansJP-Bold.ttf")),
  ]);

  const rows = [
    { date: "2026-07-14", cat: "古典テクニカル", color: "#0071e3", signal: "ゴールデンクロス" },
    { date: "2026-07-14", cat: "著名分析家由来", color: "#a855f7", signal: "一目均衡表・三役好転" },
    { date: "2026-07-14", cat: "古典テクニカル", color: "#0071e3", signal: "出来高急増" },
    { date: "2026-07-14", cat: "酒田五法", color: "#f59e0b", signal: "三空叩き込み" },
  ];
  const mosaic = ["#c7c9cc", "#b8babd", "#d0d2d5", "#aeb0b3", "#c2c4c7", "#bcbec1", "#cacccf"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg,#ffffff 0%,#eaeef4 100%)",
          padding: "52px 60px",
          fontFamily: "Noto Sans JP",
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg,#9aa0a6,#33363b)",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            ↑
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#1d1d1f" }}>
              カブシグナル
            </div>
            <div style={{ fontSize: 15, color: "#6e6e73" }}>
              株式市場シグナルウォッチ
            </div>
          </div>
        </div>

        {/* 見出し */}
        <div
          style={{
            display: "flex",
            marginTop: 26,
            marginBottom: 20,
            fontSize: 50,
            fontWeight: 700,
            color: "#1d1d1f",
          }}
        >
          市場を、事実で見る。
        </div>

        {/* カード(シグナル検知風) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.06)",
            padding: "24px 30px",
            boxShadow: "0 12px 34px rgba(0,0,0,0.07)",
            flexGrow: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#1d1d1f" }}>
              シグナル検知
            </div>
            <div style={{ display: "flex", fontSize: 16, color: "#6e6e73" }}>
              2026-07-14 は 770 件
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "11px 0",
                borderTop: i ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
              }}
            >
              <div style={{ display: "flex", fontSize: 15, color: "#6e6e73", width: 108 }}>
                {r.date}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  color: "#ffffff",
                  background: r.color,
                  borderRadius: 999,
                  padding: "4px 13px",
                }}
              >
                {r.cat}
              </div>
              {/* 銘柄名モザイク */}
              <div style={{ display: "flex", gap: 3, width: 154 }}>
                {mosaic.map((c, j) => (
                  <div
                    key={j}
                    style={{ display: "flex", width: 19, height: 19, borderRadius: 3, background: c }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#1d1d1f", flexGrow: 1 }}>
                {r.signal}
              </div>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 21, fontWeight: 700, color: "#0071e3" }}>
            kabusig.com
          </div>
          <div style={{ display: "flex", fontSize: 14, color: "#6e6e73" }}>
            東証プライム全銘柄 × 33種のシグナルを毎日チェック
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
