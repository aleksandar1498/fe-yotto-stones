/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: "https://www.yottostones-bg.com",
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: "weekly",
  priority: 0.7,
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
  },
  alternateRefs: [
    {
      href: "https://www.yottostones-bg.com",
      hreflang: "bg",
    },
    // Future: Add EN / DE versions
  ],
};
