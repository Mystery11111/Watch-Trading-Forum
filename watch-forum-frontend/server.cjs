/**
 * Serves the Vite build and puts per-page SEO in the first HTML response.
 *
 * The frontend is otherwise a static Vite SPA (Render static site). This
 * process is what makes /sitemap.xml real XML and gives crawlers titles,
 * canonicals, Open Graph tags, JSON-LD, and blog article HTML without
 * executing JavaScript. Static files in dist/ still work if this process
 * is not used. See the pull request for the Render service change.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const { resolveApiBase, resolveSiteUrl } = require('./site-url.cjs');
const { createCatalog } = require('./seo/data.cjs');
const { classifyHost, isHealthPath, redirectTarget } = require('./seo/host.cjs');
const { injectDocument } = require('./seo/html.cjs');
const { renderPath } = require('./seo/pages.cjs');
const { loadSections } = require('./seo/sections.cjs');
const { buildSitemap, robotsTxt } = require('./seo/sitemap.cjs');

const HSTS = 'max-age=31536000; includeSubDomains';

function wantsHtml(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const pathname = req.path || '/';
  if (pathname.startsWith('/assets/') || pathname === '/api' || pathname.startsWith('/api/')) return false;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return false;
  return true;
}

function createApp(options = {}) {
  const siteUrl = options.siteUrl || resolveSiteUrl(process.env);
  const apiBase = options.apiBase || resolveApiBase(process.env);
  const distDir = options.distDir || path.join(__dirname, 'dist');
  const sections = options.sections || loadSections();
  const catalog = options.catalog || createCatalog(apiBase);
  const readTemplate =
    options.readTemplate ||
    (() => fs.readFileSync(path.join(distDir, 'index.html'), 'utf8'));

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use((_req, res, next) => {
    res.setHeader('Strict-Transport-Security', HSTS);
    next();
  });

  app.get(['/healthz', '/health'], (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.status(200).type('text/plain').send('ok');
  });

  app.use((req, res, next) => {
    if (isHealthPath(req.path)) return next();
    const kind = classifyHost(req);
    if (kind === 'onrender') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      return res.redirect(301, redirectTarget(siteUrl, req.originalUrl));
    }
    if (kind !== 'production') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  app.get('/robots.txt', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.type('text/plain').send(robotsTxt(siteUrl));
  });

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const data = await catalog.getCatalog();
      const xml = buildSitemap({
        siteUrl,
        sections,
        posts: data.posts,
        threads: data.threads,
      });
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=600');
      res.send(xml);
    } catch (error) {
      console.warn('[seo] sitemap failed:', error.message);
      const fallback = path.join(distDir, 'sitemap.xml');
      if (fs.existsSync(fallback)) {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.send(fs.readFileSync(fallback));
      }
      res
        .status(200)
        .type('application/xml')
        .send(
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n',
        );
    }
  });

  app.use(
    express.static(distDir, {
      index: false,
      fallthrough: true,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  app.use(async (req, res, next) => {
    if (!wantsHtml(req)) return next();
    try {
      const template = readTemplate();
      const data = await catalog.getCatalog();
      const page = renderPath(req.path, { siteUrl, sections, catalog: data });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.send(injectDocument(template, page));
    } catch (error) {
      console.error('[seo] HTML render failed:', error);
      try {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(readTemplate());
      } catch {
        next(error);
      }
    }
  });

  app.use((_req, res) => {
    res.status(404).type('text/plain').send('Not found');
  });

  return app;
}

function start() {
  const port = Number(process.env.PORT) || 4173;
  const host = process.env.HOST || '0.0.0.0';
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    console.error('dist/index.html is missing. Run npm run build before npm start.');
    process.exit(1);
  }
  const app = createApp();
  app.listen(port, host, () => {
    console.log(`SEO server listening on http://${host}:${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { createApp, start };
