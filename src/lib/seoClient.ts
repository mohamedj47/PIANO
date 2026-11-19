import { getRouteMetadata } from './seoMeta';

function upsertMeta(attrName: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attrName}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function syncClientSeo(pathname: string): void {
  if (typeof document === 'undefined') return;
  const meta = getRouteMetadata(pathname);

  document.title = meta.title;
  document.documentElement.lang = meta.lang;
  document.documentElement.dir = meta.dir;

  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', meta.robots);
  upsertCanonical(meta.canonicalUrl);

  upsertMeta('property', 'og:site_name', 'MAQAMIR');
  upsertMeta('property', 'og:type', meta.ogType);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', meta.canonicalUrl);
  upsertMeta('property', 'og:image', meta.ogImage);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', meta.ogImage);

  // Sync hreflang alternates cleanly per route
  document.head
    .querySelectorAll('link[rel="alternate"][data-maqamir-hreflang="true"]')
    .forEach((node) => node.remove());

  if (meta.hreflangs) {
    for (const alt of meta.hreflangs) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', alt.hreflang);
      link.setAttribute('href', alt.href);
      link.setAttribute('data-maqamir-hreflang', 'true');
      document.head.appendChild(link);
    }
  }

  // Sync structured JSON-LD scripts cleanly
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-maqamir-ld="true"]')
    .forEach((node) => node.remove());

  for (const schema of meta.jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-maqamir-ld', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}
