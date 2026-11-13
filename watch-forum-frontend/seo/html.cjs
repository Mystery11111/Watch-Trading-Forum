const { SITE_NAME } = require('../site-url.cjs');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clip(value, max) {
  const clean = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function absoluteUrl(siteUrl, value, fallbackPath = '/opengraph.jpg') {
  const fallback = `${siteUrl}${fallbackPath}`;
  if (!value) return fallback;
  const raw = String(value).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${siteUrl}${raw}`;
  return `${siteUrl}/${raw}`;
}

function sanitizeArticleHtml(html) {
  return String(html ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<\/(?:body|html|head)\s*>/gi, '');
}

function articleBody(content) {
  const raw = String(content ?? '');
  if (!raw.trim()) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeArticleHtml(raw);
  return `<p>${escapeHtml(raw)}</p>`;
}

function jsonLdScript(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json" data-seo-server="true">${json}</script>`;
}

function metaTag(attrs) {
  const parts = Object.entries(attrs)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');
  return `<meta ${parts} data-seo-server="true" />`;
}

function linkTag(attrs) {
  const parts = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');
  return `<link ${parts} data-seo-server="true" />`;
}

function renderHead(page) {
  const tags = [
    metaTag({ name: 'description', content: page.description }),
    linkTag({ rel: 'canonical', href: page.canonical }),
  ];
  if (page.robots) tags.push(metaTag({ name: 'robots', content: page.robots }));
  tags.push(
    metaTag({ property: 'og:site_name', content: SITE_NAME }),
    metaTag({ property: 'og:title', content: page.title }),
    metaTag({ property: 'og:description', content: page.description }),
    metaTag({ property: 'og:type', content: page.ogType || 'website' }),
    metaTag({ property: 'og:url', content: page.canonical }),
    metaTag({ property: 'og:image', content: page.image }),
    metaTag({ name: 'twitter:card', content: 'summary_large_image' }),
    metaTag({ name: 'twitter:title', content: page.title }),
    metaTag({ name: 'twitter:description', content: page.description }),
    metaTag({ name: 'twitter:image', content: page.image }),
  );
  for (const alt of page.alternates || []) {
    tags.push(linkTag({ rel: 'alternate', hreflang: alt.hreflang, href: alt.href }));
  }
  if (page.jsonLd) tags.push(jsonLdScript(page.jsonLd));
  return tags.join('\n');
}

function injectDocument(template, page) {
  let html = String(template);
  const title = escapeHtml(page.title || SITE_NAME);
  if (/<title>[\s\S]*?<\/title>/.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  } else {
    html = html.replace('</head>', `<title>${title}</title>\n</head>`);
  }
  html = html.replace('</head>', `${renderHead(page)}\n</head>`);
  const snapshot = page.bodyHtml
    ? `<div id="seo-prerender">${page.bodyHtml}</div><script>var seoNode=document.getElementById("seo-prerender");if(seoNode)seoNode.remove();</script>\n`
    : '';
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', `${snapshot}<div id="root"></div>`);
  } else {
    html = html.replace(/<div id="root"[^>]*>/, (match) => `${snapshot}${match}`);
  }
  return html;
}

function textPage(title, paragraphs, links) {
  const body = (paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const list = (links || [])
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.text)}</a></li>`)
    .join('');
  return `<article><h1>${escapeHtml(title)}</h1>${body}${list ? `<ul>${list}</ul>` : ''}</article>`;
}

module.exports = {
  escapeHtml,
  stripTags,
  clip,
  absoluteUrl,
  sanitizeArticleHtml,
  articleBody,
  injectDocument,
  textPage,
};
