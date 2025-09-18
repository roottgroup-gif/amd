import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage, getLocalizedPath, detectLanguageFromUrl, type Language } from '@/lib/i18n';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
  breadcrumbs?: Array<{ name: string; url: string }>;
  propertyData?: {
    address?: string;
    city?: string;
    country?: string;
    price?: string;
    currency?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
}

function generateCanonicalUrl(location: string, language: Language): string {
  const baseUrl = window.location.origin;
  // Parse URL to get clean pathname without query/hash
  const pathname = location.split('?')[0].split('#')[0];
  // Remove existing language prefix if present
  let cleanPath = pathname.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  // Normalize trailing slashes: no trailing slash except for home
  if (cleanPath !== '/' && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }
  const localizedPath = getLocalizedPath(cleanPath, language);
  return `${baseUrl}${localizedPath}`;
}

function getOGLocale(language: Language): string {
  const localeMap = {
    'en': 'en_US',
    'ar': 'ar_IQ', 
    'kur': 'ku_IQ'
  };
  return localeMap[language] || 'en_US';
}

function getAlternateOGLocales(currentLanguage: Language): string[] {
  const allLocales = ['en_US', 'ar_IQ', 'ku_IQ'];
  const currentLocale = getOGLocale(currentLanguage);
  return allLocales.filter(locale => locale !== currentLocale);
}

function addPreconnectHints() {
  // Common external domains used for images to improve loading performance
  const domains = [
    'https://images.unsplash.com',
    'https://cdn.pixabay.com',
    'https://via.placeholder.com'
  ];
  
  domains.forEach(domain => {
    // Check if preconnect link already exists
    if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
}

function updateMetaTag(attr: string, name: string, content: string) {
  let element = document.querySelector(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function ensureMultiMeta(attr: string, name: string, values: string[]) {
  // Remove existing meta tags with this property
  const existing = document.querySelectorAll(`meta[${attr}="${name}"]`);
  existing.forEach(element => element.remove());
  
  // Add one meta tag for each value
  values.forEach(value => {
    const element = document.createElement('meta');
    element.setAttribute(attr, name);
    element.setAttribute('content', value);
    document.head.appendChild(element);
  });
}

function generateCombinedStructuredData(
  customStructuredData?: object,
  breadcrumbs?: Array<{ name: string; url: string }>,
  propertyData?: SEOProps['propertyData'],
  language?: Language,
  canonicalUrl?: string
) {
  const baseUrl = window.location.origin;
  const schemas: any[] = [];

  // Website/Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MapEstate",
    "url": baseUrl,
    "logo": `${baseUrl}/logo_1757848527935.png`,
    "description": "AI-Powered Real Estate Platform for Kurdistan and Iraq",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "Iraq",
      "addressRegion": "Kurdistan"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["English", "Arabic", "Kurdish"]
    },
    "sameAs": [
      "https://facebook.com/mapestate",
      "https://twitter.com/mapestate"
    ]
  };

  // Website schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MapEstate",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/properties?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "inLanguage": [
      { "@type": "Language", "name": "English", "alternateName": "en" },
      { "@type": "Language", "name": "Arabic", "alternateName": "ar" },
      { "@type": "Language", "name": "Kurdish", "alternateName": "ku" }
    ]
  };

  schemas.push(organizationSchema, websiteSchema);

  // Breadcrumb schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": `${baseUrl}${crumb.url}`
      }))
    };
    schemas.push(breadcrumbSchema);
  }

  // Enhanced property/listing schema if property data exists
  if (propertyData) {
    const propertyType = propertyData.propertyType?.toLowerCase();
    const schemaPropertyType = propertyType === 'apartment' ? 'Apartment' : 
                               propertyType === 'house' ? 'House' : 'Residence';
    
    const propertySchema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "@id": canonicalUrl,
      "url": canonicalUrl,
      "name": `${propertyData.propertyType || 'Property'} in ${propertyData.city || ''}`,
      "description": `${propertyData.bedrooms ? `${propertyData.bedrooms} bedroom ` : ''}${propertyData.propertyType || 'property'} ${propertyData.address ? `located at ${propertyData.address}` : ''} in ${propertyData.city || ''}, ${propertyData.country || ''}`,
      "itemOffered": {
        "@type": schemaPropertyType,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": propertyData.address || "",
          "addressLocality": propertyData.city || "",
          "addressCountry": propertyData.country || "Iraq"
        },
        "numberOfRooms": propertyData.bedrooms,
        "numberOfBathroomsTotal": propertyData.bathrooms,
        "floorSize": propertyData.area ? {
          "@type": "QuantitativeValue",
          "value": propertyData.area,
          "unitText": "square feet"
        } : undefined
      },
      "offers": {
        "@type": "Offer",
        "price": propertyData.price,
        "priceCurrency": propertyData.currency || "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": new Date().toISOString()
      }
    };
    schemas.push(propertySchema);
  }

  // Add custom structured data if provided
  if (customStructuredData) {
    schemas.push(customStructuredData);
  }

  return schemas.length === 1 ? schemas[0] : schemas;
}

export function SEOHead({ 
  title = "MapEstate - AI-Powered Real Estate Finder",
  description = "Find your perfect home with AI-powered recommendations. Discover properties for rent and sale in Kurdistan, Iraq with intelligent search and expert agents on MapEstate.",
  keywords = "real estate, Kurdistan, Iraq, properties for sale, properties for rent, apartments, houses, villas, land",
  ogImage = `${window.location.protocol}//${window.location.host}/mapestate-og-image.jpg`,
  canonicalUrl,
  structuredData,
  breadcrumbs,
  propertyData
}: SEOProps) {
  const [location] = useLocation();
  const { language } = useLanguage();
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    
    // Comprehensive Open Graph tags for Facebook, LinkedIn, and general sharing
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:image:secure_url', ogImage.replace('http://', 'https://'));
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:image:alt', title);
    updateMetaTag('property', 'og:image:type', 'image/jpeg');
    // Generate proper canonical URL and use it for OG url
    const currentLanguage = detectLanguageFromUrl(location) || language;
    const properCanonicalUrl = canonicalUrl || generateCanonicalUrl(location, currentLanguage);
    
    updateMetaTag('property', 'og:url', properCanonicalUrl);
    updateMetaTag('property', 'og:type', propertyData ? 'product' : 'website');
    updateMetaTag('property', 'og:site_name', 'MapEstate');
    
    // Set og:locale based on current language
    const ogLocale = getOGLocale(currentLanguage);
    updateMetaTag('property', 'og:locale', ogLocale);
    
    // Handle multiple og:locale:alternate tags for other languages
    const alternateLocales = getAlternateOGLocales(currentLanguage);
    ensureMultiMeta('property', 'og:locale:alternate', alternateLocales);
    updateMetaTag('property', 'og:country-name', 'Iraq');
    updateMetaTag('property', 'og:region', 'Kurdistan');
    updateMetaTag('property', 'og:updated_time', new Date().toISOString());
    
    // Enhanced Twitter Card tags for Twitter sharing
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);
    updateMetaTag('name', 'twitter:image:alt', title);
    updateMetaTag('name', 'twitter:site', '@MapEstate');
    updateMetaTag('name', 'twitter:creator', '@MapEstate');
    updateMetaTag('name', 'twitter:domain', window.location.hostname);
    updateMetaTag('name', 'twitter:app:name:iphone', 'MapEstate');
    updateMetaTag('name', 'twitter:app:name:ipad', 'MapEstate');
    updateMetaTag('name', 'twitter:app:name:googleplay', 'MapEstate');
    
    // WhatsApp uses Open Graph tags, ensure mobile compatibility
    updateMetaTag('name', 'format-detection', 'telephone=no');
    
    // Additional meta tags for better SEO and social sharing
    updateMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('name', 'author', 'MapEstate');
    updateMetaTag('name', 'generator', 'MapEstate Real Estate Platform');
    updateMetaTag('property', 'article:publisher', `${window.location.protocol}//${window.location.host}`);
    
    // Additional SEO meta tags
    updateMetaTag('name', 'theme-color', '#ff7f00'); // Brand color
    updateMetaTag('name', 'msapplication-TileColor', '#ff7f00');
    updateMetaTag('name', 'apple-mobile-web-app-capable', 'yes');
    updateMetaTag('name', 'apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('name', 'mobile-web-app-capable', 'yes');
    
    // Geo-location tags for better local SEO
    updateMetaTag('name', 'geo.region', 'IQ-KR'); // Kurdistan, Iraq
    updateMetaTag('name', 'geo.placename', 'Kurdistan Region, Iraq');
    updateMetaTag('name', 'geo.position', '36.1911;44.0091'); // Erbil coordinates
    updateMetaTag('name', 'ICBM', '36.1911, 44.0091');
    
    // Business/Organization info
    updateMetaTag('name', 'rating', 'general');
    updateMetaTag('name', 'distribution', 'global');
    updateMetaTag('name', 'coverage', 'worldwide');
    updateMetaTag('name', 'target', 'all');
    updateMetaTag('name', 'HandheldFriendly', 'true');
    updateMetaTag('name', 'MobileOptimized', '320');
    
    // Update canonical URL using proper language-prefixed URL
    updateCanonicalUrl(properCanonicalUrl);
    
    // Add hreflang tags for multilingual SEO using language-prefixed URLs
    updateHreflangTags(location, currentLanguage);
    
    // Add performance optimization hints
    addPreconnectHints();
    
    // Update structured data with comprehensive website schema
    const combinedStructuredData = generateCombinedStructuredData(
      structuredData, 
      breadcrumbs, 
      propertyData,
      currentLanguage,
      properCanonicalUrl
    );
    updateStructuredData(combinedStructuredData);
  }, [title, description, keywords, ogImage, canonicalUrl, structuredData, location, language]);

  return null;
}

function updateCanonicalUrl(url: string) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

function updateHreflangTags(currentLocation: string, currentLanguage: Language) {
  // Remove existing hreflang tags
  const existing = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existing.forEach(element => element.remove());
  
  // Parse URL to get clean pathname without query/hash, then strip language prefix
  const pathname = currentLocation.split('?')[0].split('#')[0];
  let cleanPath = pathname.replace(/^\/(en|ar|kur)(?=\/|$)/, '') || '/';
  // Normalize trailing slashes: no trailing slash except for home
  if (cleanPath !== '/' && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }
  const baseUrl = window.location.origin;
  
  // Language mapping for proper hreflang codes
  const languages = [
    { internal: 'en', hreflang: 'en', region: 'US' },
    { internal: 'ar', hreflang: 'ar', region: 'IQ' }, 
    { internal: 'kur', hreflang: 'ku', region: 'IQ' } // Map 'kur' to proper 'ku' ISO code
  ];
  
  // Add hreflang tags for each supported language
  languages.forEach(lang => {
    const localizedPath = getLocalizedPath(cleanPath, lang.internal as Language);
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = `${lang.hreflang}-${lang.region}`;
    link.href = `${baseUrl}${localizedPath}`;
    document.head.appendChild(link);
  });
  
  // Add x-default hreflang (defaulting to English)
  const defaultPath = getLocalizedPath(cleanPath, 'en');
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${baseUrl}${defaultPath}`;
  document.head.appendChild(defaultLink);
}

function updateStructuredData(data: object) {
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"][data-dynamic]');
  if (existing) {
    existing.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-dynamic', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

