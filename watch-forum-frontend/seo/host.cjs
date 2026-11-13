const PRODUCTION_HOSTS = new Set(['watchtradingforums.com', 'www.watchtradingforums.com']);

function hostnameOf(value) {
  if (!value) return '';
  return String(value).trim().replace(/:\d+$/, '').toLowerCase();
}

function requestHostnames(req) {
  const hosts = [];
  const forwarded = req.headers && req.headers['x-forwarded-host'];
  if (forwarded) {
    String(forwarded).split(',').forEach((part) => {
      const host = hostnameOf(part);
      if (host) hosts.push(host);
    });
  }
  const host = hostnameOf(req.headers && req.headers.host);
  if (host) hosts.push(host);
  return hosts;
}

function isProductionHost(hostname) {
  return PRODUCTION_HOSTS.has(hostname);
}

function isOnrenderHost(hostname) {
  return hostname === 'onrender.com' || hostname.endsWith('.onrender.com');
}

/**
 * production — custom domain, indexable
 * onrender — public Render hostname, redirect to the site URL
 * other — local or preview, serve the page with noindex
 *
 * If any forwarded host is the production domain, the request arrived through
 * the custom domain even when the origin Host is *.onrender.com. Those
 * requests must not redirect, or Cloudflare-to-Render would loop.
 */
function classifyHost(req) {
  const hosts = requestHostnames(req);
  if (hosts.some(isProductionHost)) return 'production';
  if (hosts.some(isOnrenderHost)) return 'onrender';
  return 'other';
}

function redirectTarget(siteUrl, originalUrl) {
  const path = String(originalUrl || '/').replace(/[\r\n]/g, '');
  if (!path.startsWith('/')) return `${siteUrl}/`;
  return `${siteUrl}${path}`;
}

const HEALTH_PATHS = new Set(['/health', '/healthz']);

function isHealthPath(pathname) {
  return HEALTH_PATHS.has(String(pathname || '').split('?')[0]);
}

module.exports = {
  PRODUCTION_HOSTS,
  classifyHost,
  redirectTarget,
  isHealthPath,
  requestHostnames,
};
