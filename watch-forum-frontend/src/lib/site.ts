import {
  BLOG_DESCRIPTION,
  BLOG_TITLE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  resolveSiteUrl,
} from '../../site-url.cjs';
import { metaForSection } from '../../seo/meta.cjs';

/** Public origin used for canonical, Open Graph, and hreflang URLs. */
export const SITE_URL: string = resolveSiteUrl({
  SITE_URL: import.meta.env.VITE_SITE_URL,
});

export { BLOG_DESCRIPTION, BLOG_TITLE, HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, metaForSection };
