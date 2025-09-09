import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import Navigation from "@/components/navigation";
import ContactForm from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import { useProperty, useAddToFavorites, useRemoveFromFavorites, useIsFavorite } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import type { Property } from "@/types";
import { 
  Heart, Bed, Bath, Square, Car, MapPin, ArrowLeft, 
  Share2, ChevronLeft, ChevronRight, Check, Calendar,
  Eye, Phone, MessageSquare, Mail, Sun, Moon
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `Check out this property: ${property?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // User canceled the share or share failed - silently handle this
        // Only show error for actual failures, not cancellations
        if (error instanceof Error && !error.message.includes('canceled') && !error.message.includes('cancelled')) {
          // Fallback to clipboard
          navigator.clipboard.writeText(window.location.href);
          toast({
            title: "Link copied",
            description: "Property link has been copied to clipboard.",
          });
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Property link has been copied to clipboard.",
      });
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
          title={`${property.title} - ${formatPrice(property.price, property.currency || 'USD', property.listingType)} | EstateAI`}
          description={`${property.description || `${property.bedrooms} bedroom ${property.type} for ${property.listingType} in ${property.city}, ${property.country}.`} View details, photos, and contact information.`}
          keywords={`${property.type}, ${property.city}, ${property.country}, ${property.listingType}, real estate, property, ${property.bedrooms} bedroom, ${property.bathrooms} bathroom`}
          ogImage={property.images && property.images.length > 0 ? property.images[0] : undefined}
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
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={prevImage}
                  data-testid="prev-image-button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
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
                    ? 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200' 
                    : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-700'
                }`}
                data-testid="favorite-button"
              >
                <Heart className={`h-4 w-4 transition-all duration-200 ${
                  isFavorite ? 'fill-current scale-110' : 'hover:scale-105'
                }`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleShare}
                className="bg-white/80 hover:bg-white"
                data-testid="share-button"
              >
                <Share2 className="h-4 w-4" />
              </Button>
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1 mb-6 md:mb-0">
                  <div className="flex items-center flex-wrap gap-3 mb-4">
                    <Badge className={`px-4 py-2 text-sm font-semibold rounded-full ${
                      property.listingType === 'sale' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}>
                      {property.listingType === 'sale' ? t('filter.forSale') : t('filter.forRent')}
                    </Badge>
                    {property.isFeatured && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 text-sm font-semibold rounded-full">✨ Featured</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight" data-testid="property-title">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 dark:text-gray-400 text-lg">
                    <MapPin className="h-5 w-5 mr-2 text-red-500" />
                    <p data-testid="property-address" className="font-medium">
                      {property.address}, {property.city}, {property.country}
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl mb-3">
                    <div className="text-4xl font-bold" data-testid="property-price">
                      {formatPrice(property.price, property.currency, property.listingType)}
                    </div>
                    {property.area && (
                      <div className="text-blue-100 text-sm font-medium mt-1">
                        ${Math.round(parseFloat(property.price) / property.area)}/sq ft
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {property.bedrooms && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-md border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow" data-testid="bedrooms-info">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Bed className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{property.bedrooms}</div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">Bedrooms</div>
                </div>
              )}
              {property.bathrooms && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-md border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow" data-testid="bathrooms-info">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Bath className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{property.bathrooms}</div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">Bathrooms</div>
                </div>
              )}
              {property.area && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-md border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow" data-testid="area-info">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Square className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{property.area.toLocaleString()}</div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">Sq Ft</div>
                </div>
              )}
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-md border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Car className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">2</div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">Parking</div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 mb-8">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-4">
                    <div className="w-6 h-6 bg-blue-600 dark:bg-blue-400 rounded"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">About This Property</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg" data-testid="property-description">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities & Features */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-4">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Features & Amenities</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {property.features?.length > 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Property Features</h4>
                    <div className="space-y-3">
                      {property.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="bg-green-100 dark:bg-green-900 p-1.5 rounded-full">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Property Features</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 dark:bg-green-900 p-1.5 rounded-full">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Central Air Conditioning</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 dark:bg-green-900 p-1.5 rounded-full">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Hardwood Floors</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 dark:bg-green-900 p-1.5 rounded-full">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Modern Kitchen</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {property.amenities?.length > 0 ? (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Building Amenities</h4>
                    <div className="space-y-3">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full">
                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Building Amenities</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full">
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Garden & Patio</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full">
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Security System</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full">
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Garage Parking</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Property Stats */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-4">
                  <div className="w-6 h-6 bg-purple-600 dark:bg-purple-400 rounded"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Property Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Property Type</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">{property.type}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Status</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 capitalize px-3 py-1">{property.status}</Badge>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Listed Date</span>
                    <div className="flex items-center text-gray-900 dark:text-white font-semibold">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      {new Date(property.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Views</span>
                    <div className="flex items-center text-gray-900 dark:text-white font-semibold">
                      <Eye className="h-4 w-4 mr-2 text-green-600" />
                      {property.views}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
