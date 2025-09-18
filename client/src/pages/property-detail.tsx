import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useParams, Link } from "wouter";
import ContactForm from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import { useProperty, useAddToFavorites, useRemoveFromFavorites, useIsFavorite } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import type { Property } from "@/types";
import { extractPropertyIdentifier } from "@shared/slug-utils";
import { 
  Heart, Bed, Bath, Square, Car, MapPin, ArrowLeft, 
  ChevronLeft, ChevronRight, Check, Calendar,
  Eye, Phone, MessageSquare, Mail, Sun, Moon, Share2, Copy
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp, SiLinkedin } from "react-icons/si";
import { formatPrice, formatPricePerUnit, useCurrencyConversion } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { t, changeLanguage, language: currentLanguage } = useTranslation();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [userId] = useState("demo-user-id"); // In real app, get from auth context
  const [originalLanguage, setOriginalLanguage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });
  const { preferredCurrency } = useCurrency();


  const { data: property, isLoading, error } = useProperty(id!);
  
  // Get currency conversion rate if needed
  const conversionQuery = useCurrencyConversion(property?.currency || 'USD', preferredCurrency);
  
  // Calculate converted amount if currency conversion is available
  const baseAmount = property ? parseFloat(property.price) : 0;
  const convertedAmount = property && conversionQuery.data?.convertedAmount ? 
    (conversionQuery.data.convertedAmount * baseAmount) : baseAmount;
  const displayCurrency = property && property.currency === preferredCurrency ? 
    property.currency : preferredCurrency;
  
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  const { data: favoriteData } = useIsFavorite(userId, property?.id || "");

  const isFavorite = favoriteData?.isFavorite || false;

  // Property language detection and styling
  const rawPropertyLanguage = property?.language || 'en';
  // Handle legacy 'ku' language code and map to 'kur'
  const propertyLanguage = rawPropertyLanguage === 'ku' ? 'kur' : rawPropertyLanguage;
  const isPropertyRTL = propertyLanguage === 'ar' || propertyLanguage === 'kur';
  
  // Get language-specific class names for styling
  const getLanguageClasses = () => {
    const baseClasses = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";
    if (isPropertyRTL) {
      return `${baseClasses} text-right`;
    }
    return `${baseClasses} text-left`;
  };

  // Store original language on mount to restore later
  useEffect(() => {
    if (originalLanguage === null) {
      setOriginalLanguage(currentLanguage);
    }
  }, [currentLanguage, originalLanguage]);

  // Set property language without global persistence
  useEffect(() => {
    if (property && property.language) {
      const validatedLanguage = propertyLanguage;
      if (['en', 'ar', 'kur'].includes(validatedLanguage)) {
        // Change translation context temporarily without persisting to localStorage
        changeLanguage(validatedLanguage as 'en' | 'ar' | 'kur', false);
      }
    }
  }, [property, propertyLanguage, changeLanguage]);

  // Restore original language on unmount to prevent global leakage
  useEffect(() => {
    return () => {
      if (originalLanguage && originalLanguage !== propertyLanguage) {
        changeLanguage(originalLanguage as 'en' | 'ar' | 'kur', false);
      }
    };
  }, [originalLanguage, propertyLanguage, changeLanguage]);

  // Generate property structured data
  const getPropertyStructuredData = (property: Property) => {
    const images = property.images && property.images.length > 0 ? property.images : [];
    
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": property.title,
      "description": property.description || `${property.title} in ${property.city}, ${property.country}`,
      "url": `${window.location.origin}/property/${property.slug || property.id}`,
      "image": images,
      "price": {
        "@type": "MonetaryAmount",
        "currency": property.currency || "USD",
        "value": property.price
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": property.address,
        "addressLocality": property.city,
        "addressCountry": property.country
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": property.latitude,
        "longitude": property.longitude
      },
      "numberOfRooms": property.bedrooms,
      "numberOfBathroomsTotal": property.bathrooms,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": property.area,
        "unitText": "square feet"
      },
      "availableFrom": property.createdAt,
      "listingType": property.listingType === 'rent' ? 'ForRent' : 'ForSale'
    };
  };

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleFavoriteClick = async () => {
    if (!property) return;

    try {
      if (isFavorite) {
        await removeFromFavorites.mutateAsync({ userId, propertyId: property.id });
        toast({
          title: t('property.removedFromFavorites'),
          description: t('property.removedFromFavoritesDescription'),
        });
      } else {
        await addToFavorites.mutateAsync({ userId, propertyId: property.id });
        toast({
          title: t('property.addedToFavorites'),
          description: t('property.addedToFavoritesDescription'),
        });
      }
    } catch (error) {
      toast({
        title: t('property.favoriteError'),
        description: t('property.favoriteErrorDescription'),
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform?: string) => {
    if (!property) return;

    // Get the current language prefix from the URL to maintain language consistency
    const currentPath = window.location.pathname;
    const languageMatch = currentPath.match(/^\/(en|ar|kur)\//);
    const languagePrefix = languageMatch ? `/${languageMatch[1]}` : '/en'; // Default to English if no prefix found
    
    const propertyUrl = `${window.location.origin}${languagePrefix}/property/${property.slug || property.id}`;
    const shareTitle = `${property.title} - MapEstate`;
    const shareText = `Check out this amazing ${property.type} in ${property.city}! ${formatPrice(property.price, property.currency || 'USD', property.listingType, displayCurrency, convertedAmount, t)}`;

    // Try Web Share API first (mainly for mobile)
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: propertyUrl,
        });
        return;
      } catch (error) {
        // Fall back to manual sharing if user cancels or API fails
      }
    }

    // Manual sharing based on platform
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${propertyUrl}`)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(propertyUrl)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(propertyUrl);
          toast({
            title: t('property.linkCopied'),
            description: t('property.linkCopiedDescription'),
          });
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = propertyUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          toast({
            title: t('property.linkCopied'),
            description: t('property.linkCopiedDescription'),
          });
        }
        break;
      default:
        // If no platform specified and Web Share API failed, show copy functionality
        handleShare('copy');
    }
  };


  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  // Auto sliding functionality
  useEffect(() => {
    if (!isAutoSliding || !property?.images || property.images.length <= 1 || isFullScreen) {
      return;
    }

    const interval = setInterval(() => {
      nextImage();
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoSliding, property?.images, isFullScreen]);

  const openFullScreen = () => {
    setIsFullScreen(true);
    setIsAutoSliding(false);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
    setIsAutoSliding(true);
  };

  const toggleAutoSlide = () => {
    setIsAutoSliding(!isAutoSliding);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="h-96 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded"></div>
                  ))}
                </div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('property.notFound')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('property.notFoundDescription')}
          </p>
          <Link href="/">
            <Button>{t('property.backToHome')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600';
  const images = property.images?.length ? property.images : [primaryImage];

  return (
    <div className="min-h-screen bg-background">
      {property && (
        <SEOHead
          title={`${property.title} - ${formatPrice(property.price, property.currency || 'USD', property.listingType, displayCurrency, convertedAmount, t)} | MapEstate`}
          description={`${property.description || `${property.bedrooms} bedroom ${property.type} for ${property.listingType} in ${property.city}, ${property.country}.`} View details, photos, and contact information on MapEstate - AI-powered real estate platform.`}
          keywords={`${property.type}, ${property.city}, ${property.country}, ${property.listingType}, real estate, property, ${property.bedrooms} bedroom, ${property.bathrooms} bathroom, MapEstate, Kurdistan Iraq properties`}
          ogImage={property.images && property.images.length > 0 ? property.images[0] : `${window.location.origin}/mapestate-og-image.jpg`}
          canonicalUrl={undefined}
          structuredData={getPropertyStructuredData(property)}
          propertyData={{
            address: property.address,
            city: property.city,
            country: property.country,
            price: property.price?.toString(),
            currency: property.currency || 'USD',
            propertyType: property.type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area
          }}
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'Properties', url: '/properties' },
            { name: property.title, url: `/property/${property.slug || property.id}` }
          ]}
        />
      )}
      
      <div className={getLanguageClasses()} dir={isPropertyRTL ? 'rtl' : 'ltr'}>
        {/* Top Navigation with Back Button and Theme Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" data-testid="back-button">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('property.backToHome')}
            </Button>
          </Link>
          
        </div>

        {/* Image Gallery */}
        <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10 overflow-hidden mb-8">
          <div className="relative h-64 md:h-96">
            <img 
              src={images[currentImageIndex]}
              alt={`${property.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              data-testid="property-main-image"
              loading="eager"
              decoding="async"
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black dark:text-white"
                  onClick={prevImage}
                  data-testid="prev-image-button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black dark:text-white"
                  onClick={nextImage}
                  data-testid="next-image-button"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image Counter */}
                <div className="absolute top-4 left-4 bg-orange-500/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleFavoriteClick}
                className={`transition-all duration-200 ${
                  isFavorite 
                    ? 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
                    : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-700 dark:bg-black/80 dark:hover:bg-black dark:text-gray-300 dark:hover:text-white'
                }`}
                data-testid="favorite-button"
              >
                <Heart className={`h-4 w-4 transition-all duration-200 ${
                  isFavorite ? 'fill-current scale-110' : 'hover:scale-105'
                }`} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white/80 hover:bg-white text-gray-600 hover:text-gray-700 dark:bg-black/80 dark:hover:bg-black dark:text-gray-300 dark:hover:text-white transition-all duration-200"
                    data-testid="share-button"
                  >
                    <Share2 className="h-4 w-4 hover:scale-105 transition-all duration-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleShare('facebook')} data-testid="share-facebook">
                    <SiFacebook className="h-4 w-4 mr-2 text-blue-600" />
                    {t('property.shareOnFacebook')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')} data-testid="share-twitter">
                    <SiX className="h-4 w-4 mr-2 text-gray-800 dark:text-white" />
                    {t('property.shareOnTwitter')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')} data-testid="share-whatsapp">
                    <SiWhatsapp className="h-4 w-4 mr-2 text-green-600" />
                    {t('property.shareOnWhatsApp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('linkedin')} data-testid="share-linkedin">
                    <SiLinkedin className="h-4 w-4 mr-2 text-blue-700" />
                    {t('property.shareOnLinkedIn')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('copy')} data-testid="share-copy">
                    <Copy className="h-4 w-4 mr-2" />
                    {t('property.copyLink')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-primary shadow-md' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`${property.title} thumbnail ${index + 1}`}
                      className="w-16 h-16 md:w-20 md:h-20 object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Full Screen Modal */}
        {isFullScreen && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={images[currentImageIndex]}
                alt={`${property.title} - Full Screen ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                data-testid="fullscreen-image"
              />
              
              {/* Close button */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={closeFullScreen}
                data-testid="close-fullscreen-button"
              >
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className="w-3 h-0.5 bg-current transform rotate-45 absolute"></div>
                  <div className="w-3 h-0.5 bg-current transform -rotate-45 absolute"></div>
                </div>
              </Button>
              
              {/* Navigation buttons in full screen */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={prevImage}
                    data-testid="fullscreen-prev-button"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={nextImage}
                    data-testid="fullscreen-next-button"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  
                  {/* Image counter in full screen */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>  
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Header */}
            <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8 border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <Badge className={property.listingType === 'sale' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-emerald-600 text-white'
                  }>
                    {property.listingType === 'sale' ? t('filter.forSale') : t('filter.forRent')}
                  </Badge>
                  {property.isFeatured && (
                    <Badge variant="secondary">{t('property.featured')}</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="property-title">
                  {property.title}
                </h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <p data-testid="property-address">
                    {property.address}, {property.city}, {property.country}
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="property-price">
                  {formatPrice(property.price, property.currency, property.listingType, displayCurrency, convertedAmount, t)}
                </div>
                {property.area && (
                  <div className="text-sm text-muted-foreground">
                    {formatPricePerUnit(property.price, property.area, property.currency, displayCurrency, convertedAmount, t)}
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Property Features */}
            <Card className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl border-green-200/40 dark:border-green-700/40 mb-8">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {property.bedrooms && (
                    <div className="flex items-center gap-3 md:flex-col md:items-center md:justify-center text-start md:text-center" data-testid="bedrooms-info">
                      <Bed className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary md:mx-auto shrink-0" />
                      <div>
                        <div className="font-semibold text-base sm:text-lg md:text-xl">{property.bedrooms}</div>
                        <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{t('property.bedrooms')}</div>
                      </div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-3 md:flex-col md:items-center md:justify-center text-start md:text-center" data-testid="bathrooms-info">
                      <Bath className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary md:mx-auto shrink-0" />
                      <div>
                        <div className="font-semibold text-base sm:text-lg md:text-xl">{property.bathrooms}</div>
                        <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{t('property.bathrooms')}</div>
                      </div>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-3 md:flex-col md:items-center md:justify-center text-start md:text-center" data-testid="area-info">
                      <Square className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary md:mx-auto shrink-0" />
                      <div>
                        <div className="font-semibold text-base sm:text-lg md:text-xl">{property.area.toLocaleString()}</div>
                        <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{t('property.sqFt')}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 md:flex-col md:items-center md:justify-center text-start md:text-center">
                    <Car className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary md:mx-auto shrink-0" />
                    <div>
                      <div className="font-semibold text-base sm:text-lg md:text-xl">2</div>
                      <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{t('property.parking')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {property.description && (
              <Card className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 backdrop-blur-xl border-orange-200/40 dark:border-orange-700/40 mb-8">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('property.description')}</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="property-description">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Amenities & Features */}
            <Card className="bg-gradient-to-bl from-indigo-50/80 to-cyan-50/80 dark:from-indigo-900/20 dark:to-cyan-900/20 backdrop-blur-xl border-indigo-200/40 dark:border-indigo-700/40 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('property.featuresAmenities')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.features?.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">{t('property.features')}</h4>
                      <div className="space-y-2">
                        {property.features.map((feature, index) => {
                          // Try to translate the key, fallback to the original value if translation doesn't exist
                          const translatedFeature = t(`property.features.${feature}`) !== `property.features.${feature}` 
                            ? t(`property.features.${feature}`) 
                            : feature;
                          return (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-muted-foreground">{translatedFeature}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-2">{t('property.features')}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">{t('property.features.centralAC')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">{t('property.features.hardwoodFloors')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">{t('property.features.modernKitchen')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {property.amenities?.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">{t('property.amenities')}</h4>
                      <div className="space-y-2">
                        {property.amenities.map((amenity, index) => {
                          // Try to translate the key, fallback to the original value if translation doesn't exist
                          const translatedAmenity = t(`property.amenities.${amenity}`) !== `property.amenities.${amenity}` 
                            ? t(`property.amenities.${amenity}`) 
                            : amenity;
                          return (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-muted-foreground">{translatedAmenity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-2">{t('property.amenities')}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">{t('property.amenities.gardenPatio')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">{t('property.amenities.securitySystem')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">{t('property.amenities.garageParking')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card className="bg-gradient-to-tr from-rose-50/80 to-pink-50/80 dark:from-rose-900/20 dark:to-pink-900/20 backdrop-blur-xl border-rose-200/40 dark:border-rose-700/40">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('property.propertyInformation')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left">
                  <div className="text-left">
                    <span className="text-muted-foreground">{t('property.propertyType')}: </span>
                    <span className="font-medium capitalize bg-orange-500 text-white dark:bg-orange-600 px-2 py-1 rounded-md text-xs">
                      {t(`filter.${property.type}`) !== `filter.${property.type}` 
                        ? t(`filter.${property.type}`) 
                        : property.type}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-muted-foreground">{t('property.listed')}: </span>
                    <span className="font-medium bg-blue-100 dark:bg-blue-700 px-2 py-1 rounded-md text-xs">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-muted-foreground">{t('property.status')}: </span>
                    <Badge variant="secondary" className="capitalize bg-green-500 text-white dark:bg-green-600 text-xs">
                      {t(`property.status.${property.status}`) !== `property.status.${property.status}` 
                        ? t(`property.status.${property.status}`) 
                        : property.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-1">
            <ContactForm property={property} agent={property.agent || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
