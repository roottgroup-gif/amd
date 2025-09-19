import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import {
  useAddToFavorites,
  useRemoveFromFavorites,
  useIsFavorite,
} from "@/hooks/use-properties";
import { useState, useEffect } from "react";
import type { Property } from "@/types";
import {
  Heart,
  Bed,
  Bath,
  Square,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Map,
} from "lucide-react";
import {
  formatPrice,
  formatPricePerUnit,
  useCurrencyConversion,
} from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

interface PropertyCardProps {
  property: Property;
  userId?: string;
  className?: string;
  onMapClick?: (property: Property) => void;
  showMapButton?: boolean;
}

export default function PropertyCard({
  property,
  userId,
  className,
  onMapClick,
  showMapButton = false,
}: PropertyCardProps) {
  const { t, getLocalized, isRTL } = useTranslation();
  const [, navigate] = useLocation();
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  const { data: favoriteData } = useIsFavorite(userId || "", property.id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { preferredCurrency } = useCurrency();
  const isFavorite = favoriteData?.isFavorite || false;

  // Get currency conversion rate if needed
  const conversionQuery = useCurrencyConversion(
    property.currency,
    preferredCurrency,
  );

  // Get all images or use default if no images
  const images =
    property.images && property.images.length > 0
      ? property.images
      : [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        ];

  const hasMultipleImages = images.length > 1;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) return;

    try {
      if (isFavorite) {
        await removeFromFavorites.mutateAsync({
          userId,
          propertyId: property.id,
        });
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

  // Calculate converted amount if currency conversion is available
  const baseAmount = parseFloat(property.price);
  const convertedAmount = conversionQuery.data?.convertedAmount
    ? conversionQuery.data.convertedAmount * baseAmount
    : baseAmount;
  const displayCurrency =
    property.currency === preferredCurrency
      ? property.currency
      : preferredCurrency;

  const handleViewProperty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Get current language prefix from URL to maintain language consistency
    const currentPath = window.location.pathname;
    const languageMatch = currentPath.match(/^\/(en|ar|kur)\//);
    const languagePrefix = languageMatch ? `/${languageMatch[1]}` : '/en'; // Default to English if no prefix found

    // Navigate to property detail page using slug if available, fallback to ID
    const identifier = property.slug || property.id;
    navigate(`${languagePrefix}/property/${identifier}`);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onMapClick) {
      onMapClick(property);
    }
  };

  return (
    <Card
      className={`property-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl shadow-lg group ${className}`}
      data-testid={`property-card-${property.id}`}
    >
      <div className="relative">
        <div className="relative h-48 sm:h-52 md:h-56 lg:h-48 xl:h-52 overflow-hidden">
          <OptimizedImage
            src={images[currentImageIndex]}
            alt={property.title}
            className="transition-transform duration-500 group-hover:scale-105"
            aspectRatio="3/2"
            objectFit="cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            fallbackSrc="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
            width={400}
            height={267}
          />

          {/* Navigation arrows - only show if multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Image counter */}
              <div
                className={`absolute bottom-2 ${isRTL ? "left-2" : "right-2"} bg-black/50 text-white px-2 py-1 rounded text-xs`}
              >
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        <Badge
          className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} ${
            property.listingType === "sale"
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          {property.listingType === "sale"
            ? t("filter.forSale")
            : t("filter.forRent")}
        </Badge>

        {userId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteClick}
            className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} rounded-full p-2 transition-all duration-200 ${
              isFavorite
                ? "bg-red-50 hover:bg-red-100 text-red-500 border border-red-200"
                : "bg-black/50 hover:bg-black/70 text-white"
            }`}
            data-testid={`favorite-button-${property.id}`}
          >
            <Heart
              className={`h-4 w-4 transition-all duration-200 ${
                isFavorite ? "fill-current scale-110" : "hover:scale-105"
              }`}
            />
          </Button>
        )}
      </div>

      <CardContent className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
          <h3
            className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white line-clamp-2 sm:line-clamp-1 flex-1 pr-2"
            data-testid={`property-title-${property.id}`}
            title={getLocalized(property.title, property.title)}
          >
            {getLocalized(property.title, property.title)}
          </h3>
          <span
            className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap"
            data-testid={`property-price-${property.id}`}
          >
            {formatPrice(
              property.price,
              property.currency,
              property.listingType,
              displayCurrency,
              convertedAmount,
              t,
            )}
          </span>
        </div>

        <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <p
            className="text-sm sm:text-base line-clamp-2 leading-relaxed"
            data-testid={`property-address-${property.id}`}
            title={`${property.address}, ${property.city}`}
          >
            {property.address}, {property.city}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
          {property.bedrooms && (
            <div className="flex items-center">
              <Bed
                className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                style={{ color: "#FF7800" }}
              />
              <span className="truncate">
                {property.bedrooms} {t("property.beds")}
              </span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center">
              <Bath
                className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                style={{ color: "#FF7800" }}
              />
              <span className="truncate">
                {property.bathrooms} {t("property.baths")}
              </span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center col-span-2 sm:col-span-1">
              <Square
                className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                style={{ color: "#FF7800" }}
              />
              <span className="truncate">
                {property.area.toLocaleString()} {t("property.sqFt")}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {property.agent && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                {property.agent.firstName} {property.agent.lastName}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {showMapButton && (
              <Button
                onClick={handleMapClick}
                variant="outline"
                size="sm"
                className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-600 px-3 h-8 sm:h-9"
                data-testid={`map-button-${property.id}`}
                title="Show on map"
              >
                <Map className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
            <Button
              onClick={handleViewProperty}
              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
              data-testid={`view-details-button-${property.id}`}
            >
              {t("property.viewDetails")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
