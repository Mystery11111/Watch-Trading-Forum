const {
  SITE_NAME,
  HOME_TITLE,
  HOME_DESCRIPTION,
  BLOG_TITLE,
  BLOG_DESCRIPTION,
} = require('../site-url.cjs');
const { absoluteUrl, articleBody, clip, escapeHtml, stripTags, textPage } = require('./html.cjs');
const { metaForSection } = require('./meta.cjs');

const HREFLANG = { zh: 'zh-CN' };
const TRANSLATION_CODES = ['zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'nl', 'ur', 'id', 'de', 'ja', 'pcm', 'mr'];

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePath(pathname) {
  const path = safeDecode(String(pathname || '/').split('?')[0]);
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

function isPrivatePath(pathname) {
  const path = normalizePath(pathname);
  if (path === '/blog/new' || path === '/blog/edit' || path.startsWith('/blog/edit/')) return true;
  const prefixes = ['/login', '/register', '/forgot-password', '/messages', '/admin', '/new-thread'];
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function findOriginalPost(posts, slug) {
  return (posts || []).find((post) => {
    if (post.slug === slug) return true;
    const translations = post.translations || {};
    return Object.values(translations).some((translation) => translation && translation.slug === slug);
  });
}

function displayPost(post, lang) {
  if (!lang || lang === 'en') {
    return {
      lang: 'en',
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
    };
  }
  const translation = post.translations && post.translations[lang];
  if (!translation) {
    return {
      lang: 'en',
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
    };
  }
  return {
    lang,
    title: translation.title || post.title,
    slug: translation.slug || post.slug,
    excerpt: translation.excerpt || post.excerpt,
    content: translation.content || post.content,
    metaTitle: translation.metaTitle || post.metaTitle,
    metaDescription: translation.metaDescription || post.metaDescription,
  };
}

function postCanonical(siteUrl, post, display) {
  if (display.lang === 'en') return `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
  return `${siteUrl}/blog/${display.lang}/${encodeURIComponent(display.slug)}`;
}

function postAlternates(siteUrl, post) {
  const alternates = [
    { hreflang: 'en', href: `${siteUrl}/blog/${encodeURIComponent(post.slug)}` },
    { hreflang: 'x-default', href: `${siteUrl}/blog/${encodeURIComponent(post.slug)}` },
  ];
  const translations = post.translations || {};
  for (const code of Object.keys(translations)) {
    const translation = translations[code];
    if (!translation || !translation.slug) continue;
    alternates.push({
      hreflang: HREFLANG[code] || code,
      href: `${siteUrl}/blog/${code}/${encodeURIComponent(translation.slug)}`,
    });
  }
  return alternates;
}

function basePage(siteUrl, page) {
  return {
    ogType: 'website',
    image: absoluteUrl(siteUrl, page.image),
    robots: page.robots || '',
    alternates: page.alternates || [],
    jsonLd: page.jsonLd || null,
    bodyHtml: page.bodyHtml || '',
    ...page,
    image: absoluteUrl(siteUrl, page.image),
  };
}

function homePage(siteUrl, sections) {
  const links = [{ href: `${siteUrl}/blog`, text: 'Watch trading blog' }];
  for (const section of sections || []) {
    if (!section.isClickable || section.parentId) continue;
    links.push({ href: `${siteUrl}/forum/${encodeURIComponent(section.slug)}`, text: section.name });
  }
  return basePage(siteUrl, {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonical: `${siteUrl}/`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: `${siteUrl}/`,
          description: HOME_DESCRIPTION,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: SITE_NAME,
          url: `${siteUrl}/`,
          logo: `${siteUrl}/logo.png`,
        },
      ],
    },
    bodyHtml: textPage(SITE_NAME, [HOME_DESCRIPTION], links.slice(0, 24)),
  });
}

function blogListPage(siteUrl, posts) {
  const links = (posts || []).slice(0, 50).map((post) => ({
    href: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
    text: post.title,
  }));
  return basePage(siteUrl, {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    canonical: `${siteUrl}/blog`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Watch Trading Forums Blog',
      description: BLOG_DESCRIPTION,
      url: `${siteUrl}/blog`,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
      },
      blogPost: (posts || []).slice(0, 50).map((post) => ({
        '@type': 'BlogPosting',
        headline: post.metaTitle || post.title,
        description: clip(post.metaDescription || post.excerpt || '', 300),
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        url: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
        author: { '@type': 'Person', name: post.authorName },
      })),
    },
    bodyHtml: textPage('Watch Trading Blog', [BLOG_DESCRIPTION], links),
  });
}

function blogPostPage(siteUrl, route, catalog) {
  if (!catalog.postsOk) {
    return basePage(siteUrl, {
      title: `Article | ${SITE_NAME}`,
      description: BLOG_DESCRIPTION,
      canonical: `${siteUrl}${route.path}`,
      bodyHtml: textPage('Watch Trading Blog', [BLOG_DESCRIPTION], [
        { href: `${siteUrl}/blog`, text: 'All articles' },
      ]),
    });
  }

  const original = findOriginalPost(catalog.posts, route.slug);
  if (!original) {
    return basePage(siteUrl, {
      title: `Article not found | ${SITE_NAME}`,
      description: 'The article you are looking for does not exist.',
      canonical: `${siteUrl}/blog`,
      robots: 'noindex, nofollow',
      bodyHtml: textPage('Article not found', ['The article you are looking for does not exist.'], [
        { href: `${siteUrl}/blog`, text: 'Back to the blog' },
      ]),
    });
  }

  const display = displayPost(original, route.lang);
  const title = display.metaTitle || display.title;
  const description = clip(display.metaDescription || display.excerpt || stripTags(display.content), 160);
  const canonical = postCanonical(siteUrl, original, display);
  const image = absoluteUrl(siteUrl, original.featuredImage);
  return basePage(siteUrl, {
    title,
    description,
    canonical,
    ogType: 'article',
    image,
    alternates: postAlternates(siteUrl, original),
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: title,
          description,
          url: canonical,
          mainEntityOfPage: canonical,
          datePublished: original.publishedAt,
          dateModified: original.updatedAt,
          author: { '@type': 'Person', name: original.authorName },
          image,
          keywords: Array.isArray(original.tags) ? original.tags.join(', ') : undefined,
          articleBody: clip(stripTags(display.content), 5000),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
            { '@type': 'ListItem', position: 3, name: display.title, item: canonical },
          ],
        },
      ],
    },
    bodyHtml: [
      '<article>',
      `<h1>${escapeHtml(display.title)}</h1>`,
      original.authorName ? `<p>${escapeHtml(original.authorName)}</p>` : '',
      original.publishedAt
        ? `<time datetime="${escapeHtml(original.publishedAt)}">${escapeHtml(original.publishedAt)}</time>`
        : '',
      articleBody(display.content),
      '</article>',
    ].join(''),
  });
}

function sectionPage(siteUrl, slug, sections, threads) {
  const section = (sections || []).find((item) => item.slug === slug);
  if (!section) {
    return basePage(siteUrl, {
      title: `Section not found | ${SITE_NAME}`,
      description: 'That forum section does not exist.',
      canonical: `${siteUrl}/`,
      robots: 'noindex, nofollow',
      bodyHtml: textPage('Section not found', ['That forum section does not exist.'], [
        { href: `${siteUrl}/`, text: 'Back to the forum' },
      ]),
    });
  }
  const parent = (sections || []).find((item) => item.id && item.id === section.parentId);
  const seo = metaForSection(section, parent);
  const related = (threads || []).filter((thread) => thread.sectionId && section.id && thread.sectionId === section.id);
  const links = related.slice(0, 30).map((thread) => ({
    href: `${siteUrl}/thread/${encodeURIComponent(thread.id || thread._id)}`,
    text: thread.title,
  }));
  return basePage(siteUrl, {
    title: seo.title,
    description: seo.description,
    canonical: `${siteUrl}/forum/${encodeURIComponent(section.slug)}`,
    bodyHtml: textPage(section.name, [seo.description], links),
  });
}

function threadPage(siteUrl, id, catalog) {
  const canonical = `${siteUrl}/thread/${encodeURIComponent(id)}`;
  if (!catalog.threadsOk) {
    return basePage(siteUrl, {
      title: `Discussion | ${SITE_NAME}`,
      description: HOME_DESCRIPTION,
      canonical,
    });
  }
  const thread = (catalog.threads || []).find((item) => String(item.id || item._id) === String(id));
  if (!thread) {
    return basePage(siteUrl, {
      title: `Thread not found | ${SITE_NAME}`,
      description: 'That discussion does not exist.',
      canonical: `${siteUrl}/`,
      robots: 'noindex, nofollow',
      bodyHtml: textPage('Thread not found', ['That discussion does not exist.'], [
        { href: `${siteUrl}/`, text: 'Back to the forum' },
      ]),
    });
  }
  const description = clip(stripTags(thread.content) || `Discussion: ${thread.title}`, 160);
  const image = absoluteUrl(siteUrl, Array.isArray(thread.images) ? thread.images[0] : '');
  return basePage(siteUrl, {
    title: `${thread.title} | ${SITE_NAME}`,
    description,
    canonical,
    ogType: 'article',
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: thread.title,
      text: clip(stripTags(thread.content) || thread.title, 5000),
      url: canonical,
      datePublished: thread.createdAt,
      dateModified: thread.updatedAt || thread.lastCommentAt || thread.createdAt,
      author: { '@type': 'Person', name: thread.authorName },
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: thread.commentCount || 0,
      },
    },
    bodyHtml: [
      '<article>',
      `<h1>${escapeHtml(thread.title)}</h1>`,
      thread.authorName ? `<p>${escapeHtml(thread.authorName)}</p>` : '',
      articleBody(thread.content),
      '</article>',
    ].join(''),
  });
}

function matchRoute(pathname) {
  const path = normalizePath(pathname);
  if (path === '/') return { type: 'home', path };
  if (isPrivatePath(path)) return { type: 'private', path };
  if (path === '/blog') return { type: 'blog', path };
  if (path === '/members') return { type: 'members', path };
  if (path === '/shoutbox') return { type: 'shoutbox', path };

  const translated = path.match(/^\/blog\/([a-z]{2,3})\/([^/]+)$/);
  if (translated && TRANSLATION_CODES.includes(translated[1])) {
    return { type: 'post', path, lang: translated[1], slug: translated[2] };
  }
  const post = path.match(/^\/blog\/([^/]+)$/);
  if (post) return { type: 'post', path, lang: 'en', slug: post[1] };

  const section = path.match(/^\/forum\/([^/]+)$/);
  if (section) return { type: 'section', path, slug: section[1] };

  const thread = path.match(/^\/thread\/([^/]+)$/);
  if (thread) return { type: 'thread', path, id: thread[1] };

  const profile = path.match(/^\/profile\/([^/]+)$/);
  if (profile) return { type: 'profile', path, username: profile[1] };

  return { type: 'generic', path };
}

function renderPath(pathname, ctx) {
  const route = matchRoute(pathname);
  const { siteUrl, sections, catalog } = ctx;
  if (route.type === 'home') return homePage(siteUrl, sections);
  if (route.type === 'blog') return blogListPage(siteUrl, catalog.posts);
  if (route.type === 'post') return blogPostPage(siteUrl, route, catalog);
  if (route.type === 'section') return sectionPage(siteUrl, route.slug, sections, catalog.threads);
  if (route.type === 'thread') return threadPage(siteUrl, route.id, catalog);
  if (route.type === 'members') {
    return basePage(siteUrl, {
      title: `Members | ${SITE_NAME}`,
      description: `Browse members of ${SITE_NAME}.`,
      canonical: `${siteUrl}/members`,
      bodyHtml: textPage('Members', [`Browse members of ${SITE_NAME}.`], [
        { href: `${siteUrl}/`, text: 'Forum home' },
      ]),
    });
  }
  if (route.type === 'shoutbox') {
    return basePage(siteUrl, {
      title: `Shoutbox | ${SITE_NAME}`,
      description: `Live shoutbox on ${SITE_NAME}.`,
      canonical: `${siteUrl}/shoutbox`,
      bodyHtml: textPage('Shoutbox', [`Live community messages on ${SITE_NAME}.`]),
    });
  }
  if (route.type === 'profile') {
    const name = route.username;
    return basePage(siteUrl, {
      title: `${name} | ${SITE_NAME}`,
      description: `Member profile for ${name} on ${SITE_NAME}.`,
      canonical: `${siteUrl}/profile/${encodeURIComponent(name)}`,
      bodyHtml: textPage(name, [`Member profile on ${SITE_NAME}.`]),
    });
  }
  if (route.type === 'private') {
    return basePage(siteUrl, {
      title: SITE_NAME,
      description: HOME_DESCRIPTION,
      canonical: `${siteUrl}/`,
      robots: 'noindex, nofollow',
    });
  }
  return basePage(siteUrl, {
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    canonical: `${siteUrl}/`,
    robots: 'noindex, nofollow',
    bodyHtml: textPage(SITE_NAME, [HOME_DESCRIPTION], [{ href: `${siteUrl}/`, text: 'Forum home' }]),
  });
}

module.exports = {
  matchRoute,
  normalizePath,
  isPrivatePath,
  renderPath,
  findOriginalPost,
};
