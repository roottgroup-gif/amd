import { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: 'square' | '4/3' | '16/9' | '3/2' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  blur?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Generate responsive image URLs with different sizes
const generateResponsiveSrc = (src: string) => {
  if (src.includes('unsplash.com')) {
    return {
      webp: {
        '320w': `${src}&fm=webp&w=320&dpr=1`,
        '640w': `${src}&fm=webp&w=640&dpr=1`, 
        '960w': `${src}&fm=webp&w=960&dpr=1`,
        '1280w': `${src}&fm=webp&w=1280&dpr=1`,
        '1920w': `${src}&fm=webp&w=1920&dpr=1`
      },
      jpg: {
        '320w': `${src}&fm=jpg&w=320&dpr=1`,
        '640w': `${src}&fm=jpg&w=640&dpr=1`,
        '960w': `${src}&fm=jpg&w=960&dpr=1`, 
        '1280w': `${src}&fm=jpg&w=1280&dpr=1`,
        '1920w': `${src}&fm=jpg&w=1920&dpr=1`
      }
    };
  }
  return null;
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ 
    src, 
    alt, 
    fallbackSrc = DEFAULT_FALLBACK,
    priority = false,
    sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
    aspectRatio = 'auto',
    objectFit = 'cover',
    blur = false,
    className,
    onLoad,
    onError,
    ...props 
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);
    const imgRef = useRef<HTMLImageElement>(null);

    const responsiveUrls = generateResponsiveSrc(src);

    useEffect(() => {
      setCurrentSrc(src);
      setHasError(false);
      setIsLoaded(false);
    }, [src]);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      if (currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
      } else {
        setHasError(true);
      }
      onError?.();
    };

    const aspectRatioClass = {
      'square': 'aspect-square',
      '4/3': 'aspect-[4/3]',
      '16/9': 'aspect-video', 
      '3/2': 'aspect-[3/2]',
      'auto': ''
    }[aspectRatio];

    const objectFitClass = `object-${objectFit}`;

    // Preload critical images
    useEffect(() => {
      if (priority && responsiveUrls) {
        // Preload WebP version for modern browsers
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = responsiveUrls.webp['960w'];
        link.type = 'image/webp';
        document.head.appendChild(link);

        // Cleanup
        return () => {
          document.head.removeChild(link);
        };
      }
    }, [priority, responsiveUrls]);

    if (hasError) {
      return (
        <div className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground text-sm",
          aspectRatioClass,
          className
        )}>
          Failed to load image
        </div>
      );
    }

    return (
      <picture className={cn("block", className)}>
        {responsiveUrls && (
          <>
            {/* WebP sources for modern browsers */}
            <source
              type="image/webp"
              srcSet={Object.entries(responsiveUrls.webp).map(([size, url]) => `${url} ${size}`).join(', ')}
              sizes={sizes}
            />
            {/* JPEG fallback for older browsers */}
            <source
              type="image/jpeg" 
              srcSet={Object.entries(responsiveUrls.jpg).map(([size, url]) => `${url} ${size}`).join(', ')}
              sizes={sizes}
            />
          </>
        )}
        <img
          ref={ref || imgRef}
          src={currentSrc}
          alt={alt}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            aspectRatioClass,
            objectFitClass,
            isLoaded ? 'opacity-100' : 'opacity-0',
            blur && !isLoaded && 'blur-sm',
            className
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          data-testid="optimized-image"
          {...props}
        />
      </picture>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

// Image placeholder component for loading states
export const ImagePlaceholder = ({ 
  aspectRatio = 'auto', 
  className 
}: { 
  aspectRatio?: OptimizedImageProps['aspectRatio']; 
  className?: string 
}) => {
  const aspectRatioClass = {
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video', 
    '3/2': 'aspect-[3/2]',
    'auto': ''
  }[aspectRatio];

  return (
    <div className={cn(
      "bg-muted animate-pulse flex items-center justify-center",
      aspectRatioClass,
      className
    )}>
      <div className="w-8 h-8 bg-muted-foreground/20 rounded" />
    </div>
  );
};