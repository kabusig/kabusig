import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://kabusig.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 非公開・個人用ページはクロール対象外
      disallow: ["/account", "/settings", "/subscribe", "/login", "/api/", "/auth/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
