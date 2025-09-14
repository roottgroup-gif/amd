import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useParams, Link } from "wouter";
import Navigation from "@/components/navigation";
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
import { 
  Heart, Bed, Bath, Square, Car, MapPin, ArrowLeft, 
  ChevronLeft, ChevronRight, Check, Calendar,
  Eye, Phone, MessageSquare, Mail, Sun, Moon, Share2, Copy
} from "lucide-react";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userId] = useState("demo-user-id"); // In real app, get from auth context
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const { data: property, isLoading, error } = useProperty(id!);
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  const { data: favoriteData } = useIsFavorite(userId, id || "");

  const isFavorite = favoriteData?.isFavorite || false;

  // Generate property structured data
  const getPropertyStructuredData = (property: Property) => {
    const images = property.images && property.images.length > 0 ? property.images : [];
    
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": property.title,
      "description": property.description || `${property.title} in ${property.city}, ${property.country}`,
      "url": `${window.location.origin}/property/${property.id}`,
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
          title: "Removed from favorites",
          description: "Property has been removed from your favorites.",
        });
      } else {
        await addToFavorites.mutateAsync({ userId, propertyId: property.id });
        toast({
          title: "Added to favorites",
          description: "Property has been added to your favorites.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform?: string) => {
    if (!property) return;

    const propertyUrl = `${window.location.origin}/property/${property.id}`;
    const shareTitle = `${property.title} - MapEstate`;
    const shareText = `Check out this amazing ${property.type} in ${property.city}! ${formatPrice(property.price, property.currency || 'USD', property.listingType)}`;

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
            title: "Link Copied",
            description: "Property link has been copied to your clipboard.",
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
            title: "Link Copied",
            description: "Property link has been copied to your clipboard.",
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

  const formatPrice = (price: string, currency: string, listingType: string) => {
    const amount = parseFloat(price);
    const formattedAmount = new Intl.NumberFormat().format(amount);
    const suffix = listingType === 'rent' ? '/mo' : '';
    return `${currency === 'USD' ? '$' : currency}${formattedAmount}${suffix}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
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
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button>Back to Home</Button>
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
          title={`${property.title} - ${formatPrice(property.price, property.currency || 'USD', property.listingType)} | MapEstate`}
          description={`${property.description || `${property.bedrooms} bedroom ${property.type} for ${property.listingType} in ${property.city}, ${property.country}.`} View details, photos, and contact information.`}
          keywords={`${property.type}, ${property.city}, ${property.country}, ${property.listingType}, real estate, property, ${property.bedrooms} bedroom, ${property.bathrooms} bathroom`}
          ogImage={property.images && property.images.length > 0 ? property.images[0] : `${window.location.origin}/logo_1757848527935.png`}
          canonicalUrl={`${window.location.origin}/property/${property.id}`}
          structuredData={getPropertyStructuredData(property)}
        />
      )}
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Navigation with Back Button and Theme Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" data-testid="back-button">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
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
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
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
                    <span className="text-blue-600 mr-2">📘</span>
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')} data-testid="share-twitter">
                    <span className="text-blue-400 mr-2">🐦</span>
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')} data-testid="share-whatsapp">
                    <span className="text-green-600 mr-2">💬</span>
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('linkedin')} data-testid="share-linkedin">
                    <span className="text-blue-700 mr-2">💼</span>
                    Share on LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('copy')} data-testid="share-copy">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={property.listingType === 'sale' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-emerald-600 text-white'
                  }>
                    {property.listingType === 'sale' ? t('filter.forSale') : t('filter.forRent')}
                  </Badge>
                  {property.isFeatured && (
                    <Badge variant="secondary">Featured</Badge>
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
                  {formatPrice(property.price, property.currency, property.listingType)}
                </div>
                {property.area && (
                  <div className="text-sm text-muted-foreground">
                    ${Math.round(parseFloat(property.price) / property.area)}/sq ft
                  </div>
                )}
              </div>
            </div>

            {/* Property Features */}
            <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10 mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {property.bedrooms && (
                    <div className="text-center" data-testid="bedrooms-info">
                      <Bed className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="font-semibold text-lg">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center" data-testid="bathrooms-info">
                      <Bath className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="font-semibold text-lg">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                  )}
                  {property.area && (
                    <div className="text-center" data-testid="area-info">
                      <Square className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="font-semibold text-lg">{property.area.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Sq Ft</div>
                    </div>
                  )}
                  <div className="text-center">
                    <Car className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="font-semibold text-lg">2</div>
                    <div className="text-sm text-muted-foreground">Parking</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {property.description && (
              <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10 mb-8">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="property-description">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Amenities & Features */}
            <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Features & Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.features?.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="space-y-2">
                        {property.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Central Air Conditioning</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Hardwood Floors</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Modern Kitchen</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {property.amenities?.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">Amenities</h4>
                      <div className="space-y-2">
                        {property.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-2">Amenities</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Garden & Patio</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Security System</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Garage Parking</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Property Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Type:</span>
                    <span className="font-medium capitalize">{property.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Listed:</span>
                    <span className="font-medium">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary" className="capitalize">{property.status}</Badge>
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
