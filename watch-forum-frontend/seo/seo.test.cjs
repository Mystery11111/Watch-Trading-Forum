const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { classifyHost, redirectTarget } = require('./host.cjs');
const { injectDocument } = require('./html.cjs');
const { matchRoute, renderPath } = require('./pages.cjs');
const { loadSections, parseSections } = require('./sections.cjs');
const { buildSitemap, robotsTxt } = require('./sitemap.cjs');
const { resolveSiteUrl } = require('../site-url.cjs');
const { BLOG_DESCRIPTION, BLOG_TITLE, HOME_DESCRIPTION, HOME_TITLE, metaForSection } = require('./meta.cjs');
const { createApp } = require('../server.cjs');

const SITE = 'https://watchtradingforums.com';
const TEMPLATE = '<!DOCTYPE html><html><head><title>Watch Trading Forums</title></head><body><div id="root"></div></body></html>';

const catalog = {
  postsOk: true,
  threadsOk: true,
  posts: [
    {
      id: 'post-1',
      title: 'Rolex Guide',
      slug: 'rolex-guide',
      excerpt: 'How to buy a Rolex.',
      content: '<p>Full article body about Rolex.</p><script>alert(1)</script>',
      authorName: 'Ada',
      metaTitle: 'Rolex Buying Guide',
      metaDescription: 'A guide to buying Rolex watches.',
      publishedAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-06-01T00:00:00.000Z',
      tags: ['Rolex'],
      featuredImage: 'https://cdn.example.com/rolex.jpg',
      translations: {
        fr: {
          title: 'Guide Rolex',
          slug: 'guide-rolex',
          excerpt: 'Comment acheter une Rolex.',
          content: '<p>Article français.</p>',
          metaTitle: 'Guide Rolex FR',
          metaDescription: 'Description française pour Rolex.',
        },
      },
    },
  ],
  threads: [
    {
      id: 'thread-1',
      title: 'Daytona for sale',
      content: 'Selling a clean Daytona in London.',
      authorName: 'Bea',
      sectionId: 'sec-rolex',
      commentCount: 3,
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-04-02T00:00:00.000Z',
    },
  ],
};

function pageFor(pathname) {
  const sections = loadSections();
  return renderPath(pathname, { siteUrl: SITE, sections, catalog });
}

test('site URL defaults to the production origin and strips a trailing slash', () => {
  assert.strictEqual(resolveSiteUrl({}), SITE);
  assert.strictEqual(resolveSiteUrl({ SITE_URL: 'https://example.com/' }), 'https://example.com');
  assert.strictEqual(resolveSiteUrl({ VITE_SITE_URL: 'https://preview.example.com' }), 'https://preview.example.com');
});

test('host classification prefers the forwarded production host', () => {
  assert.strictEqual(classifyHost({ headers: { host: 'watchtradingforums.com' } }), 'production');
  assert.strictEqual(classifyHost({ headers: { host: 'www.watchtradingforums.com' } }), 'production');
  assert.strictEqual(
    classifyHost({ headers: { host: 'watch-trading-forum.onrender.com' } }),
    'onrender',
  );
  assert.strictEqual(
    classifyHost({
      headers: {
        host: 'watch-trading-forum.onrender.com',
        'x-forwarded-host': 'watchtradingforums.com',
      },
    }),
    'production',
  );
  assert.strictEqual(classifyHost({ headers: { host: 'localhost:4173' } }), 'other');
  assert.strictEqual(
    redirectTarget(SITE, '/blog/rolex-guide?lang=en'),
    `${SITE}/blog/rolex-guide?lang=en`,
  );
});

test('forum section parser keeps clickable sections and escaped names', () => {
  const sections = loadSections();
  const rolex = sections.find((section) => section.slug === 'rolex-watches');
  const hawke = sections.find((section) => section.slug === 'hawkes-bay');
  const marketplace = sections.find((section) => section.slug === 'marketplace');
  assert.ok(rolex && rolex.isClickable);
  assert.strictEqual(hawke.name, "Hawke's Bay");
  assert.strictEqual(marketplace.isClickable, false);
  assert.ok(sections.filter((section) => section.isClickable).length > 50);
  const parsed = parseSections("{ id: 'x', name: 'A', description: 'B', slug: 'a', isClickable: false }");
  assert.strictEqual(parsed[0].isClickable, false);
});

test('every forum section has a unique title and description in range', () => {
  const sections = loadSections();
  const byId = Object.fromEntries(sections.map((section) => [section.id, section]));
  const titles = new Set();
  const descriptions = new Set();
  for (const section of sections) {
    const parent = section.parentId ? byId[section.parentId] : null;
    const seo = metaForSection(section, parent);
    assert.ok(seo.title.length <= 60, `${section.slug} title is ${seo.title.length}`);
    assert.ok(
      seo.description.length >= 140 && seo.description.length <= 160,
      `${section.slug} description is ${seo.description.length}`,
    );
    assert.ok(!titles.has(seo.title), `${section.slug} repeats title ${seo.title}`);
    assert.ok(!descriptions.has(seo.description), `${section.slug} repeats description`);
    titles.add(seo.title);
    descriptions.add(seo.description);
  }
  assert.ok(HOME_TITLE.length <= 60);
  assert.ok(HOME_DESCRIPTION.length >= 140 && HOME_DESCRIPTION.length <= 160);
  assert.ok(BLOG_TITLE.length <= 60);
  assert.ok(BLOG_DESCRIPTION.length >= 140 && BLOG_DESCRIPTION.length <= 160);
  const london = metaForSection(
    sections.find((section) => section.slug === 'london'),
    byId['sec-uk'],
  );
  assert.strictEqual(london.title, 'London, UK: Buy & Sell Watches | Watch Trading Forums');
  assert.ok(london.description.includes('London'));
  assert.ok(/join|post/i.test(london.description));
});

test('routes do not treat public blog slugs as the editor', () => {
  assert.strictEqual(matchRoute('/blog/new').type, 'private');
  assert.strictEqual(matchRoute('/blog/edit/rolex-guide').type, 'private');
  assert.strictEqual(matchRoute('/blog/newest-watches').type, 'post');
  assert.strictEqual(matchRoute('/blog/fr/guide-rolex').type, 'post');
  assert.strictEqual(matchRoute('/blog/fr/guide-rolex').lang, 'fr');
});

test('rendered pages use the production origin and include structured data', () => {
  const home = pageFor('/');
  assert.strictEqual(home.title, HOME_TITLE);
  assert.strictEqual(home.description, HOME_DESCRIPTION);
  assert.strictEqual(home.canonical, `${SITE}/`);
  assert.ok(home.jsonLd['@graph'].some((node) => node['@type'] === 'WebSite'));
  assert.ok(home.jsonLd['@graph'].some((node) => node['@type'] === 'Organization'));

  const blog = pageFor('/blog');
  assert.strictEqual(blog.canonical, `${SITE}/blog`);
  assert.strictEqual(blog.title, BLOG_TITLE);
  assert.strictEqual(blog.description, BLOG_DESCRIPTION);

  const post = pageFor('/blog/rolex-guide');
  assert.strictEqual(post.canonical, `${SITE}/blog/rolex-guide`);
  assert.strictEqual(post.title, 'Rolex Buying Guide');
  assert.ok(post.bodyHtml.includes('Full article body about Rolex'));
  assert.ok(!post.bodyHtml.includes('<script>alert'));
  assert.ok(post.jsonLd['@graph'].some((node) => node['@type'] === 'BlogPosting'));
  assert.ok(post.jsonLd['@graph'].some((node) => node['@type'] === 'BreadcrumbList'));
  assert.ok(post.alternates.some((alt) => alt.hreflang === 'fr' && alt.href === `${SITE}/blog/fr/guide-rolex`));

  const french = pageFor('/blog/fr/guide-rolex');
  assert.strictEqual(french.canonical, `${SITE}/blog/fr/guide-rolex`);
  assert.ok(french.bodyHtml.includes('Article français'));

  const section = pageFor('/forum/rolex-watches');
  assert.strictEqual(section.title, 'Rolex Watches: Buy, Sell & Discuss | Watch Trading Forums');
  assert.ok(section.bodyHtml.includes('Daytona for sale'));

  const thread = pageFor('/thread/thread-1');
  assert.strictEqual(thread.jsonLd['@type'], 'DiscussionForumPosting');
  assert.ok(thread.bodyHtml.includes('Selling a clean Daytona'));

  const html = injectDocument(TEMPLATE, post);
  assert.ok(html.includes('<title>Rolex Buying Guide</title>'));
  assert.ok(html.includes('rel="canonical" href="https://watchtradingforums.com/blog/rolex-guide"'));
  assert.ok(html.includes('property="og:url" content="https://watchtradingforums.com/blog/rolex-guide"'));
  assert.ok(html.includes('name="twitter:card"'));
  assert.ok(html.includes('BlogPosting'));
  assert.ok(html.includes('BreadcrumbList'));
  assert.ok(!html.includes('onrender.com'));
  assert.ok(html.includes('<div id="root"></div>'));
});

test('sitemap and robots list public URLs only', () => {
  const sections = loadSections();
  const xml = buildSitemap({
    siteUrl: SITE,
    sections,
    posts: catalog.posts,
    threads: catalog.threads,
  });
  assert.ok(xml.includes('<loc>https://watchtradingforums.com/blog/rolex-guide</loc>'));
  assert.ok(xml.includes('<loc>https://watchtradingforums.com/blog/fr/guide-rolex</loc>'));
  assert.ok(xml.includes('<loc>https://watchtradingforums.com/forum/rolex-watches</loc>'));
  assert.ok(xml.includes('<loc>https://watchtradingforums.com/thread/thread-1</loc>'));
  assert.ok(xml.includes('<lastmod>2024-06-01</lastmod>'));
  assert.ok(!xml.includes('/forum/marketplace'));
  assert.ok(!xml.includes('/login'));
  assert.ok(!xml.includes('onrender.com'));
  const robots = robotsTxt(SITE);
  assert.ok(robots.includes('Sitemap: https://watchtradingforums.com/sitemap.xml'));
  assert.ok(robots.includes('Disallow: /admin'));
  assert.ok(robots.includes('Disallow: /messages'));
});

function request(server, { path: reqPath = '/', headers = {} } = {}) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: reqPath,
        method: 'GET',
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

test('server responses include SEO tags, sitemap XML, and host policy', async () => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-seo-'));
  fs.writeFileSync(path.join(distDir, 'index.html'), TEMPLATE);
  fs.writeFileSync(path.join(distDir, 'favicon.ico'), Buffer.from([0, 0, 1, 0]));
  const app = createApp({
    siteUrl: SITE,
    distDir,
    sections: loadSections(),
    catalog: {
      async getCatalog() {
        return catalog;
      },
    },
  });
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  try {
    const home = await request(server, { headers: { host: 'watchtradingforums.com' } });
    assert.strictEqual(home.status, 200);
    assert.match(home.headers['content-type'], /text\/html/);
    assert.strictEqual(home.headers['strict-transport-security'], 'max-age=31536000; includeSubDomains');
    assert.strictEqual(home.headers['x-robots-tag'], undefined);
    assert.ok(home.body.includes('<title>Buy, Sell &amp; Discuss Watches | Watch Trading Forums</title>'));
    assert.ok(home.body.includes('https://watchtradingforums.com/'));
    assert.ok(home.body.includes('"@type":"WebSite"') || home.body.includes('"@type": "WebSite"'));
    assert.ok(!home.body.includes('onrender.com'));

    const post = await request(server, {
      path: '/blog/rolex-guide',
      headers: { host: 'watchtradingforums.com' },
    });
    assert.ok(post.body.includes('Full article body about Rolex'));
    assert.ok(post.body.includes('BreadcrumbList'));

    const sitemap = await request(server, {
      path: '/sitemap.xml',
      headers: { host: 'watchtradingforums.com' },
    });
    assert.match(sitemap.headers['content-type'], /application\/xml/);
    assert.ok(sitemap.body.startsWith('<?xml'));
    assert.ok(sitemap.body.includes('<lastmod>2024-04-02</lastmod>'));

    const robots = await request(server, {
      path: '/robots.txt',
      headers: { host: 'watchtradingforums.com' },
    });
    assert.match(robots.headers['content-type'], /text\/plain/);
    assert.ok(robots.body.includes('Sitemap: https://watchtradingforums.com/sitemap.xml'));

    const icon = await request(server, {
      path: '/favicon.ico',
      headers: { host: 'watchtradingforums.com' },
    });
    assert.strictEqual(icon.status, 200);
    assert.ok(!icon.headers['content-type'].includes('text/html'));
    assert.ok(!icon.body.includes('<html'));

    const missing = await request(server, {
      path: '/missing.png',
      headers: { host: 'watchtradingforums.com' },
    });
    assert.strictEqual(missing.status, 404);
    assert.ok(!missing.body.includes('<html'));

    const health = await request(server, {
      path: '/healthz',
      headers: { host: 'watch-trading-forum.onrender.com' },
    });
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body, 'ok');

    const redirected = await request(server, {
      path: '/blog/rolex-guide?utm=1',
      headers: { host: 'watch-trading-forum.onrender.com' },
    });
    assert.strictEqual(redirected.status, 301);
    assert.strictEqual(redirected.headers.location, `${SITE}/blog/rolex-guide?utm=1`);

    const proxied = await request(server, {
      path: '/',
      headers: {
        host: 'watch-trading-forum.onrender.com',
        'x-forwarded-host': 'watchtradingforums.com',
      },
    });
    assert.strictEqual(proxied.status, 200);
    assert.ok(proxied.body.includes('Buy, Sell &amp; Discuss Watches'));

    const local = await request(server, { headers: { host: 'localhost:4173' } });
    assert.strictEqual(local.status, 200);
    assert.match(local.headers['x-robots-tag'], /noindex/);

    const login = await request(server, {
      path: '/login',
      headers: { host: 'watchtradingforums.com' },
    });
    assert.ok(login.body.includes('name="robots" content="noindex, nofollow"'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});
