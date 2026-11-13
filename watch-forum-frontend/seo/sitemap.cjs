const { escapeHtml } = require('./html.cjs');

function lastmod(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function urlEntry(entry) {
  const lines = ['  <url>', `    <loc>${escapeHtml(entry.loc)}</loc>`];
  const modified = lastmod(entry.lastmod);
  if (modified) lines.push(`    <lastmod>${modified}</lastmod>`);
  lines.push('  </url>');
  return lines.join('\n');
}

function buildSitemap({ siteUrl, sections, posts, threads }) {
  const urls = [
    { loc: `${siteUrl}/` },
    { loc: `${siteUrl}/blog` },
    { loc: `${siteUrl}/members` },
    { loc: `${siteUrl}/shoutbox` },
  ];

  for (const section of sections || []) {
    if (!section.isClickable || !section.slug) continue;
    urls.push({ loc: `${siteUrl}/forum/${encodeURIComponent(section.slug)}` });
  }

  for (const post of posts || []) {
    if (!post || !post.slug) continue;
    urls.push({
      loc: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
      lastmod: post.updatedAt || post.publishedAt,
    });
    const translations = post.translations || {};
    for (const [code, translation] of Object.entries(translations)) {
      if (!translation || !translation.slug || !/^[a-z]{2,3}$/.test(code)) continue;
      urls.push({
        loc: `${siteUrl}/blog/${code}/${encodeURIComponent(translation.slug)}`,
        lastmod: post.updatedAt || post.publishedAt,
      });
    }
  }

  for (const thread of threads || []) {
    const id = thread && (thread.id || thread._id);
    if (!id) continue;
    urls.push({
      loc: `${siteUrl}/thread/${encodeURIComponent(String(id))}`,
      lastmod: thread.updatedAt || thread.lastCommentAt || thread.createdAt,
    });
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls.map(urlEntry).join('\n'),
    '</urlset>',
    '',
  ].join('\n');
}

function robotsTxt(siteUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /messages',
    'Disallow: /admin',
    'Disallow: /new-thread',
    'Disallow: /blog/new$',
    'Disallow: /blog/new/',
    'Disallow: /blog/edit$',
    'Disallow: /blog/edit/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

module.exports = { buildSitemap, robotsTxt, lastmod };
