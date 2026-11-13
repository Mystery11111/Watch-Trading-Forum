declare module '../../site-url.cjs' {
  export const DEFAULT_SITE_URL: string;
  export const DEFAULT_API_BASE: string;
  export const SITE_NAME: string;
  export const HOME_TITLE: string;
  export const HOME_DESCRIPTION: string;
  export const BLOG_TITLE: string;
  export const BLOG_DESCRIPTION: string;
  export function resolveSiteUrl(env?: { SITE_URL?: string; VITE_SITE_URL?: string }): string;
  export function resolveApiBase(env?: { API_BASE_URL?: string; VITE_API_BASE_URL?: string }): string;
}
