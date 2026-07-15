import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://kabusig.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // 公開ページのみ(会員限定・個人用は除外)
  const paths: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/news", priority: 0.9, changeFrequency: "hourly" },
    { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },
    { path: "/signals", priority: 0.7, changeFrequency: "weekly" },
    { path: "/stocks", priority: 0.6, changeFrequency: "daily" },
    { path: "/calendar", priority: 0.5, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.3, changeFrequency: "monthly" },
    { path: "/legal/disclaimer", priority: 0.2, changeFrequency: "yearly" },
    { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/legal/tokushoho", priority: 0.2, changeFrequency: "yearly" },
  ];

  return paths.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
