import { Helmet } from 'react-helmet-async';
import { SITE_NAME, SITE_URL } from '@/lib/site';

type PageMetaProps = {
  title: string;
  description: string;
  canonical: string;
  ogType?: 'website' | 'article';
  image?: string;
  robots?: string;
  jsonLd?: unknown;
};

export function PageMeta({
  title,
  description,
  canonical,
  ogType = 'website',
  image,
  robots,
  jsonLd,
}: PageMetaProps) {
  const socialImage = image || `${SITE_URL}/opengraph.jpg`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {robots ? <meta name="robots" content={robots} /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={socialImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
    </Helmet>
  );
}
