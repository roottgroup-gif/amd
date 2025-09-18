import { LANGUAGE_MAPPING, SUPPORTED_LANGUAGES, getLanguageInfo, type Language } from './i18n';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{ href: string; hreflang: string }>;
}

interface RouteConfig {
  path: string;
  changefreq?: SitemapEntry['changefreq'];
  priority?: number;
  dynamic?: boolean;
}

// Define all static routes and their SEO configurations
const STATIC_ROUTES: RouteConfig[] = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/properties', changefreq: 'hourly', priority: 0.9 },
  { path: '/about', changefreq: 'monthly', priority: 0.5 },
  { path: '/agents', changefreq: 'weekly', priority: 0.7 },
  { path: '/favorites', changefreq: 'daily', priority: 0.6 },
  { path: '/settings', changefreq: 'monthly', priority: 0.3 }
];

// Generate language alternates for a given path
function generateLanguageAlternates(path: string, baseUrl: string): Array<{ href: string; hreflang: string }> {
  const alternates: Array<{ href: string; hreflang: string }> = [];
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    const langInfo = getLanguageInfo(lang);
    const localizedPath = getLocalizedPath(path, lang);
    alternates.push({
      href: `${baseUrl}${localizedPath}`,
      hreflang: langInfo.hreflang
    });
  });
  
  // Add x-default (defaulting to English)
  alternates.push({
    href: `${baseUrl}${getLocalizedPath(path, 'en')}`,
    hreflang: 'x-default'
  });
  
  return alternates;
}

// Helper function to get localized path (duplicate from i18n.ts to avoid circular dependency)
function getLocalizedPath(path: string, language: Language): string {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  cleanPath = cleanPath.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  return `/${language}${cleanPath}`;
}

// Generate sitemap entries for all languages
export function generateSitemapEntries(baseUrl: string, dynamicRoutes: Array<{ id: string; path: string; lastmod?: string }> = []): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const now = new Date().toISOString();
  
  // Generate entries for static routes
  STATIC_ROUTES.forEach(route => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      const localizedPath = getLocalizedPath(route.path, lang);
      const entry: SitemapEntry = {
        url: `${baseUrl}${localizedPath}`,
        lastmod: now,
        changefreq: route.changefreq || 'weekly',
        priority: route.priority || 0.5,
        alternates: generateLanguageAlternates(route.path, baseUrl)
      };
      entries.push(entry);
    });
  });
  
  // Generate entries for dynamic routes (e.g., property pages)
  dynamicRoutes.forEach(route => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      const localizedPath = getLocalizedPath(route.path, lang);
      const entry: SitemapEntry = {
        url: `${baseUrl}${localizedPath}`,
        lastmod: route.lastmod || now,
        changefreq: 'weekly',
        priority: 0.8,
        alternates: generateLanguageAlternates(route.path, baseUrl)
      };
      entries.push(entry);
    });
  });
  
  return entries;
}

// Generate XML sitemap content
export function generateXMLSitemap(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(entry => {
  const alternateLinks = entry.alternates?.map(alt => 
    `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`
  ).join('\n') || '';
  
  return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
${alternateLinks}
  </url>`;
}).join('\n')}
</urlset>`;
  
  return xml;
}

// Generate robots.txt content with sitemap reference
export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

# Language-specific content
Allow: /en/
Allow: /ar/
Allow: /kur/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Block admin areas
Disallow: /admin/
Disallow: /api/

# Block temporary files
Disallow: /*.tmp$
Disallow: /*.temp$

# Allow search engines to index language-specific pages
Crawl-delay: 1`;
}

// Generate hreflang implementation code for meta tags
export function generateHreflangMeta(currentPath: string, baseUrl: string): Array<{ rel: string; hreflang: string; href: string }> {
  const hreflangTags: Array<{ rel: string; hreflang: string; href: string }> = [];
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    const langInfo = getLanguageInfo(lang);
    const localizedPath = getLocalizedPath(currentPath, lang);
    hreflangTags.push({
      rel: 'alternate',
      hreflang: langInfo.hreflang,
      href: `${baseUrl}${localizedPath}`
    });
  });
  
  // Add x-default
  hreflangTags.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${baseUrl}${getLocalizedPath(currentPath, 'en')}`
  });
  
  return hreflangTags;
}

// Language detection and mapping utilities for search engines
export function getLanguageFromPath(path: string): Language | null {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  
  const firstSegment = segments[0];
  if (SUPPORTED_LANGUAGES.includes(firstSegment as Language)) {
    return firstSegment as Language;
  }
  
  return null;
}

// Get canonical URL for current page with proper language handling
export function getCanonicalUrl(path: string, language: Language, baseUrl: string): string {
  const cleanPath = path.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  const localizedPath = getLocalizedPath(cleanPath, language);
  return `${baseUrl}${localizedPath}`;
}