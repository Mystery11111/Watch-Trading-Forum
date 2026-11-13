/**
 * Writes dist/sitemap.xml after `vite build` so a Render static site serves
 * real XML even before the Node SEO server is enabled. API failures fall
 * back to static pages and forum sections.
 */
const fs = require('fs');
const path = require('path');
const { resolveApiBase, resolveSiteUrl } = require('../site-url.cjs');
const { fetchJson } = require('../seo/data.cjs');
const { loadSections } = require('../seo/sections.cjs');
const { buildSitemap } = require('../seo/sitemap.cjs');

async function loadLiveCatalog(apiBase) {
  const posts = [];
  const threads = [];
  try {
    const blog = await fetchJson(`${apiBase}/blog`, 15000);
    if (Array.isArray(blog)) posts.push(...blog);
  } catch (error) {
    console.warn(`[seo] Blog API skipped for build sitemap: ${error.message}`);
  }
  try {
    const payload = await fetchJson(`${apiBase}/threads`, 15000);
    if (payload && Array.isArray(payload.threads)) threads.push(...payload.threads);
  } catch (error) {
    console.warn(`[seo] Threads API skipped for build sitemap: ${error.message}`);
  }
  return { posts, threads };
}

async function generateSitemapFile() {
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    console.warn('[seo] dist/ does not exist yet; sitemap not written.');
    return;
  }
  const siteUrl = resolveSiteUrl(process.env);
  const apiBase = resolveApiBase(process.env);
  const sections = loadSections();
  const { posts, threads } = await loadLiveCatalog(apiBase);
  const xml = buildSitemap({ siteUrl, sections, posts, threads });
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml);
  console.log(
    `[seo] Wrote dist/sitemap.xml (${sections.filter((section) => section.isClickable).length} sections, ${posts.length} posts, ${threads.length} threads).`,
  );
}

if (require.main === module) {
  generateSitemapFile().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { generateSitemapFile };
