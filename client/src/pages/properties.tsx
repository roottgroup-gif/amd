import { useState, useEffect, useCallback, useMemo } from "react";
import Navigation from "@/components/navigation";
import PropertyCard from "@/components/property-card";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "@/lib/i18n";
import { useProperties } from "@/hooks/use-properties";
import type { PropertyFilters, AISearchResponse } from "@/types";
import {
  Search,
  Filter,
  Grid,
  List,
  MapPin,
  Home,
  Building,
  Castle,
  Mountain,
  Tag,
  Key,
  Bed,
  Bath,
} from "lucide-react";

export default function PropertiesPage() {
  const { t, language } = useTranslation();
  const [filters, setFilters] = useState<PropertyFilters>({
    sortBy: "date",
    sortOrder: "desc",
    limit: 20,
    offset: 0,
    language: language,
  });
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [cityInput, setCityInput] = useState("");
  const [searchResults, setSearchResults] = useState<AISearchResponse | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: properties, isLoading } = useProperties(filters);

  // Filter properties by language when language changes
  useEffect(() => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      language: language,
      offset: 0, // Reset pagination when language changes
    }));
  }, [language]);

  // Debounced city filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        city: cityInput.trim() || undefined,
        offset: 0,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [cityInput]);

  const handleFilterChange = useCallback(
    (key: keyof PropertyFilters, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]:
          value === "all" || value === "any" || value === ""
            ? undefined
            : value,
        offset: 0, // Reset pagination when filters change
      }));
    },
    [],
  );

  // Auto-apply price range with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        offset: 0,
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [priceRange]);

  const handleSearchResults = (results: AISearchResponse) => {
    setSearchResults(results);
    setFilters((prev) => ({ ...prev, ...results.filters }));
  };

  const clearFilters = useCallback(() => {
    setFilters({
      sortBy: "date",
      sortOrder: "desc",
      limit: 20,
      offset: 0,
      language: language, // Retain current language when clearing filters
    });
    setPriceRange([0, 1000000]);
    setCityInput("");
    setSearchResults(null);
  }, [language]);

  const displayProperties = searchResults
    ? searchResults.results
    : properties || [];

  // Generate properties page structured data
  const getPropertiesStructuredData = () => {
    const totalProperties = properties?.length || 0;
    const currentFilter = filters.listingType || "all";
    const currentType = filters.type || "all";
    const currentCity = filters.city || "Kurdistan";

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Properties for ${currentFilter === "all" ? "Sale & Rent" : currentFilter} in ${currentCity}`,
      description: `Browse ${totalProperties} ${currentType !== "all" ? currentType : "property"} listings for ${currentFilter === "all" ? "sale and rent" : currentFilter} in ${currentCity}, Iraq. Find your perfect home with detailed property information and expert agents.`,
      numberOfItems: totalProperties,
      itemListElement:
        displayProperties?.slice(0, 10).map((property, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "RealEstateListing",
            name: property.title,
            url: `${window.location.origin}/property/${property.id}`,
            image:
              property.images && property.images.length > 0
                ? property.images.map((img) =>
                    img.startsWith("http")
                      ? img
                      : `${window.location.origin}${img}`,
                  )
                : [],
            address: {
              "@type": "PostalAddress",
              streetAddress: property.address,
              addressLocality: property.city,
              addressCountry: property.country,
            },
            offers: {
              "@type": "Offer",
              priceCurrency: property.currency || "USD",
              price: property.price,
              availability: "https://schema.org/InStock",
              priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0], // 30 days from now
            },
          },
        })) || [],
    };
  };

  // Generate dynamic SEO content based on filters
  const getSEOContent = () => {
    const listingType = filters.listingType || "sale and rent";
    const propertyType = filters.type || "properties";
    const city = filters.city || "Kurdistan";
    const totalCount = properties?.length || 0;

    const title = `${propertyType.charAt(0).toUpperCase()}${propertyType.slice(1)} for ${listingType.charAt(0).toUpperCase()}${listingType.slice(1)} in ${city} | MapEstate`;
    const description = `Browse ${totalCount > 0 ? totalCount : ""} ${propertyType} for ${listingType} in ${city}, Iraq. Find houses, apartments, villas and land with detailed property information, photos, and expert real estate agents.`;
    const keywords = `${propertyType} for ${listingType} ${city}, real estate ${city} Iraq, ${propertyType} listings ${city}, buy rent ${propertyType} Iraq, ${city} real estate agent, property finder ${city}`;

    return { title, description, keywords };
  };

  const seoContent = getSEOContent();

  return (
    <div className="properties-page min-h-screen bg-background">
      <SEOHead
        title={seoContent.title}
        description={seoContent.description}
        keywords={seoContent.keywords}
        ogImage={
          properties && properties.length > 0
            ? properties[0].images?.[0]
            : undefined
        }
        canonicalUrl={`${window.location.origin}/properties`}
        structuredData={getPropertiesStructuredData()}
      />
      <Navigation />

      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="text-3xl font-bold mb-4"
            data-testid="properties-title"
          >
            {t('properties.title')}
          </h1>
          <SearchBar onResults={handleSearchResults} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    {t('properties.filters')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="clear-filters"
                  >
                    {t('properties.clear')}
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Listing Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t('filter.listingType')}
                    </label>
                    <Select
                      value={filters.listingType || ""}
                      onValueChange={(value) =>
                        handleFilterChange("listingType", value || undefined)
                      }
                    >
                      <SelectTrigger data-testid="listing-type-select">
                        <SelectValue placeholder={t('properties.allTypes')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <span className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            {t('properties.allTypes')}
                          </span>
                        </SelectItem>
                        <SelectItem value="sale">
                          <span className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {t('filter.forSale')}
                          </span>
                        </SelectItem>
                        <SelectItem value="rent">
                          <span className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            {t('filter.forRent')}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t('filter.propertyType')}
                    </label>
                    <Select
                      value={filters.type || ""}
                      onValueChange={(value) =>
                        handleFilterChange("type", value || undefined)
                      }
                    >
                      <SelectTrigger data-testid="property-type-select">
                        <SelectValue placeholder={t('properties.allProperties')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <span className="flex items-center gap-2">
                            <Home
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            {t('properties.allProperties')}
                          </span>
                        </SelectItem>
                        <SelectItem value="house">
                          <span className="flex items-center gap-2">
                            <Home
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            House
                          </span>
                        </SelectItem>
                        <SelectItem value="apartment">
                          <span className="flex items-center gap-2">
                            <Building
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            Apartment
                          </span>
                        </SelectItem>
                        <SelectItem value="villa">
                          <span className="flex items-center gap-2">
                            <Castle
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            Villa
                          </span>
                        </SelectItem>
                        <SelectItem value="land">
                          <span className="flex items-center gap-2">
                            <Mountain
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            Land
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Price Range: ${priceRange[0].toLocaleString()} - $
                      {priceRange[1].toLocaleString()}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000000}
                      step={10000}
                      className="mt-2"
                      data-testid="price-range-slider"
                    />
                  </div>

                  {/* Bedrooms */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Bedrooms
                    </label>
                    <Select
                      value={filters.bedrooms?.toString() || ""}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "bedrooms",
                          value ? parseInt(value) : undefined,
                        )
                      }
                    >
                      <SelectTrigger data-testid="bedrooms-select">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">
                          <span className="flex items-center gap-2">
                            <Bed
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            Any
                          </span>
                        </SelectItem>
                        <SelectItem value="1">
                          <span className="flex items-center gap-2">
                            <Bed
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            1+
                          </span>
                        </SelectItem>
                        <SelectItem value="2">
                          <span className="flex items-center gap-2">
                            <Bed
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            2+
                          </span>
                        </SelectItem>
                        <SelectItem value="3">
                          <span className="flex items-center gap-2">
                            <Bed
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            3+
                          </span>
                        </SelectItem>
                        <SelectItem value="4">
                          <span className="flex items-center gap-2">
                            <Bed
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            4+
                          </span>
                        </SelectItem>
                        <SelectItem value="5">
                          <span className="flex items-center gap-2">
                            <Bed
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            5+
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Bathrooms
                    </label>
                    <Select
                      value={filters.bathrooms?.toString() || ""}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "bathrooms",
                          value ? parseInt(value) : undefined,
                        )
                      }
                    >
                      <SelectTrigger data-testid="bathrooms-select">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">
                          <span className="flex items-center gap-2">
                            <Bath
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            Any
                          </span>
                        </SelectItem>
                        <SelectItem value="1">
                          <span className="flex items-center gap-2">
                            <Bath
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            1+
                          </span>
                        </SelectItem>
                        <SelectItem value="2">
                          <span className="flex items-center gap-2">
                            <Bath
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            2+
                          </span>
                        </SelectItem>
                        <SelectItem value="3">
                          <span className="flex items-center gap-2">
                            <Bath
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            3+
                          </span>
                        </SelectItem>
                        <SelectItem value="4">
                          <span className="flex items-center gap-2">
                            <Bath
                              className="h-4 w-4"
                              style={{ color: "#FF7800" }}
                            />
                            4+
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      City
                    </label>
                    <Input
                      placeholder="Enter city..."
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      data-testid="city-input"
                    />
                  </div>
                </div>

                {/* Active Filters Display */}
                <div className="mt-4">
                  {(filters.type ||
                    filters.listingType ||
                    filters.bedrooms ||
                    filters.bathrooms ||
                    filters.city ||
                    filters.minPrice ||
                    filters.maxPrice) && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Active Filters:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {filters.type && (
                          <Badge
                            className="flex items-center gap-1"
                            style={{
                              backgroundColor: "#bdd479",
                              color: "#000",
                            }}
                          >
                            {filters.type === "house" && (
                              <Home className="h-3 w-3" />
                            )}
                            {filters.type === "apartment" && (
                              <Building className="h-3 w-3" />
                            )}
                            {filters.type === "villa" && (
                              <Castle className="h-3 w-3" />
                            )}
                            {filters.type === "land" && (
                              <Mountain className="h-3 w-3" />
                            )}
                            {filters.type === "house" && "House"}
                            {filters.type === "apartment" && "Apartment"}
                            {filters.type === "villa" && "Villa"}
                            {filters.type === "land" && "Land"}
                          </Badge>
                        )}
                        {filters.listingType && (
                          <Badge
                            className="flex items-center gap-1"
                            style={{
                              backgroundColor: "#bdd479",
                              color: "#000",
                            }}
                          >
                            {filters.listingType === "sale" ? (
                              <Tag className="h-3 w-3" />
                            ) : (
                              <Key className="h-3 w-3" />
                            )}
                            {filters.listingType === "sale"
                              ? "For Sale"
                              : "For Rent"}
                          </Badge>
                        )}
                        {filters.bedrooms && (
                          <Badge
                            className="flex items-center gap-1"
                            style={{
                              backgroundColor: "#bdd479",
                              color: "#000",
                            }}
                          >
                            <Bed className="h-3 w-3" />
                            {filters.bedrooms}+ Beds
                          </Badge>
                        )}
                        {filters.bathrooms && (
                          <Badge
                            className="flex items-center gap-1"
                            style={{
                              backgroundColor: "#bdd479",
                              color: "#000",
                            }}
                          >
                            <Bath className="h-3 w-3" />
                            {filters.bathrooms}+ Baths
                          </Badge>
                        )}
                        {filters.city && (
                          <Badge
                            className="flex items-center gap-1"
                            style={{
                              backgroundColor: "#bdd479",
                              color: "#000",
                            }}
                          >
                            <MapPin className="h-3 w-3" />
                            {filters.city}
                          </Badge>
                        )}
                        {(filters.minPrice || filters.maxPrice) && (
                          <Badge
                            style={{
                              backgroundColor: "#bdd479",
                              color: "#000",
                            }}
                          >
                            $
                            {filters.minPrice
                              ? filters.minPrice.toLocaleString()
                              : "0"}{" "}
                            - $
                            {filters.maxPrice
                              ? filters.maxPrice.toLocaleString()
                              : "1M+"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2
                  className="text-lg font-semibold"
                  data-testid="results-count"
                >
                  {isLoading
                    ? "Loading..."
                    : `${displayProperties.length} Properties Found`}
                </h2>
                {searchResults && (
                  <span className="text-sm text-muted-foreground">
                    Search: "{searchResults.query}"
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort By */}
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split("-");
                    handleFilterChange("sortBy", sortBy);
                    handleFilterChange("sortOrder", sortOrder);
                  }}
                >
                  <SelectTrigger className="w-48" data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="views-desc">Most Popular</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    data-testid="grid-view-button"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    data-testid="list-view-button"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Properties Grid/List */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayProperties.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {displayProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    className={viewMode === "list" ? "flex flex-row" : ""}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Properties Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters to find more
                  properties.
                </p>
                <Button
                  onClick={clearFilters}
                  data-testid="clear-filters-no-results"
                >
                  Clear All Filters
                </Button>
              </Card>
            )}

            {/* Load More Button */}
            {displayProperties.length > 0 &&
              displayProperties.length >= (filters.limit || 20) && (
                <div className="text-center mt-8">
                  <Button
                    onClick={() =>
                      handleFilterChange("limit", (filters.limit || 20) + 20)
                    }
                    data-testid="load-more-button"
                  >
                    Load More Properties
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
