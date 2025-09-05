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
import type { Property } from "@/types";
import { 
  Heart, Bed, Bath, Square, Car, MapPin, ArrowLeft, 
  Share2, ChevronLeft, ChevronRight, Check, Calendar,
  Eye, Phone, MessageSquare, Mail
} from "lucide-react";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userId] = useState("demo-user-id"); // In real app, get from auth context

  const { data: property, isLoading, error } = useProperty(id!);
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  const { data: favoriteData } = useIsFavorite(userId, id || "");

  const isFavorite = favoriteData?.isFavorite || false;

  useEffect(() => {
    if (property) {
      document.title = `${property.title} - EstateAI`;
    }
  }, [property]);

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: `Check out this property: ${property?.title}`,
        url: window.location.href,
      });
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
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="back-button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black/90 text-gray-900 dark:text-white border border-white/20 dark:border-white/20"
                  onClick={prevImage}
                  data-testid="prev-image-button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black/90 text-gray-900 dark:text-white border border-white/20 dark:border-white/20"
                  onClick={nextImage}
                  data-testid="next-image-button"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image Counter */}
                <div className="absolute top-4 left-4 bg-black/70 dark:bg-white/80 text-white dark:text-gray-900 px-3 py-1 rounded-full text-sm font-medium border border-white/20 dark:border-black/20">
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
                className={`bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black/90 border border-white/20 dark:border-white/20 ${isFavorite ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
                data-testid="favorite-button"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleShare}
                className="bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black/90 text-gray-900 dark:text-white border border-white/20 dark:border-white/20"
                data-testid="share-button"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-primary shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 p-6 bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10">
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
                    <span className="text-muted-foreground">Views:</span>
                    <span className="font-medium">
                      <Eye className="inline h-4 w-4 mr-1" />
                      {property.views}
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
