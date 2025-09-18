// Image preloading utilities for critical performance
import type { Property } from '@/types';

interface PreloadOptions {
  priority?: boolean;
  sizes?: string;
  format?: 'webp' | 'jpg' | 'auto';
}

// Preload critical images on page load
export class ImagePreloader {
  private static preloadedUrls = new Set<string>();
  
  static preload(url: string, options: PreloadOptions = {}) {
    if (this.preloadedUrls.has(url)) return;
    
    const { priority = false, sizes = "100vw", format = 'auto' } = options;
    
    // Create preload link
    const link = document.createElement('link');
    link.rel = priority ? 'preload' : 'prefetch';
    link.as = 'image';
    
    // Optimize Unsplash URLs for better performance
    let optimizedUrl = url;
    if (url.includes('unsplash.com')) {
      const webpUrl = `${url}&fm=webp&w=800&dpr=2`;
      optimizedUrl = format === 'webp' ? webpUrl : url;
    }
    
    link.href = optimizedUrl;
    link.imageSizes = sizes;
    
    // Add to DOM
    document.head.appendChild(link);
    this.preloadedUrls.add(url);
    
    // Clean up after load
    link.addEventListener('load', () => {
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 100);
    });
  }
  
  static preloadHeroImages(properties: Property[], limit: number = 3) {
    // Preload first images from featured properties
    properties.slice(0, limit).forEach((property, index) => {
      if (property.images && property.images.length > 0) {
        this.preload(property.images[0], {
          priority: index === 0, // First image has priority
          sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
          format: 'webp'
        });
      }
    });
  }
  
  static preloadPropertyImages(property: Property) {
    // Preload all images for a property detail page
    if (property.images && property.images.length > 0) {
      property.images.forEach((imageUrl, index) => {
        this.preload(imageUrl, {
          priority: index === 0, // First image is priority
          sizes: "(max-width: 768px) 100vw, 90vw",
          format: 'webp'
        });
      });
    }
  }
  
  static clear() {
    this.preloadedUrls.clear();
  }
}

// Hook for image preloading in React components
export function useImagePreloader() {
  return {
    preload: ImagePreloader.preload.bind(ImagePreloader),
    preloadHeroImages: ImagePreloader.preloadHeroImages.bind(ImagePreloader),
    preloadPropertyImages: ImagePreloader.preloadPropertyImages.bind(ImagePreloader),
    clear: ImagePreloader.clear.bind(ImagePreloader)
  };
}

// Intersection Observer for lazy loading optimization
export class LazyLoadObserver {
  private static observer: IntersectionObserver | null = null;
  private static imageElements = new WeakMap<Element, () => void>();
  
  static init() {
    if (typeof window === 'undefined' || this.observer) return;
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.imageElements.get(entry.target);
          if (callback) {
            callback();
            this.observer?.unobserve(entry.target);
            this.imageElements.delete(entry.target);
          }
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before visible
      threshold: 0.1
    });
  }
  
  static observe(element: Element, callback: () => void) {
    if (!this.observer) this.init();
    
    this.imageElements.set(element, callback);
    this.observer?.observe(element);
  }
  
  static unobserve(element: Element) {
    this.observer?.unobserve(element);
    this.imageElements.delete(element);
  }
  
  static disconnect() {
    this.observer?.disconnect();
    this.observer = null;
    this.imageElements = new WeakMap();
  }
}

// Utility to generate responsive image URLs
export function generateResponsiveUrls(src: string) {
  if (!src.includes('unsplash.com')) return null;
  
  return {
    webp: {
      small: `${src}&fm=webp&w=400&dpr=1`,
      medium: `${src}&fm=webp&w=800&dpr=1`,
      large: `${src}&fm=webp&w=1200&dpr=1`,
      xlarge: `${src}&fm=webp&w=1600&dpr=1`
    },
    jpg: {
      small: `${src}&fm=jpg&w=400&dpr=1`,
      medium: `${src}&fm=jpg&w=800&dpr=1`, 
      large: `${src}&fm=jpg&w=1200&dpr=1`,
      xlarge: `${src}&fm=jpg&w=1600&dpr=1`
    }
  };
}