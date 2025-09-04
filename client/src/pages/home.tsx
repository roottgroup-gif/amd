import { useState, useRef } from "react";
import { Link } from "wouter";
import SearchBar from "@/components/search-bar";
import PropertyCard from "@/components/property-card";
import PropertyMap from "@/components/property-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { useFeaturedProperties, useProperties } from "@/hooks/use-properties";
import type { Property, AISearchResponse, PropertyFilters } from "@/types";
import { Tag, Key, Home, Building2, MapPin, Filter, DollarSign, Bed, Bath, Menu, Search, X, User, Heart, Settings, LogOut } from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const { data: featuredProperties, isLoading: featuredLoading } = useFeaturedProperties();
  const [searchResults, setSearchResults] = useState<AISearchResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('sale');
  const [mapFilters, setMapFilters] = useState<PropertyFilters>({
    limit: 100 // Get more properties for the map
  });
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [cityInput, setCityInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load properties for the map with current filters
  const { data: mapProperties } = useProperties(mapFilters);

  const handleSearchResults = (results: AISearchResponse) => {
    setSearchResults(results);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleMapFilterChange = (filters: PropertyFilters) => {
    setMapFilters({
      ...filters,
      limit: 100 // Always maintain the limit for map
    });
  };

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    const newFilters = { ...mapFilters };
    
    // Handle "all", "any", and empty values by removing the filter
    if (value === 'all' || value === 'any' || value === '' || value === null || value === undefined) {
      delete newFilters[key];
    } else {
      // Special handling for numbers
      if (key === 'bedrooms' || key === 'bathrooms') {
        newFilters[key] = parseInt(value);
      } else {
        newFilters[key] = value as any;
      }
    }
    
    // Always maintain the limit for map properties
    newFilters.limit = 100;
    
    setMapFilters(newFilters);
  };

  const handlePriceRangeChange = (range: number[]) => {
    setPriceRange(range);
    const newFilters = {
      ...mapFilters,
      minPrice: range[0] > 0 ? range[0] : undefined,
      maxPrice: range[1] < 1000000 ? range[1] : undefined,
      limit: 100
    };
    setMapFilters(newFilters);
  };

  const handleCityChange = (city: string) => {
    setCityInput(city);
    // Debounce the filter change
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      const newFilters = {
        ...mapFilters,
        city: city.trim() || undefined,
        limit: 100
      };
      setMapFilters(newFilters);
    }, 500);
  };

  const clearFilters = () => {
    setMapFilters({ limit: 100 });
    setPriceRange([0, 1000000]);
    setCityInput('');
  };

  return (
    <div className="map-page h-screen w-full bg-background relative">
      {/* Full Screen Map Section */}
      <section className="h-full w-full relative">
        <PropertyMap 
          properties={mapProperties || []}
          filters={mapFilters}
          onFilterChange={handleMapFilterChange}
          onPropertyClick={(property) => {
            window.location.href = `/property/${property.id}`;
          }}
          className="h-full w-full"
        />
        
        {/* Absolute Blurred Filter Section inside Map */}
        <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-[9999] max-h-[calc(100vh-120px)] max-h-[calc(100dvh-120px)] overflow-hidden" style={{position: 'absolute'}}>
          <div className={`bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl max-h-full overflow-y-auto ${showFilters ? 'p-3 sm:p-4 md:p-6' : 'p-2 sm:p-3'}`}>
            <div className={`flex items-center justify-between ${showFilters ? 'mb-3 sm:mb-4' : 'mb-1 sm:mb-2'}`}>
            <div className="flex items-center gap-1 sm:gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" style={{color: '#FF7800'}} />
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-black dark:text-white">Property Filters</h2>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs hidden sm:inline-flex" style={{backgroundColor: '#FF7800', color: '#000'}}>
                {(mapProperties || []).length} properties
              </Badge>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="text-black hover:text-black dark:text-gray-300 dark:hover:text-white text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                data-testid="toggle-filters"
              >
                {showFilters ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline ml-1">{showFilters ? 'Hide' : 'Show'} Filters</span>
                <span className="sm:hidden ml-1"></span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-black hover:text-black dark:text-gray-300 dark:hover:text-white text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                    data-testid="menu-button"
                  >
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/30 dark:border-white/10"
                >
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <Heart className="h-4 w-4" />
                    <span>Favorites</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <Home className="h-4 w-4" />
                    <span>My Properties</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* AI Search Bar */}
          {showFilters && (
            <div className="mb-3 sm:mb-4">
              <SearchBar 
                onResults={handleSearchResults}
                placeholder="Ask AI: 'Find me a 3-bedroom villa under $300k in Erbil'"
                className="w-full"
              />
            </div>
          )}

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 border-t border-white/20 dark:border-white/10">
              {/* Listing Type */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-black dark:text-gray-300 flex items-center gap-1">
                  <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Listing Type</span>
                  <span className="sm:hidden">Type</span>
                </label>
                <Select 
                  value={mapFilters.listingType || ''} 
                  onValueChange={(value) => handleFilterChange('listingType', value)}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-white/20" data-testid="listing-type-select">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-black dark:text-gray-300 flex items-center gap-1">
                  <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Property Type</span>
                  <span className="sm:hidden">Property</span>
                </label>
                <Select 
                  value={mapFilters.type || ''} 
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-white/20" data-testid="property-type-select">
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">All Properties</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bedrooms */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-black dark:text-gray-300 flex items-center gap-1">
                  <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Bedrooms</span>
                  <span className="sm:hidden">Beds</span>
                </label>
                <Select 
                  value={mapFilters.bedrooms?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('bedrooms', (value === 'any' || !value) ? undefined : parseInt(value))}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-white/20" data-testid="bedrooms-select">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-black dark:text-gray-300 flex items-center gap-1">
                  <Bath className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Bathrooms</span>
                  <span className="sm:hidden">Baths</span>
                </label>
                <Select 
                  value={mapFilters.bathrooms?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('bathrooms', (value === 'any' || !value) ? undefined : parseInt(value))}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-white/20" data-testid="bathrooms-select">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-black dark:text-gray-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  City
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Erbil, Baghdad"
                  value={cityInput}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-white/20"
                  data-testid="city-input"
                />
              </div>

              {/* Clear Filters */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-transparent">Clear</label>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full bg-white/50 dark:bg-black/50 backdrop-blur-sm border-white/30 dark:border-white/20 hover:bg-white/70 dark:hover:bg-black/70"
                  data-testid="clear-filters"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Price Range Slider */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 dark:border-white/10">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs sm:text-sm font-medium text-black dark:text-gray-300 flex items-center gap-1 flex-wrap">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Price Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}</span>
                  <span className="sm:hidden">Price: ${priceRange[0] < 1000 ? priceRange[0] : Math.round(priceRange[0]/1000) + 'K'} - ${priceRange[1] < 1000 ? priceRange[1] : Math.round(priceRange[1]/1000) + 'K'}</span>
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={1000000}
                  min={0}
                  step={10000}
                  className="w-full"
                  data-testid="price-range-slider"
                />
                <div className="flex justify-between text-xs text-black dark:text-gray-400">
                  <span>$0</span>
                  <span>$1M+</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(mapFilters.listingType || mapFilters.type || mapFilters.bedrooms || mapFilters.bathrooms || mapFilters.city || mapFilters.minPrice || mapFilters.maxPrice) && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 dark:border-white/10">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-black dark:text-gray-300">Active filters:</span>
                {mapFilters.listingType && (
                  <Badge variant="secondary" className="text-xs" style={{backgroundColor: '#FF7800', color: '#000'}}>
                    {mapFilters.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                  </Badge>
                )}
                {mapFilters.type && (
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs">
                    {mapFilters.type.charAt(0).toUpperCase() + mapFilters.type.slice(1)}
                  </Badge>
                )}
                {mapFilters.bedrooms && (
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs">
                    {mapFilters.bedrooms}+ bed
                  </Badge>
                )}
                {mapFilters.bathrooms && (
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs">
                    {mapFilters.bathrooms}+ bath
                  </Badge>
                )}
                {mapFilters.city && (
                  <Badge variant="secondary" className="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-xs">
                    {mapFilters.city}
                  </Badge>
                )}
                {(mapFilters.minPrice || mapFilters.maxPrice) && (
                  <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                    ${mapFilters.minPrice ? mapFilters.minPrice.toLocaleString() : '0'} - ${mapFilters.maxPrice ? mapFilters.maxPrice.toLocaleString() : '1M+'}
                  </Badge>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
        
        {/* Search Results inside Map */}
        {searchResults && (
          <div className="absolute top-4 left-4 right-4 z-40 mt-64 max-h-[calc(100vh-300px)] max-h-[calc(100dvh-300px)] overflow-hidden">
            <Card className="bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-2xl h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-black dark:text-white">AI Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto flex-1">
                  {searchResults.results.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
