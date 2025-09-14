import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
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

export function SEOHead({ 
  title = "MapEstate - AI-Powered Real Estate Finder",
  description = "Find your perfect home with AI-powered recommendations. Discover properties for rent and sale in Kurdistan, Iraq with intelligent search and expert agents on MapEstate.",
  keywords = "real estate, Kurdistan, Iraq, properties for sale, properties for rent, apartments, houses, villas, land",
  ogImage = "https://your-domain.com/og-image.jpg",
  canonicalUrl,
  structuredData
}: SEOProps) {
  const [location] = useLocation();
  
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
    updateMetaTag('property', 'og:url', canonicalUrl || window.location.href);
    updateMetaTag('property', 'og:type', structuredData ? 'product' : 'website');
    updateMetaTag('property', 'og:site_name', 'MapEstate');
    updateMetaTag('property', 'og:locale', 'en_US');
    
    // Twitter Card tags for Twitter sharing
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);
    updateMetaTag('name', 'twitter:image:alt', title);
    updateMetaTag('name', 'twitter:site', '@MapEstate');
    updateMetaTag('name', 'twitter:creator', '@MapEstate');
    
    // WhatsApp uses Open Graph tags, ensure mobile compatibility
    updateMetaTag('name', 'format-detection', 'telephone=no');
    
    // Additional meta tags for better social sharing
    updateMetaTag('name', 'robots', 'index, follow');
    updateMetaTag('name', 'author', 'MapEstate');
    updateMetaTag('property', 'article:publisher', 'https://mapestate.com');
    
    // Update canonical URL
    updateCanonicalUrl(canonicalUrl || window.location.href);
    
    // Add performance optimization hints
    addPreconnectHints();
    
    // Update structured data
    if (structuredData) {
      updateStructuredData(structuredData);
    }
  }, [title, description, keywords, ogImage, canonicalUrl, structuredData]);

  return null;
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

function updateCanonicalUrl(url: string) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
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

