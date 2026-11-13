/**
 * Single source of truth for the public site origin.
 * Client code imports this module; the SEO server reads the same defaults.
 * Override with SITE_URL (server) or VITE_SITE_URL (Vite build).
 */
const DEFAULT_SITE_URL = 'https://watchtradingforums.com';
const DEFAULT_API_BASE = 'https://api.watchtradingforums.com/api';

const SITE_NAME = 'Watch Trading Forums';
const {
  HOME_TITLE,
  HOME_DESCRIPTION,
  BLOG_TITLE,
  BLOG_DESCRIPTION,
} = require('./seo/meta.cjs');

function resolveSiteUrl(env) {
  const source = env || {};
  const raw = String(source.SITE_URL || source.VITE_SITE_URL || DEFAULT_SITE_URL).trim();
  return raw.replace(/\/+$/, '');
}

function resolveApiBase(env) {
  const source = env || {};
  const raw = String(source.API_BASE_URL || source.VITE_API_BASE_URL || DEFAULT_API_BASE).trim();
  return raw.replace(/\/+$/, '');
}

module.exports = {
  DEFAULT_SITE_URL,
  DEFAULT_API_BASE,
  SITE_NAME,
  HOME_TITLE,
  HOME_DESCRIPTION,
  BLOG_TITLE,
  BLOG_DESCRIPTION,
  resolveSiteUrl,
  resolveApiBase,
};
