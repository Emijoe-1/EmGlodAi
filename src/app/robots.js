export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Don't index login-gated or internal routes — only the public
      // landing page should show up in search results.
      disallow: ["/app", "/login", "/api"],
    },
    sitemap: "https://emglodai.vercel.app/sitemap.xml",
  };
}