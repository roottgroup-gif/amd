import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useAddToFavorites, useRemoveFromFavorites, useIsFavorite } from "@/hooks/use-properties";
import { useState } from "react";
import type { Property } from "@/types";
import { Heart, Bed, Bath, Square, MapPin, User, ChevronLeft, ChevronRight, Loader2, Phone, MessageCircle } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  userId?: string;
  className?: string;
}

export default function PropertyCard({ property, userId, className }: PropertyCardProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  const { data: favoriteData } = useIsFavorite(userId || "", property.id);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const isFavorite = favoriteData?.isFavorite || false;
  
  // Get all images or use default if no images
  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'];
  
  const hasMultipleImages = images.length > 1;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) return;

    try {
      if (isFavorite) {
        await removeFromFavorites.mutateAsync({ userId, propertyId: property.id });
      } else {
        await addToFavorites.mutateAsync({ userId, propertyId: property.id });
      }
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price: string, currency: string, listingType: string) => {
    const amount = parseFloat(price);
    const formattedAmount = new Intl.NumberFormat().format(amount);
    const suffix = listingType === 'rent' ? '/mo' : '';
    return `${currency === 'USD' ? '$' : currency}${formattedAmount}${suffix}`;
  };

  const handleViewProperty = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsNavigating(true);
    
    // Add a small delay to show the loading state for professional feel
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Navigate to property detail page
    navigate(`/property/${property.id}`);
  };


  return (
    <Card 
      className={`property-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${className}`}
      data-testid={`property-card-${property.id}`}
    >
      <div className="relative">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={images[currentImageIndex]}
            alt={property.title}
            className="w-full h-48 object-cover transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
            }}
          />
          
          {/* Navigation arrows - only show if multiple images */}
          {hasMultipleImages && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* Image counter */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
        
        <Badge 
          className={`absolute top-4 left-4 ${
            property.listingType === 'sale' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-emerald-600 text-white'
          }`}
        >
          {property.listingType === 'sale' ? t('filter.forSale') : t('filter.forRent')}
        </Badge>
        
        {userId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteClick}
            className={`absolute top-4 right-4 rounded-full p-2 transition-all duration-200 ${
              isFavorite 
                ? 'bg-red-50 hover:bg-red-100 text-red-500 border border-red-200' 
                : 'bg-black/50 hover:bg-black/70 text-white'
            }`}
            data-testid={`favorite-button-${property.id}`}
          >
            <Heart className={`h-4 w-4 transition-all duration-200 ${
              isFavorite ? 'fill-current scale-110' : 'hover:scale-105'
            }`} />
          </Button>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate" data-testid={`property-title-${property.id}`}>
            {property.title}
          </h3>
          <span 
            className="text-2xl font-bold text-orange-600 dark:text-orange-400"
            data-testid={`property-price-${property.id}`}
          >
            {formatPrice(property.price, property.currency, property.listingType)}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <p className="truncate" data-testid={`property-address-${property.id}`}>
            {property.address}, {property.city}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
          {property.bedrooms && (
            <span className="flex items-center">
              <Bed className="h-4 w-4 mr-1" style={{color: '#FF7800'}} />
              {property.bedrooms} {t('property.beds')}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center">
              <Bath className="h-4 w-4 mr-1" style={{color: '#FF7800'}} />
              {property.bathrooms} {t('property.baths')}
            </span>
          )}
          {property.area && (
            <span className="flex items-center">
              <Square className="h-4 w-4 mr-1" style={{color: '#FF7800'}} />
              {property.area.toLocaleString()} {t('property.sqft')}
            </span>
          )}
        </div>
        
        {/* Contact Information */}
        {((property as any).contactPhone || property.agent?.phone) && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {(property as any).contactPhone || property.agent?.phone}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const phone = (property as any).contactPhone || property.agent?.phone;
                  window.open(`tel:${phone}`, '_self');
                }}
                data-testid={`call-button-${property.id}`}
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const phone = (property as any).contactPhone || property.agent?.phone;
                  // Format phone number for WhatsApp (remove any non-digits except +)
                  const whatsappPhone = phone.replace(/[^\d+]/g, '');
                  const message = encodeURIComponent(`Hi! I'm interested in the property: ${property.title}. Could you please provide more information?`);
                  window.open(`https://wa.me/${whatsappPhone}?text=${message}`, '_blank');
                }}
                data-testid={`whatsapp-button-${property.id}`}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                WhatsApp
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {property.agent && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {property.agent.firstName} {property.agent.lastName}
              </span>
            </div>
          )}
          
          <Button 
            onClick={handleViewProperty}
            disabled={isNavigating}
            className="ml-auto"
            data-testid={`view-details-button-${property.id}`}
          >
            {isNavigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              t('property.viewDetails')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
